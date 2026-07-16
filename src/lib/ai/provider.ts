import axios from "axios";

export interface AIProvider {
  generateText(prompt: string, context?: string): Promise<string>;
}

export class NoneAIProvider implements AIProvider {
  async generateText(_prompt: string): Promise<string> {
    throw new Error("الذكاء الاصطناعي غير مفعّل حاليًا.");
  }
}

export class GeminiAIProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = "gemini-1.5-flash") {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateText(prompt: string, context?: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const systemInstruction = context || "أنت مساعد خدمة عملاء ذكي، ودود، ومتعاون لحساب إنستغرام تجاري. أجب باختصار ولطف باللغة العربية الفصحى المبسطة أو لهجة ودية وبدون إطالة.";

    const payload = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      systemInstruction: {
        parts: [
          {
            text: systemInstruction
          }
        ]
      },
      generationConfig: {
        maxOutputTokens: 300,
        temperature: 0.7,
      }
    };

    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json"
      },
      timeout: 12000
    });

    const candidate = response.data?.candidates?.[0];
    const replyText = candidate?.content?.parts?.[0]?.text;

    if (!replyText) {
      throw new Error("لم يتم إرجاع أي نص من Gemini API");
    }

    return replyText.trim();
  }
}

export function getAIProvider(): AIProvider {
  const providerType = process.env.AI_PROVIDER?.trim().toLowerCase();
  const apiKey = process.env.AI_API_KEY?.trim();

  if (providerType === "gemini" && apiKey) {
    return new GeminiAIProvider(apiKey);
  }

  return new NoneAIProvider();
}
