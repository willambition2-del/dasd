/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import axios from "axios";
import {
  getInstagramToken,
  getInstagramAccountId,
  getMetaApiVersion,
  getInstagramBaseUrl,
} from "../../../../lib/messaging/instagram/config";

export const runtime = "nodejs";

export async function POST() {
  try {
    const token = getInstagramToken();
    const accountId = getInstagramAccountId();
    const version = getMetaApiVersion();
    const baseUrl = getInstagramBaseUrl();

    // Log safe info for debugging in development
    console.log("[DEV TEST-INSTAGRAM] Safe check parameters:", {
      exists: true,
      length: token.length,
      prefix: `${token.slice(0, 4)}...`,
      hasWhitespace: /\s/.test(token),
      baseUrl,
      version,
      accountId,
    });

    let url = `${baseUrl}/${version}/me`;
    let params: any = {
      fields: "id,username,name,account_type",
    };

    // If using Facebook Graph URL, we query the specific Instagram Account ID
    if (baseUrl.includes("graph.facebook.com")) {
      url = `${baseUrl}/${version}/${accountId}`;
      params = {
        fields: "id,name,username",
      };
    }

    const response = await axios.get(url, {
      params,
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      timeout: 10000,
    });

    const data = response.data;
    const returnedId = data.id;
    const returnedName = data.name || data.username || "غير حدد";

    // Verify account ID matches if applicable (on Instagram native endpoint)
    if (returnedId && accountId && returnedId !== accountId && !baseUrl.includes("graph.facebook.com")) {
      return NextResponse.json({
        success: false,
        code: 400,
        message: "معرف الحساب لا يطابق المعرف المرتبط برمز الوصول",
        details: `المعرف المرفق في .env: ${accountId}، بينما المعرف المرجع من Meta هو: ${returnedId}`,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `تم الاتصال بـ Meta API بنجاح! الحساب المرتبط: ${returnedName} (ID: ${returnedId})`,
    });
  } catch (error: any) {
    let errorDetail = "عطل في الاتصال بخوادم Meta";
    let code = 500;
    let metaMessage = "";

    if (error.response) {
      const metaErr = error.response.data?.error;
      if (metaErr) {
        code = metaErr.code || 500;
        metaMessage = metaErr.message || "";
        
        console.error("[DEV TEST-INSTAGRAM FAILURE]", {
          status: error.response.status,
          code: metaErr.code,
          type: metaErr.type,
          message: metaErr.message,
        });

        if (metaErr.code === 190) {
          errorDetail = "رمز الوصول غير صالح أو لم يتم قراءته بصورة صحيحة. أنشئ رمزًا جديدًا من لوحة Meta، ثم ضعه داخل ملف .env وأعد تشغيل الخادم.";
        } else {
          errorDetail = `Meta Error: ${metaErr.message} (Code: ${metaErr.code})`;
        }
      } else {
        errorDetail = `HTTP error: ${error.response.status}`;
      }
    } else if (error.request) {
      errorDetail = "انتهت مهلة الطلب ولم يتم الاستجابة من Meta API";
    } else {
      errorDetail = error.message || errorDetail;
    }

    return NextResponse.json(
      {
        success: false,
        code,
        message: errorDetail,
        details: metaMessage,
      },
      { status: 400 }
    );
  }
}
