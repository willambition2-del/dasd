import { getAIProvider } from "./provider";

/**
 * Generates an AI reply for a given customer prompt.
 * Accepts an optional context/system instruction string.
 */
export async function generateAIReply(prompt: string, context?: string): Promise<string> {
  const provider = getAIProvider();
  return provider.generateText(prompt, context);
}
