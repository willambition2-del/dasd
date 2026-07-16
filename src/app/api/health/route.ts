import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  let databaseStatus = "connected";
  try {
    // Simple query to verify DB connection
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    console.error("Health Check Database Connection Failed:", error);
    databaseStatus = "disconnected";
  }

  const hasAccessToken = !!process.env.INSTAGRAM_ACCESS_TOKEN;
  const hasAccountId = !!process.env.INSTAGRAM_ACCOUNT_ID;
  const hasVerifyToken = !!process.env.INSTAGRAM_VERIFY_TOKEN;

  const instagramConfigured = hasAccessToken && hasAccountId && hasVerifyToken;

  return NextResponse.json({
    status: "ok",
    database: databaseStatus,
    instagramConfigured,
    timestamp: new Date().toISOString(),
  });
}
