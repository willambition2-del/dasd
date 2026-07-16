/* eslint-disable @typescript-eslint/no-explicit-any */
import { ContentType } from "../../../generated/prisma";
import { WebhookMessage } from "../types";
import { MetaWebhookPayload } from "./types";

export function parseInstagramWebhook(payload: any): WebhookMessage[] {
  const messages: WebhookMessage[] = [];

  if (payload.object !== "instagram" || !payload.entry) {
    return messages;
  }

  const metaPayload = payload as MetaWebhookPayload;

  for (const entry of metaPayload.entry) {
    if (!entry.messaging) continue;

    for (const msg of entry.messaging) {
      const senderId = msg.sender?.id;
      const recipientId = msg.recipient?.id;
      const timestamp = new Date(msg.timestamp);

      // Handle standard message
      if (msg.message) {
        const isEcho = !!msg.message.is_echo;
        const messageId = msg.message.mid;
        const text = msg.message.text;

        let contentType: ContentType = ContentType.TEXT;
        let mediaUrl: string | undefined;

        if (msg.message.attachments && msg.message.attachments.length > 0) {
          const attachment = msg.message.attachments[0];
          mediaUrl = attachment.payload?.url;

          switch (attachment.type) {
            case "image":
              contentType = ContentType.IMAGE;
              break;
            case "video":
              contentType = ContentType.VIDEO;
              break;
            case "audio":
              contentType = ContentType.AUDIO;
              break;
            case "file":
              contentType = ContentType.FILE;
              break;
            default:
              contentType = ContentType.UNKNOWN;
          }
        }

        messages.push({
          senderId,
          recipientId,
          messageId,
          timestamp,
          text,
          mediaUrl,
          contentType,
          isEcho,
          rawPayload: msg,
        });
      }
      // Handle postback (quick replies / buttons)
      else if (msg.postback) {
        const messageId = msg.postback.mid || `postback-${Date.now()}`;
        const text = msg.postback.title;
        const payloadVal = msg.postback.payload;

        messages.push({
          senderId,
          recipientId,
          messageId,
          timestamp,
          text: `${text} (${payloadVal})`,
          contentType: ContentType.POSTBACK,
          isEcho: false,
          rawPayload: msg,
        });
      }
    }
  }

  return messages;
}
