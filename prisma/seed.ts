import { PrismaClient } from "../src/generated/prisma";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL variable is not defined");
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting seeding...");

  // 1. Create default admin user
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      isActive: true,
      role: "ADMIN",
    },
    create: {
      name: "مدير النظام",
      email,
      passwordHash,
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log(`Admin user seeded: ${admin.email}`);

  // 2. Create default AppSettings
  const defaultSettings = [
    { key: "bot_enabled", value: "true" },
    {
      key: "default_reply",
      value: "أهلًا وسهلًا بك 🌷 وضّح لي الخدمة التي تريد الاستفسار عنها، أو اكتب «موظف» للتحدث مع خدمة العملاء.",
    },
    {
      key: "handoff_reply",
      value: "تم تحويل محادثتك إلى موظف خدمة العملاء، وسيتم الرد عليك في أقرب وقت.",
    },
    { key: "working_hours_enabled", value: "false" },
  ];

  for (const setting of defaultSettings) {
    await prisma.appSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: { key: setting.key, value: setting.value },
    });
  }

  console.log("App settings seeded.");

  // 3. Create default BotRules
  const defaultRules = [
    {
      name: "الترحيب",
      triggerWords: "السلام,السلام عليكم,مرحبا,هلا,اهلا",
      replyText: "وعليكم السلام ورحمة الله، أهلًا وسهلًا بك 🌷 كيف يمكننا مساعدتك؟",
      priority: 10,
      requiresHuman: false,
    },
    {
      name: "السعر",
      triggerWords: "السعر,اسعار,بكم,كم السعر,التكلفة",
      replyText: "يسعدنا خدمتك. ما الخدمة التي تريد معرفة سعرها؟",
      priority: 8,
      requiresHuman: false,
    },
    {
      name: "الموظف",
      triggerWords: "موظف,المسؤول,شخص حقيقي,انسان",
      replyText: "تم تحويل محادثتك إلى موظف خدمة العملاء، وسيتم الرد عليك في أقرب وقت.",
      priority: 9,
      requiresHuman: true,
    },
    {
      name: "الخدمات",
      triggerWords: "الخدمات,ماذا تقدمون,ايش تقدمون",
      replyText: "نقدم خدمات الإعلانات والتسويق الرقمي. اكتب اسم الخدمة التي تريد تفاصيلها.",
      priority: 7,
      requiresHuman: false,
    },
  ];

  for (const rule of defaultRules) {
    const existing = await prisma.botRule.findFirst({
      where: { name: rule.name },
    });

    if (existing) {
      await prisma.botRule.update({
        where: { id: existing.id },
        data: {
          triggerWords: rule.triggerWords,
          replyText: rule.replyText,
          priority: rule.priority,
          requiresHuman: rule.requiresHuman,
        },
      });
    } else {
      await prisma.botRule.create({
        data: {
          name: rule.name,
          triggerWords: rule.triggerWords,
          replyText: rule.replyText,
          priority: rule.priority,
          requiresHuman: rule.requiresHuman,
          isActive: true,
        },
      });
    }
  }

  console.log("Bot rules seeded.");

  // 4. Create dummy KnowledgeItems for testing
  const defaultKnowledge = [
    {
      category: "BUSINESS_INFO",
      title: "معلومات الشركة",
      content: "نحن شركة رائدة في تقديم الحلول البرمجية والتسويقية لمختلف المشاريع والشركات.",
      keywords: "من انتم,معلومات,الشركة,عن الشركة",
      priority: 5,
      requiresHuman: false,
    },
    {
      category: "WORKING_HOURS",
      title: "أوقات العمل",
      content: "أوقات العمل الرسمية لدينا من الأحد إلى الخميس من الساعة 9 صباحًا حتى 6 مساءً.",
      keywords: "ساعات العمل,أوقات العمل,متى تفتحون,مواعيد",
      priority: 5,
      requiresHuman: false,
    },
  ];

  for (const item of defaultKnowledge) {
    const existing = await prisma.knowledgeItem.findFirst({
      where: { title: item.title },
    });

    if (existing) {
      await prisma.knowledgeItem.update({
        where: { id: existing.id },
        data: {
          category: item.category,
          content: item.content,
          keywords: item.keywords,
          priority: item.priority,
          requiresHuman: item.requiresHuman,
        },
      });
    } else {
      await prisma.knowledgeItem.create({
        data: {
          category: item.category,
          title: item.title,
          content: item.content,
          keywords: item.keywords,
          priority: item.priority,
          requiresHuman: item.requiresHuman,
          isActive: true,
        },
      });
    }
  }

  console.log("Knowledge items seeded.");
  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
