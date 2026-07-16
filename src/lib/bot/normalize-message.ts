export function normalizeMessage(text: string): string {
  if (!text) return "";

  // 1. Lowercase for English
  let normalized = text.toLowerCase();

  // 2. Remove Arabic Diacritics (Tashkeel)
  // \u064B: Tanween Fath, \u064C: Tanween Damm, \u064D: Tanween Kasr
  // \u064E: Fatha, \u064F: Damma, \u0650: Kasra, \u0651: Shadda, \u0652: Sukun
  normalized = normalized.replace(/[\u064B-\u0652]/g, "");

  // 3. Unify Hamzas (أ, إ, آ, ء to ا)
  normalized = normalized.replace(/[أإآء]/g, "ا");

  // 4. Unify Yaa and Alif Maqsura (ى to ي)
  normalized = normalized.replace(/ى/g, "ي");

  // 5. Unify Teh Marbuta and Heh (ة to ه) - very useful for dialect variants
  normalized = normalized.replace(/ة/g, "ه");

  // 6. Remove excess spacing
  normalized = normalized.replace(/\s+/g, " ").trim();

  return normalized;
}
