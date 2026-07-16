/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Safe retrieval and validation of the Instagram Access Token from .env.
 */
export function getInstagramAccessToken(): string {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();

  if (!token) {
    throw new Error("رمز الوصول (INSTAGRAM_ACCESS_TOKEN) غير موجود في ملف .env");
  }

  if (token.includes("\n") || token.includes("\r")) {
    throw new Error("رمز Instagram يحتوي على سطر جديد غير صالح");
  }

  if (token.startsWith('"') || token.endsWith('"') || token.startsWith("'") || token.endsWith("'")) {
    throw new Error("رمز Instagram يحتوي على علامات اقتباس زائدة");
  }

  if (token.toLowerCase().includes("bearer")) {
    throw new Error("رمز Instagram يحتوي على كلمة Bearer الزائدة");
  }

  if (token.includes("INSTAGRAM_ACCESS_TOKEN=")) {
    throw new Error("رمز Instagram يحتوي على اسم المتغير الزائد");
  }

  return token;
}

// Alias requested by the user
export function getInstagramToken(): string {
  return getInstagramAccessToken();
}

/**
 * Safe retrieval and validation of the Instagram Account ID.
 */
export function getInstagramAccountId(): string {
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID?.trim();
  if (!accountId) {
    throw new Error("معرف الحساب (INSTAGRAM_ACCOUNT_ID) غير موجود في ملف .env");
  }
  if (!/^\d+$/.test(accountId)) {
    throw new Error("معرف الحساب (INSTAGRAM_ACCOUNT_ID) يجب أن يكون رقمياً فقط");
  }
  return accountId;
}

/**
 * Retrieves the Meta API Version or defaults to v20.0
 */
export function getMetaApiVersion(): string {
  return process.env.META_API_VERSION?.trim() || "v20.0";
}

/**
 * Resolves the correct base Graph URL dynamically based on the token prefix.
 * Facebook Page/User Tokens start with 'EAA', while Instagram Login User Tokens start with 'IGA' or 'IGQ'.
 */
export function getInstagramGraphBaseUrl(): string {
  // If explicitly configured in env, respect user choice
  const envUrl = process.env.INSTAGRAM_GRAPH_BASE_URL?.trim();
  if (envUrl) {
    return envUrl;
  }

  const token = process.env.INSTAGRAM_ACCESS_TOKEN?.trim() || "";
  if (token.startsWith("IGAA") || token.startsWith("IGQV")) {
    return "https://graph.instagram.com";
  }

  return "https://graph.facebook.com";
}

// Alias requested by the user
export function getInstagramBaseUrl(): string {
  return getInstagramGraphBaseUrl();
}
