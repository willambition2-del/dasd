import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = ruleSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "مدخلات غير صالحة";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const updated = await prisma.botRule.update({
      where: { id },
      data: result.data,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Rules PUT API Error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث قاعدة الرد" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.botRule.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Rules DELETE API Error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف قاعدة الرد" },
      { status: 500 }
    );
  }
}
