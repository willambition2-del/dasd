import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { ConversationStatus, SenderType } from "../../../../generated/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 1. Total conversations
    const totalConversations = await prisma.conversation.count();

    // 2. Today's conversations
    const todayConversations = await prisma.conversation.count({
      where: {
        createdAt: {
          gte: startOfToday,
        },
      },
    });

    // 3. Today's messages
    const todayMessages = await prisma.message.count({
      where: {
        createdAt: {
          gte: startOfToday,
        },
      },
    });

    // 4. Today's bot replies
    const todayBotReplies = await prisma.message.count({
      where: {
        senderType: SenderType.BOT,
        createdAt: {
          gte: startOfToday,
        },
      },
    });

    // 5. Waiting agent count
    const waitingAgentCount = await prisma.conversation.count({
      where: {
        status: ConversationStatus.WAITING_AGENT,
      },
    });

    // 6. Human active count
    const humanActiveCount = await prisma.conversation.count({
      where: {
        status: ConversationStatus.HUMAN_ACTIVE,
      },
    });

    // 7. Recent conversations
    const recentConversations = await prisma.conversation.findMany({
      take: 5,
      orderBy: {
        lastMessageAt: "desc",
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            username: true,
            externalUserId: true,
          },
        },
      },
    });

    return NextResponse.json({
      totalConversations,
      todayConversations,
      todayMessages,
      todayBotReplies,
      waitingAgentCount,
      humanActiveCount,
      recentConversations,
    });
  } catch (error: any) {
    console.error("Dashboard Stats API Error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب إحصائيات لوحة التحكم" },
      { status: 500 }
    );
  }
}
