import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";

export async function POST() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ success: true, message: "تم الاتصال بقاعدة البيانات بنجاح!" });
  } catch (error: any) {
    console.error("Test DB Connection Error:", error);
    return NextResponse.json(
      { success: false, error: `فشل الاتصال: ${error.message}` },
      { status: 500 }
    );
  }
}
