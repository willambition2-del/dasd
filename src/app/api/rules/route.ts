import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const ruleSchema = z.object({
  name: z.string().trim().min(1, "اسم القاعدة مطلوب"),
  triggerWords: z.string().trim().min(1, "الكلمات المفتاحية مطلوبة"),
  replyText: z.string().trim().min(1, "نص الرد مطلوب"),
  priority: z.coerce.number().default(0),
  requiresHuman: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export async function GET() {
  try {
    const rules = await prisma.botRule.findMany({
      orderBy: { priority: "desc" },
    });
    return NextResponse.json(rules);
  } catch (error: any) {
    console.error("Rules GET API Error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب قواعد الرد" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = ruleSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "مدخلات غير صالحة";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const rule = await prisma.botRule.create({
      data: result.data,
    });

    return NextResponse.json(rule);
  } catch (error: any) {
    console.error("Rules POST API Error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إضافة قاعدة الرد" },
      { status: 500 }
    );
  }
}
