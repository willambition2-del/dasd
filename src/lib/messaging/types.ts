/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChannelType, ContentType } from "../../generated/prisma";

export interface WebhookMessage {
  externalEventId?: string;
  senderId: string;
  recipientId: string;
  messageId: string;
  timestamp: Date;
  text?: string;
  mediaUrl?: string;
  contentType: ContentType;
  isEcho: boolean;
  rawPayload: any;
}

export interface MessagingProvider {
  getChannel(): ChannelType;
  verifyWebhook(
    mode: string,
    token: string,
    challenge: string
  ): Promise<{ status: number; response: string }>;
  parseWebhook(payload: any): Promise<WebhookMessage[]>;
  sendText(
    recipientId: string,
    text: string
  ): Promise<{ success: boolean; messageId?: string; error?: any }>;
}
