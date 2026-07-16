/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChannelType } from "../../generated/prisma";
import { MessagingProvider, WebhookMessage } from "./types";

export abstract class BaseMessagingProvider implements MessagingProvider {
  abstract getChannel(): ChannelType;

  abstract verifyWebhook(
    mode: string,
    token: string,
    challenge: string
  ): Promise<{ status: number; response: string }>;

  abstract parseWebhook(payload: any): Promise<WebhookMessage[]>;

  abstract sendText(
    recipientId: string,
    text: string
  ): Promise<{ success: boolean; messageId?: string; error?: any }>;
}
