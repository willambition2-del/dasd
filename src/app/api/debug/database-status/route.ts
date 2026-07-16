import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  let databaseConnected = false;
  let databaseName = "unknown";

  try {
    const databaseUrl = process.env.DATABASE_URL || "";
    // Safe extraction of database name from URL
    const match = databaseUrl.match(/\/([^\s\/?]+)(?:\?|$)/);
    if (match) {
      databaseName = match[1];
    }
    
    // Check connection by running a query
    await prisma.$queryRaw`SELECT 1`;
    databaseConnected = true;
  } catch (err: any) {
    console.error("[DEBUG DB API] Connection test failed:", err.message);
  }

  try {
    const webhookEventsCount = await prisma.webhookEvent.count();
    const customersCount = await prisma.customer.count();
    const conversationsCount = await prisma.conversation.count();
    const messagesCount = await prisma.message.count();

    return NextResponse.json({
      databaseConnected,
      databaseName,
      webhookEventsCount,
      customersCount,
      conversationsCount,
      messagesCount,
    });
  } catch (err: any) {
    return NextResponse.json({
      databaseConnected: false,
      databaseName,
      error: err.message,
    }, { status: 500 });
  }
}
