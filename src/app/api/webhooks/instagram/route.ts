/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { prisma } from "../../../../lib/prisma";
import { InstagramProvider } from "../../../../lib/messaging/instagram/instagram-provider";
import { getBotReply } from "../../../../lib/bot/reply-engine";
import {
  ChannelType,
  ConversationStatus,
  MessageDirection,
  SenderType,
  ContentType,
} from "../../../../generated/prisma";

export const runtime = "nodejs";

const provider = new InstagramProvider();

// Helper to verify Meta HMAC signature
function verifyMetaSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string
): boolean {
  if (!signatureHeader) return false;
  const hash = createHmac("sha256", appSecret).update(rawBody).digest("hex");
  const expectedSignature = `sha256=${hash}`;
  return signatureHeader === expectedSignature;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode") || "";
  const token = searchParams.get("hub.verify_token") || "";
  const challenge = searchParams.get("hub.challenge") || "";

  const verification = await provider.verifyWebhook(mode, token, challenge);
  return new Response(verification.response, {
    status: verification.status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function POST(request: Request) {
  console.log("[IG WEBHOOK] POST route reached");

  const rawBody = await request.text();
  let payload: any = null;

  try {
    payload = JSON.parse(rawBody);
  } catch {
    console.error("[IG WEBHOOK] Invalid JSON payload received");
    return NextResponse.json({ received: false }, { status: 400 });
  }

  // Log Payload summary securely
  console.log("[IG WEBHOOK] Payload summary", {
    object: payload?.object,
    entries: Array.isArray(payload?.entry) ? payload.entry.length : 0,
    rawLength: rawBody.length,
  });

  // 1. Immediately Save Raw Webhook Event to DB
  let webhookEvent: any = null;
  try {
    webhookEvent = await prisma.webhookEvent.create({
      data: {
        channel: ChannelType.INSTAGRAM,
        eventType: payload?.object ?? "unknown",
        payload: payload,
        processed: false,
        retryCount: 0,
      },
    });
    console.log("[IG WEBHOOK] WebhookEvent saved successfully", {
      id: webhookEvent.id,
    });
  } catch (dbError: any) {
    console.error("[IG WEBHOOK] Failed to store raw WebhookEvent in DB:", dbError);
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json({ error: `Database Error: ${dbError.message}` }, { status: 500 });
    }
    throw dbError; // Bubble error in production
  }

  // 2. Signature Verification
  const appSecret = process.env.META_APP_SECRET;
  if (appSecret) {
    const signature = request.headers.get("x-hub-signature-256");
    if (!verifyMetaSignature(rawBody, signature, appSecret)) {
      console.error("[IG WEBHOOK] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } else {
    if (process.env.NODE_ENV === "development") {
      console.warn("[IG WEBHOOK] META_APP_SECRET is not set in development. Allowing unsigned local requests.");
    }
  }

  // 3. Early Ignore checks based on event object type
  if (payload.object !== "instagram" && payload.object !== "page") {
    console.log("[IG WEBHOOK] Event ignored", {
      reason: `Unsupported object type: ${payload.object}`,
    });
    return NextResponse.json({ success: true });
  }

  // 4. Parse & Process Messages
  try {
    let parsedMessages: any[] = [];
    try {
      parsedMessages = await provider.parseWebhook(payload);
      console.log("[IG WEBHOOK] Parsed messages", {
        count: parsedMessages.length,
      });
    } catch (parseError: any) {
      console.error("[IG WEBHOOK] Failed parsing Instagram webhook messages:", parseError);
      throw parseError;
    }

    for (const item of parsedMessages) {
      console.log("[IG WEBHOOK] Event details:", {
        payloadObject: payload?.object,
        entryId: payload?.entry?.[0]?.id,
        senderId: item.senderId,
        recipientId: item.recipientId,
        messageId: item.messageId,
        text: item.text,
        isEcho: item.isEcho,
      });

      // Ignore message echoes (messages sent by the page/account itself)
      if (item.isEcho) {
        console.log("[IG WEBHOOK] Event ignored", {
          reason: `Message echo: ${item.messageId}`,
        });
        continue;
      }

      // Check for event deduplication
      const duplicateMessage = await prisma.message.findUnique({
        where: { externalMessageId: item.messageId },
      });
      if (duplicateMessage) {
        console.log("[IG WEBHOOK] Event ignored", {
          reason: `Duplicate message: ${item.messageId}`,
        });
        continue;
      }

      // Check if sender.id is the bot itself (to prevent loops)
      const botAccountId = process.env.INSTAGRAM_ACCOUNT_ID;
      if (botAccountId && item.senderId === botAccountId) {
        console.log("[IG WEBHOOK] Event ignored", {
          reason: `Sender is the bot account: ${item.senderId}`,
        });
        continue;
      }

      // Associate external message ID with the webhook event
      if (webhookEvent && !webhookEvent.externalEventId) {
        await prisma.webhookEvent.update({
          where: { id: webhookEvent.id },
          data: { externalEventId: item.messageId },
        });
      }

      // 5. Execute DB updates inside a single Atomic Transaction
      const { conversation } = await prisma.$transaction(async (tx) => {
        // Upsert ChannelAccount
        const channelAccount = await tx.channelAccount.upsert({
          where: { externalAccountId: item.recipientId },
          update: { isActive: true },
          create: {
            channel: ChannelType.INSTAGRAM,
            externalAccountId: item.recipientId,
            username: `instagram_page_${item.recipientId}`,
            isActive: true,
          },
        });

        // Upsert Customer
        const customer = await tx.customer.upsert({
          where: {
            channel_externalUserId: {
              channel: ChannelType.INSTAGRAM,
              externalUserId: item.senderId,
            },
          },
          update: {},
          create: {
            channel: ChannelType.INSTAGRAM,
            externalUserId: item.senderId,
            username: `user_${item.senderId}`,
            name: `عميل إنستغرام (${item.senderId.slice(-4)})`,
          },
        });

        // Upsert Conversation
        const conversation = await tx.conversation.upsert({
          where: {
            channelAccountId_customerId: {
              channelAccountId: channelAccount.id,
              customerId: customer.id,
            },
          },
          update: {
            lastMessageAt: new Date(),
            unreadCount: { increment: 1 },
          },
          create: {
            channel: ChannelType.INSTAGRAM,
            channelAccountId: channelAccount.id,
            customerId: customer.id,
            status: ConversationStatus.BOT_ACTIVE,
            botEnabled: true,
            unreadCount: 1,
          },
        });

        // Save incoming message
        await tx.message.create({
          data: {
            conversationId: conversation.id,
            externalMessageId: item.messageId,
            direction: MessageDirection.INBOUND,
            senderType: SenderType.CUSTOMER,
            contentType: item.contentType,
            text: item.text,
            mediaUrl: item.mediaUrl,
            rawPayload: item.rawPayload,
          },
        });

        return { conversation };
      });

      // 6. Decide whether to respond automatically (Auto-Reply Engine)
      const globalBotEnabledSetting = await prisma.appSetting.findUnique({
        where: { key: "bot_enabled" },
      });
      const isGlobalBotEnabled = globalBotEnabledSetting?.value !== "false";

      const shouldAutoReply =
        conversation.botEnabled &&
        isGlobalBotEnabled &&
        conversation.status !== ConversationStatus.WAITING_AGENT &&
        conversation.status !== ConversationStatus.HUMAN_ACTIVE;

      if (shouldAutoReply && item.text) {
        // Run the reply engine
        const replyResult = await getBotReply(item.text);

        // If handoff is requested
        if (replyResult.requiresHuman) {
          await prisma.conversation.update({
            where: { id: conversation.id },
            data: {
              status: ConversationStatus.WAITING_AGENT,
              botEnabled: false,
              needsHuman: true,
              transferredAt: new Date(),
            },
          });
        }

        // Send the message using provider (Instagram API)
        const sendResult = await provider.sendText(item.senderId, replyResult.replyText);

        if (sendResult.success) {
          // Save Bot reply to database
          await prisma.message.create({
            data: {
              conversationId: conversation.id,
              externalMessageId: sendResult.messageId,
              direction: MessageDirection.OUTBOUND,
              senderType: SenderType.BOT,
              replySource: replyResult.source,
              contentType: ContentType.TEXT,
              text: replyResult.replyText,
            },
          });
        } else {
          // Log send failure to message
          await prisma.message.create({
            data: {
              conversationId: conversation.id,
              direction: MessageDirection.OUTBOUND,
              senderType: SenderType.BOT,
              replySource: replyResult.source,
              contentType: ContentType.TEXT,
              text: replyResult.replyText,
              deliveryStatus: "FAILED",
              errorMessage: typeof sendResult.error === "string" ? sendResult.error : JSON.stringify(sendResult.error),
            },
          });
        }
      }
    }

    // Mark event as processed successfully
    if (webhookEvent) {
      await prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          processed: true,
          processedAt: new Date(),
          processingError: null,
        },
      });
    }
  } catch (error: any) {
    console.error("[IG WEBHOOK] Message processing failed:", error);
    if (webhookEvent) {
      await prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          processed: false,
          processingError: error.message,
          retryCount: { increment: 1 },
        },
      });
    }
    if (process.env.NODE_ENV === "development") {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
