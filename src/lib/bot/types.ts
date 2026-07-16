import { ReplySource } from "../../generated/prisma";

export interface BotReplyResult {
  replyText: string;
  source: ReplySource;
  requiresHuman: boolean;
}
