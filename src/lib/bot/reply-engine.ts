import { prisma } from "../prisma";
import { normalizeMessage } from "./normalize-message";
import { isHandoffRequest } from "./handoff";
import { BotReplyResult } from "./types";
import { ReplySource } from "../../generated/prisma";
import { generateAIReply } from "../ai/generate-reply";

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Checks if the trigger is present in the text with proper word boundaries.
 * Matches Arabic unicode characters correctly.
 */
function matchTrigger(text: string, trigger: string): boolean {
  const normText = normalizeMessage(text);
  const normTrigger = normalizeMessage(trigger);
  if (!normTrigger) return false;

  // Word boundary for Arabic/English: matches start/end of string or any non-alphanumeric/non-arabic character
  const pattern = `(^|[^\\u0600-\\u06FFa-zA-Z0-9])${escapeRegExp(normTrigger)}([^\\u0600-\\u06FFa-zA-Z0-9]|$)`;
  const regex = new RegExp(pattern, "i");
  return regex.test(normText);
}

export async function getBotReply(messageText: string): Promise<BotReplyResult> {
  const normalizedText = normalizeMessage(messageText);

  // 1. Fetch settings from DB
  const settings = await prisma.appSetting.findMany();
  const settingsMap = new Map(settings.map((s) => [s.key, s.value]));

  const handoffReply =
    settingsMap.get("handoff_reply") ||
    "تم تحويل محادثتك إلى موظف خدمة العملاء، وسيتم الرد عليك في أقرب وقت.";
  const defaultReply =
    settingsMap.get("default_reply") ||
    "أهلًا وسهلًا بك 🌷 وضّح لي الخدمة التي تريد الاستفسار عنها، أو اكتب «موظف» للتحدث مع خدمة العملاء.";

  // 2. Check for human handoff request
  if (isHandoffRequest(messageText)) {
    return {
      replyText: handoffReply,
      source: ReplySource.DEFAULT,
      requiresHuman: true,
    };
  }

  // 3. Search in BotRules
  const rules = await prisma.botRule.findMany({
    where: { isActive: true },
    orderBy: { priority: "desc" },
  });

  for (const rule of rules) {
    const triggerWords = rule.triggerWords.split(",").map((w) => w.trim());
    const isMatched = triggerWords.some((trigger) => matchTrigger(normalizedText, trigger));

    if (isMatched) {
      return {
        replyText: rule.replyText,
        source: ReplySource.RULE,
        requiresHuman: rule.requiresHuman,
      };
    }
  }

  // 4. Search in KnowledgeItems
  const knowledgeItems = await prisma.knowledgeItem.findMany({
    where: { isActive: true },
    orderBy: { priority: "desc" },
  });

  for (const item of knowledgeItems) {
    // Check keywords
    const keywords = item.keywords.split(",").map((w) => w.trim());
    const keywordMatched = keywords.some((keyword) => matchTrigger(normalizedText, keyword));

    if (
      keywordMatched ||
      matchTrigger(normalizedText, item.title) ||
      matchTrigger(normalizedText, item.content)
    ) {
      return {
        replyText: item.content,
        source: ReplySource.KNOWLEDGE,
        requiresHuman: item.requiresHuman,
      };
    }
  }

  // 5. Fallback to AI-generated reply using Gemini
  try {
    let knowledgeContext = "إليك معلومات وقواعد العمل للرد على استفسار العميل:\n";

    if (knowledgeItems.length > 0) {
      knowledgeContext += "\n[معلومات عامة عن المنتجات/الخدمات]:\n";
      for (const item of knowledgeItems) {
        knowledgeContext += `- ${item.title}: ${item.content}\n`;
      }
    }

    if (rules.length > 0) {
      knowledgeContext += "\n[قواعد الردود التلقائية المبرمجة]:\n";
      for (const rule of rules) {
        knowledgeContext += `- عند الاستفسار عن (${rule.triggerWords}): ${rule.replyText}\n`;
      }
    }

    const systemInstruction =
      "أنت مساعد خدمة عملاء ذكي، مهذب ومتعاون لحساب إنستغرام تجاري. " +
      "أجب بلطف وبناءً على معلومات العمل المتوفرة لديك فقط. " +
      "إذا لم تكن الإجابة متوفرة في المعلومات، أجب بلطف وعرض المساعدة واقترح على العميل كتابة 'موظف' للتواصل مع الدعم البشري. " +
      "اجعل إجابتك باللغة العربية ومختصرة وموجزة للغاية (لا تتعدى سطرين).";

    const aiPrompt = `سؤال العميل هو: "${messageText}"\n\nسياق العمل المتوفر:\n${knowledgeContext}`;

    console.log("[BOT REPLY ENGINE] Attempting AI generation via Gemini...");
    const aiReply = await generateAIReply(aiPrompt, systemInstruction);

    console.log("[BOT REPLY ENGINE] AI Reply generated successfully.");
    return {
      replyText: aiReply,
      source: ReplySource.AI,
      requiresHuman: false,
    };
  } catch (aiError: any) {
    console.warn(
      "[BOT REPLY ENGINE] AI Reply generation failed or not configured. Falling back to default static reply. Error:",
      aiError.message
    );
  }

  // 6. Default static reply (ultimate fallback)
  return {
    replyText: defaultReply,
    source: ReplySource.DEFAULT,
    requiresHuman: false,
  };
}
