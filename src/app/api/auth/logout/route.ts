import { NextResponse } from "next/server";
import { clearSessionCookie } from "../../../../lib/auth";

export const runtime = "nodejs";

export async function POST() {
  try {
    await clearSessionCookie();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Logout API Error:", error);
    return NextResponse.json(
      { error: "حدث خطأ غير متوقع أثناء تسجيل الخروج" },
      { status: 500 }
    );
  }
}
