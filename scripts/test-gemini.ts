import dotenv from "dotenv";
dotenv.config();

import { generateAIReply } from "../src/lib/ai/generate-reply";

async function main() {
  console.log("=== اختبار الاتصال بـ Gemini API ===");
  try {
    const question = "هل لديكم خدمات توصيل؟";
    const context = "معلومات العمل:\n- نقوم بالتوصيل لكافة مناطق المملكة خلال 3 أيام عمل مقابل 25 ريال.";
    
    console.log(`- السؤال: "${question}"`);
    console.log(`- السياق المساعد: "${context}"`);
    
    console.log("جاري طلب التوليد من الذكاء الاصطناعي...");
    const reply = await generateAIReply(question, context);
    console.log("\n✅ نجح الاتصال بـ Gemini بنجاح!");
    console.log(`الرد الناتج: "${reply}"`);
  } catch (err: any) {
    console.error("❌ فشل اختبار الاتصال بـ Gemini:", err.message);
  }
}

main();
