import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { ConversationStatus } from "../../../../../generated/prisma";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      return NextResponse.json({ error: "المحادثة غير موجودة" }, { status: 404 });
    }

    const updated = await prisma.conversation.update({
      where: { id },
      data: {
        status: ConversationStatus.CLOSED,
        closedAt: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Close Conversation API Error:", error);
    return NextResponse.json(
      { error: "حدث خطأ غير متوقع أثناء إغلاق المحادثة" },
      { status: 500 }
    );
  }
}
