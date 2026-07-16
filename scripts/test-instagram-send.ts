import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

function getInstagramAccessToken(): string {
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

async function sendTestMessage() {
  const token = getInstagramAccessToken();
  const recipientId = process.env.TEST_INSTAGRAM_RECIPIENT_ID?.trim();
  const version = process.env.META_API_VERSION?.trim() || "v20.0";
  
  if (!recipientId) {
    console.error("❌ خطأ: TEST_INSTAGRAM_RECIPIENT_ID غير محدد في ملف .env. يرجى إضافته لاختبار الإرسال.");
    process.exit(1);
  }

  const baseHost = (token.startsWith("IGAA") || token.startsWith("IGQV"))
    ? "https://graph.instagram.com"
    : "https://graph.facebook.com";

  const url = `${baseHost}/${version}/me/messages`;

  console.log("=== بدء اختبار إرسال رسالة إنستغرام ===");
  console.log(`- معرف المستلم: ${recipientId}`);
  console.log(`- إصدار API: ${version}`);
  console.log(`- المضيف المستخدم: ${baseHost}`);
  console.log(`- المسار النهائي: ${url}`);

  const payload = {
    recipient: { id: recipientId },
    message: { text: "اختبار إرسال من النظام" }
  };

  try {
    const res = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      timeout: 8000
    });

    console.log("\n✅ تم إرسال الرسالة بنجاح!");
    console.log("استجابة Meta:", res.data);
  } catch (error: any) {
    console.log("\n❌ فشل إرسال الرسالة:");
    if (error.response) {
      const metaErr = error.response.data?.error;
      console.log(`- حالة HTTP: ${error.response.status}`);
      console.log(`- المسار (Endpoint): ${url}`);
      if (metaErr) {
        console.log(`- رمز الخطأ (Meta Code): ${metaErr.code}`);
        console.log(`- رمز الخطأ الفرعي (Subcode): ${metaErr.error_subcode || "لا يوجد"}`);
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

sendTestMessage();
