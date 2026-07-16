import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { InstagramProvider } from "../../../../../lib/messaging/instagram/instagram-provider";
import { z } from "zod";
import {
  MessageDirection,
  SenderType,
  ReplySource,
  ContentType,
} from "../../../../../generated/prisma";

export const runtime = "nodejs";

const replySchema = z.object({
  text: z.string().trim().min(1, "لا يمكن إرسال رسالة فارغة").max(2000, "الرسالة طويلة جدًا (الحد الأقصى 2000 حرف)"),
});

const provider = new InstagramProvider();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await request.json();
    const result = replySchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "مدخلات غير صالحة";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { text } = result.data;

    // Fetch conversation and customer details
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        customer: true,
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "المحادثة غير موجودة" }, { status: 404 });
    }

    const recipientId = conversation.customer.externalUserId;

    // Send via Instagram API
    const sendResult = await provider.sendText(recipientId, text);

    if (!sendResult.success) {
      return NextResponse.json(
        { error: sendResult.error || "فشل إرسال الرسالة إلى إنستغرام" },
        { status: 500 }
      );
    }

    // Save to Database
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        externalMessageId: sendResult.messageId,
        direction: MessageDirection.OUTBOUND,
        senderType: SenderType.AGENT,
        replySource: ReplySource.HUMAN,
        contentType: ContentType.TEXT,
        text: text,
      },
    });

    // Update conversation lastMessageAt
    await prisma.conversation.update({
      where: { id },
      data: {
        lastMessageAt: new Date(),
      },
    });

    return NextResponse.json(message);
  } catch (error: any) {
    console.error("Manual Reply API Error:", error);
    return NextResponse.json(
      { error: "حدث خطأ غير متوقع أثناء إرسال الرد" },
      { status: 500 }
    );
  }
}
