import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        customer: true,
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "المحادثة غير موجودة" }, { status: 404 });
    }

    // Reset unread count since agent is viewing the conversation
    if (conversation.unreadCount > 0) {
      await prisma.conversation.update({
        where: { id },
        data: { unreadCount: 0 },
      });
      conversation.unreadCount = 0;
    }

    return NextResponse.json(conversation);
  } catch (error: any) {
    console.error("Fetch Conversation API Error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب تفاصيل المحادثة" },
      { status: 500 }
    );
  }
}
