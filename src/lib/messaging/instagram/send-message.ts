/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import {
  getInstagramToken,
  getMetaApiVersion,
  getInstagramBaseUrl,
} from "./config";

export async function sendInstagramText(
  recipientId: string,
  text: string,
  customAccessToken?: string
): Promise<{ success: boolean; messageId?: string; error?: any }> {
  try {
    const token = customAccessToken || getInstagramToken();
    const version = getMetaApiVersion();
    const baseHost = getInstagramBaseUrl();

    // Resolves the endpoint path based on the central base URL
    const url = `${baseHost}/${version}/me/messages`;

    // Safe development log
    console.log("[DEV SEND-MESSAGE] Safe log parameters:", {
      tokenExists: true,
      tokenLength: token.length,
      tokenPrefix: `${token.slice(0, 4)}...`,
      baseUrl: baseHost,
      endpoint: url,
    });

    const payload = {
      recipient: {
        id: recipientId,
      },
      message: {
        text: text,
      },
    };

    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      timeout: 8000, // 8 seconds timeout
    });

    const data = response.data;
    return {
      success: true,
      messageId: data.message_id,
    };
  } catch (error: any) {
    let errorDetail = "عطل غير معروف في الاتصال بـ Meta API";
    let metaErrorResponse = null;

    if (error.response) {
      metaErrorResponse = error.response.data;
      const metaErr = metaErrorResponse?.error;
      errorDetail = metaErr
        ? `Meta Error [Code ${metaErr.code} / Subcode ${metaErr.error_subcode}]: ${metaErr.message}`
        : `HTTP error: ${error.response.status}`;
    } else if (error.request) {
      errorDetail = "لم يتم تلقي أي رد من خوادم Meta API (انتهت مهلة الطلب)";
    } else {
      errorDetail = error.message || errorDetail;
    }

    // Do NOT log the access token in error logs
    console.error("Meta API message sending failed:", errorDetail);

    return {
      success: false,
      error: errorDetail,
    };
  }
}
