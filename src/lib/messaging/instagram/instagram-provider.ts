/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChannelType } from "../../../generated/prisma";
import { BaseMessagingProvider } from "../provider";
import { WebhookMessage } from "../types";
import { parseInstagramWebhook } from "./webhook-parser";
import { sendInstagramText } from "./send-message";

export class InstagramProvider extends BaseMessagingProvider {
  getChannel(): ChannelType {
    return ChannelType.INSTAGRAM;
  }

  async verifyWebhook(
    mode: string,
    token: string,
    challenge: string
  ): Promise<{ status: number; response: string }> {
    const localVerifyToken = process.env.INSTAGRAM_VERIFY_TOKEN || "change-this-verify-token";

    if (mode === "subscribe" && token === localVerifyToken) {
      console.log("Meta Webhook verification succeeded.");
      return { status: 200, response: challenge };
    }

    console.warn("Meta Webhook verification failed: tokens mismatch.");
    return { status: 403, response: "فشل التحقق من رمز التطابق (Verify Token Mismatch)" };
  }

  async parseWebhook(payload: any): Promise<WebhookMessage[]> {
    return parseInstagramWebhook(payload);
  }

  async sendText(
    recipientId: string,
    text: string
  ): Promise<{ success: boolean; messageId?: string; error?: any }> {
    return sendInstagramText(recipientId, text);
  }
}
