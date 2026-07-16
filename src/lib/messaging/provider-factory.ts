import { ChannelType } from "../../generated/prisma";
import { MessagingProvider } from "./types";
import { InstagramProvider } from "./instagram/instagram-provider";

export class ProviderFactory {
  static getProvider(channel: ChannelType): MessagingProvider {
    switch (channel) {
      case ChannelType.INSTAGRAM:
        return new InstagramProvider();
      default:
        throw new Error(`القناة ${channel} غير مدعومة حاليًا.`);
    }
  }
}
