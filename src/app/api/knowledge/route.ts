import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
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

export async function GET() {
  try {
    const items = await prisma.knowledgeItem.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(items);
  } catch (error: any) {
    console.error("Knowledge GET API Error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب قاعدة المعرفة" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = knowledgeSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "مدخلات غير صالحة";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const item = await prisma.knowledgeItem.create({
      data: result.data,
    });

    return NextResponse.json(item);
  } catch (error: any) {
    console.error("Knowledge POST API Error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إضافة عنصر المعرفة" },
      { status: 500 }
    );
  }
}
