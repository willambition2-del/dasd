/* eslint-disable @typescript-eslint/no-require-imports */
const dotenv = require("d:/InstagramBot/instagram-bot/node_modules/dotenv");
const axios = require("d:/InstagramBot/instagram-bot/node_modules/axios");

dotenv.config();

function getInstagramAccessToken() {
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

  return token;
}

function getInstagramAccountId() {
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID?.trim();
  if (!accountId) {
    throw new Error("معرف الحساب (INSTAGRAM_ACCOUNT_ID) غير موجود في ملف .env");
  }
  return accountId;
}

async function testConnection() {
  try {
    const token = getInstagramAccessToken();
    const accountId = getInstagramAccountId();
    const version = process.env.META_API_VERSION?.trim() || "v20.0";
    
    // Determine base URL
    const baseUrl = (token.startsWith("IGAA") || token.startsWith("IGQV"))
      ? "https://graph.instagram.com"
      : "https://graph.facebook.com";

    console.log("=== بدء اختبار اتصال إنستغرام ===");
    console.log(`- وجود الرمز: نعم (طوله: ${token.length})`);
    console.log(`- بادئة الرمز: ${token.slice(0, 4)}...`);
    console.log(`- معرف الحساب المستهدف: ${accountId}`);
    console.log(`- إصدار API المستخدم: ${version}`);
    console.log(`- المضيف المستخدم: ${baseUrl}`);

    let url = `${baseUrl}/${version}/me`;
    let params = {
      fields: "id,username,name,account_type",
      access_token: token,
    };

    if (baseUrl.includes("graph.facebook.com")) {
      url = `${baseUrl}/${version}/${accountId}`;
      params = {
        fields: "id,name,username",
        access_token: token,
      };
    }

    const response = await axios.get(url, { params, timeout: 8000 });
    const data = response.data;

    console.log("\n✅ نجح الاتصال بخوادم Meta بنجاح!");
    console.log(`- معرف الحساب المسترد: ${data.id}`);
    console.log(`- اسم المستخدم: ${data.username || "غير متوفر"}`);
    console.log(`- الاسم المعروض: ${data.name || "غير متوفر"}`);
    if (data.account_type) {
      console.log(`- نوع الحساب: ${data.account_type}`);
    }

    if (data.id && accountId && data.id !== accountId && !baseUrl.includes("graph.facebook.com")) {
      console.log(`\n⚠️ تحذير: معرف الحساب في .env (${accountId}) لا يطابق المعرف من Meta (${data.id})!`);
    } else {
      console.log("\n🎉 مطابقة معرف الحساب صحيحة!");
    }
  } catch (error) {
    console.log("\n❌ فشل اختبار الاتصال:");
    if (error.response) {
      const metaErr = error.response.data?.error;
      console.log(`- حالة HTTP: ${error.response.status}`);
      if (metaErr) {
        console.log(`- رمز الخطأ (Meta Code): ${metaErr.code}`);
        console.log(`- رمز الخطأ الفرعي: ${metaErr.error_subcode || "لا يوجد"}`);
        console.log(`- نوع الخطأ: ${metaErr.type}`);
        console.log(`- رسالة الخطأ: ${metaErr.message}`);
      } else {
        console.log(`- استجابة الخام: ${JSON.stringify(error.response.data)}`);
      }
    } else {
      console.log(`- رسالة الخطأ العامة: ${error.message}`);
    }
  }
}

testConnection();
