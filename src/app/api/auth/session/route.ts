import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "غير مصرح به" }, { status: 401 });
    }
    return NextResponse.json({ session });
  } catch (error: any) {
    console.error("Session API Error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء فحص الجلسة" },
      { status: 500 }
    );
  }
}
