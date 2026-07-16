import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { verifyPassword, setSessionCookie } from "../../../../lib/auth";
import { z } from "zod";

export const runtime = "nodejs";

const loginSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(6, "كلمة المرور يجب أن لا تقل عن 6 أحرف"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "بيانات الإدخال غير صالحة";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { email, password } = result.data;
    const cleanEmail = email.trim().toLowerCase();

    console.log(`[DEV LOGIN] Attempting login for email: "${cleanEmail}"`);

    // Search user in database
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    console.log(`[DEV LOGIN] User found in database: ${!!user}`);
    if (user) {
      console.log(`[DEV LOGIN] User active status: ${user.isActive}`);
    }

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" },
        { status: 401 }
      );
    }

    // Verify hashed password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    console.log(`[DEV LOGIN] Password verification success: ${isPasswordValid}`);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" },
        { status: 401 }
      );
    }

    // Set cookie
    await setSessionCookie({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      { error: `فشل الاتصال أو تسجيل الدخول: ${error.message}` },
      { status: 500 }
    );
  }
}
