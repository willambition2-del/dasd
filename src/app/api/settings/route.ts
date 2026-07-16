import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { z } from "zod";

export const runtime = "nodejs";

const settingsUpdateSchema = z.object({
  bot_enabled: z.boolean(),
  default_reply: z.string().trim().min(1, "الرد الافتراضي مطلوب"),
  handoff_reply: z.string().trim().min(1, "رسالة التحويل مطلوبة"),
  working_hours_enabled: z.boolean(),
});

export async function GET() {
  try {
    const settings = await prisma.appSetting.findMany();
    const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

    const bot_enabled = settingsMap.get("bot_enabled") !== "false";
    const default_reply =
      settingsMap.get("default_reply") ||
      "أهلًا وسهلًا بك 🌷 وضّح لي الخدمة التي تريد الاستفسار عنها، أو اكتب «موظف» للتحدث مع خدمة العملاء.";
    const handoff_reply =
      settingsMap.get("handoff_reply") ||
      "تم تحويل محادثتك إلى موظف خدمة العملاء، وسيتم الرد عليك في أقرب وقت.";
    const working_hours_enabled = settingsMap.get("working_hours_enabled") === "true";

    const hasAccessToken = !!process.env.INSTAGRAM_ACCESS_TOKEN;
    const accountId = process.env.INSTAGRAM_ACCOUNT_ID || "";
    const hasVerifyToken = !!process.env.INSTAGRAM_VERIFY_TOKEN;
    const metaApiVersion = process.env.META_API_VERSION || "v20.0";

    return NextResponse.json({
      bot_enabled,
      default_reply,
      handoff_reply,
      working_hours_enabled,
      instagramConfigured: hasAccessToken && !!accountId,
      instagramAccountId: accountId,
      instagramAccessTokenPresent: hasAccessToken,
      instagramVerifyTokenMasked: hasVerifyToken ? "••••••••••••" : "غير محدد",
      metaApiVersion,
    });
  } catch (error: any) {
    console.error("Settings GET API Error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب الإعدادات" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const result = settingsUpdateSchema.safeParse(body);

    if (!result.success) {
      const errorMsg = result.error.issues[0]?.message || "مدخلات غير صالحة";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const data = result.data;

    const updates = [
      { key: "bot_enabled", value: String(data.bot_enabled) },
      { key: "default_reply", value: data.default_reply },
      { key: "handoff_reply", value: data.handoff_reply },
      { key: "working_hours_enabled", value: String(data.working_hours_enabled) },
    ];

    for (const update of updates) {
      await prisma.appSetting.upsert({
        where: { key: update.key },
        update: { value: update.value },
        create: { key: update.key, value: update.value },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Settings PUT API Error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث الإعدادات" },
      { status: 500 }
    );
  }
}
