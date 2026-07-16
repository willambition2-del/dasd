import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const knowledgeSchema = z.object({
  category: z.string().min(1, "التصنيف مطلوب"),
  title: z.string().trim().min(1, "العنوان مطلوب"),
  content: z.string().trim().min(1, "المحتوى مطلوب"),
  keywords: z.string().trim().min(1, "الكلمات المفتاحية مطلوبة"),
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
    const result = knowledgeSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "مدخلات غير صالحة";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const updated = await prisma.knowledgeItem.update({
      where: { id },
      data: result.data,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Knowledge PUT API Error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث عنصر المعرفة" },
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

    await prisma.knowledgeItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Knowledge DELETE API Error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف عنصر المعرفة" },
      { status: 500 }
    );
  }
}
