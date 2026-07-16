import axios from "axios";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const payload = {
  object: "instagram",
  entry: [
    {
      id: "27709994451930152",
      time: 1752180000000,
      messaging: [
        {
          sender: {
            id: "TEST_CUSTOMER_123"
          },
          recipient: {
            id: "27709994451930152"
          },
          timestamp: 1752180000000,
          message: {
            mid: `TEST_MESSAGE_${Math.floor(Math.random() * 1000000)}`,
            text: "السلام عليكم اختبار"
          }
        }
      ]
    }
  ]
};

async function runTest() {
  const url = "http://localhost:3000/api/webhooks/instagram";
  const rawBody = JSON.stringify(payload);
  const appSecret = process.env.META_APP_SECRET;
  
  const headers: any = {
    "Content-Type": "application/json"
  };

  if (appSecret) {
    const hash = crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");
    headers["x-hub-signature-256"] = `sha256=${hash}`;
    console.log(`[TEST] Computed Meta signature: sha256=${hash.slice(0, 8)}...`);
  } else {
    console.log("[TEST] No META_APP_SECRET configured, sending unsigned payload.");
  }

  console.log(`[TEST] Sending simulated Instagram webhook payload to ${url}...`);
  try {
    const res = await axios.post(url, payload, { headers });
    console.log(`[TEST] Response status: ${res.status}`);
    console.log("[TEST] Response data:", res.data);
    console.log("[TEST] Success!");
  } catch (error: any) {
    console.error("[TEST] Webhook post failed!");
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error("Data:", error.response.data);
    } else {
      console.error("Error message:", error.message);
    }
  }
}

runTest();
