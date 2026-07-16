import { normalizeMessage } from "./normalize-message";

const HANDOFF_KEYWORDS = [
  "موظف",
  "انسان",
  "شخص حقيقي",
  "اريد اكلم المسؤول",
  "المسؤول",
  "شكوى",
  "استرجاع",
  "تعويض",
  "مشكلة دفع",
  "تم الخصم",
  "الحساب مقيد",
];

const NORMALIZED_HANDOFF_KEYWORDS = HANDOFF_KEYWORDS.map((word) => normalizeMessage(word));

export function isHandoffRequest(messageText: string): boolean {
  if (!messageText) return false;
  const normalized = normalizeMessage(messageText);

  // Check if any handoff keyword is a substring of the message
  return NORMALIZED_HANDOFF_KEYWORDS.some((keyword) => normalized.includes(keyword));
}
