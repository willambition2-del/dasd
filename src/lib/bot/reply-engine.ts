import { prisma } from "../prisma";
import { normalizeMessage } from "./normalize-message";
import { isHandoffRequest } from "./handoff";
import { BotReplyResult } from "./types";
import { ReplySource } from "../../generated/prisma";

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

  // 5. Default Reply
  return {
    replyText: defaultReply,
    source: ReplySource.DEFAULT,
    requiresHuman: false,
  };
}
