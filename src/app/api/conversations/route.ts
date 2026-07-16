import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { ConversationStatus } from "../../../generated/prisma";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") || "";
    const searchFilter = searchParams.get("search") || "";

    const whereClause: any = {};

    // 1. Status Filter
    if (statusFilter && Object.values(ConversationStatus).includes(statusFilter as ConversationStatus)) {
      whereClause.status = statusFilter as ConversationStatus;
    }

    // 2. Search Filter (customer name, username, externalUserId)
    if (searchFilter) {
      whereClause.customer = {
        OR: [
          { name: { contains: searchFilter, mode: "insensitive" } },
          { username: { contains: searchFilter, mode: "insensitive" } },
          { externalUserId: { contains: searchFilter, mode: "insensitive" } },
        ],
      };
    }

    const conversations = await prisma.conversation.findMany({
      where: whereClause,
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
            phone: true,
          },
        },
      },
    });

    return NextResponse.json(conversations);
  } catch (error: any) {
    console.error("Conversations List API Error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب قائمة المحادثات" },
      { status: 500 }
    );
  }
}
