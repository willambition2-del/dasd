// Placeholder for future AI integration (e.g. Gemini, OpenAI, etc.)
export interface AIProvider {
  generateText(prompt: string): Promise<string>;
}

export class NoneAIProvider implements AIProvider {
  async generateText(_prompt: string): Promise<string> {
    throw new Error("الذكاء الاصطناعي غير مفعّل حاليًا.");
  }
}
