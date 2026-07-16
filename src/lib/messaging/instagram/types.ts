export interface MetaWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    time: number;
    messaging: Array<{
      sender: { id: string };
      recipient: { id: string };
      timestamp: number;
      message?: {
        mid: string;
        text?: string;
        attachments?: Array<{
          type: "image" | "video" | "audio" | "file";
          payload: { url: string };
        }>;
        is_echo?: boolean;
      };
      postback?: {
        mid: string;
        title: string;
        payload: string;
      };
    }>;
  }>;
}

export interface InstagramSendResponse {
  recipient_id: string;
  message_id: string;
}
