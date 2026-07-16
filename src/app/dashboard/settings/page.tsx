/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Database,
  Camera,
  Save,
  CheckCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // DB Settings fields
  const [botEnabled, setBotEnabled] = useState(true);
  const [defaultReply, setDefaultReply] = useState("");
  const [handoffReply, setHandoffReply] = useState("");
  const [workingHoursEnabled, setWorkingHoursEnabled] = useState(false);

  // Meta Environment Status
  const [envInfo, setEnvInfo] = useState<{
    instagramConfigured: boolean;
    instagramAccountId: string;
    instagramAccessTokenPresent: boolean;
    instagramVerifyTokenMasked: string;
    metaApiVersion: string;
  } | null>(null);

  // Test Results
  const [dbTestResult, setDbTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [dbTesting, setDbTesting] = useState(false);

  const [igTestResult, setIgTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [igTesting, setIgTesting] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setBotEnabled(data.bot_enabled);
        setDefaultReply(data.default_reply);
        setHandoffReply(data.handoff_reply);
        setWorkingHoursEnabled(data.working_hours_enabled);
        setEnvInfo({
          instagramConfigured: data.instagramConfigured,
          instagramAccountId: data.instagramAccountId,
          instagramAccessTokenPresent: data.instagramAccessTokenPresent,
          instagramVerifyTokenMasked: data.instagramVerifyTokenMasked,
          metaApiVersion: data.metaApiVersion,
        });
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setErrorMsg("");

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bot_enabled: botEnabled,
          default_reply: defaultReply,
          handoff_reply: handoffReply,
          working_hours_enabled: workingHoursEnabled,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "فشل حفظ الإعدادات");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "حدث خطأ ما");
    } finally {
      setSaving(false);
    }
  };

  const testDatabase = async () => {
    setDbTesting(true);
    setDbTestResult(null);
    try {
      const res = await fetch("/api/settings/test-db", { method: "POST" });
      const data = await res.json();
      setDbTestResult({
        success: res.ok,
        message: data.message || data.error || "خطأ غير متوقع",
      });
    } catch (err: any) {
      setDbTestResult({
        success: false,
        message: "فشل اختبار الاتصال بقاعدة البيانات: " + err.message,
      });
    } finally {
      setDbTesting(false);
    }
  };

  const testInstagram = async () => {
    setIgTesting(true);
    setIgTestResult(null);
    try {
      const res = await fetch("/api/settings/test-instagram", { method: "POST" });
      const data = await res.json();
      setIgTestResult({
        success: res.ok,
        message: data.message || data.error || "خطأ غير متوقع",
      });
    } catch (err: any) {
      setIgTestResult({
        success: false,
        message: "فشل اختبار الاتصال بـ Meta Graph API: " + err.message,
      });
    } finally {
      setIgTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh] text-slate-400 text-sm">
        جاري تحميل الإعدادات...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <Settings className="w-7 h-7 text-purple-500" />
          إعدادات النظام البوت
        </h1>
        <p className="text-slate-400 text-sm mt-1">تعديل الإعدادات العامة لردود البوت الآلي واختبار التوصيل الخارجي.</p>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-200 text-xs rounded-xl p-3 text-center flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        {saveSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs rounded-xl p-3 text-center flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            تم حفظ جميع التعديلات بنجاح!
          </div>
        )}

        {/* Global toggles card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <h2 className="text-sm font-bold text-slate-200 border-b border-slate-800/80 pb-3">الإعدادات العامة للبوت</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bot Enabled */}
            <div className="flex items-start gap-3 bg-slate-950/40 p-4 border border-slate-850 rounded-xl">
              <input
                type="checkbox"
                id="bot_enabled"
                checked={botEnabled}
                onChange={(e) => setBotEnabled(e.target.checked)}
                className="w-5 h-5 rounded text-purple-600 bg-slate-950 border-slate-800 focus:ring-purple-500 mt-0.5 cursor-pointer"
              />
              <div>
                <label htmlFor="bot_enabled" className="text-slate-200 text-xs font-bold cursor-pointer">
                  تشغيل الرد التلقائي العام
                </label>
                <p className="text-[10px] text-slate-500 mt-1">
                  عند إلغاء تحديد هذا الخيار، سيتم إيقاف الرد التلقائي على جميع العملاء بشكل مؤقت.
                </p>
              </div>
            </div>

            {/* Working Hours */}
            <div className="flex items-start gap-3 bg-slate-950/40 p-4 border border-slate-850 rounded-xl">
              <input
                type="checkbox"
                id="working_hours_enabled"
                checked={workingHoursEnabled}
                onChange={(e) => setWorkingHoursEnabled(e.target.checked)}
                className="w-5 h-5 rounded text-purple-600 bg-slate-950 border-slate-800 focus:ring-purple-500 mt-0.5 cursor-pointer"
              />
              <div>
                <label htmlFor="working_hours_enabled" className="text-slate-200 text-xs font-bold cursor-pointer">
                  تفعيل نظام أوقات العمل
                </label>
                <p className="text-[10px] text-slate-500 mt-1">
                  تفعيل ردود خاصة للعملاء خارج أوقات الدوام الرسمي المحددة (ميزة مستقبلية).
                </p>
              </div>
            </div>
          </div>

          {/* Default Reply */}
          <div>
            <label className="block text-slate-300 text-xs font-semibold mb-2 pr-1">الرد الافتراضي (Default Reply)</label>
            <textarea
              rows={3}
              required
              value={defaultReply}
              onChange={(e) => setDefaultReply(e.target.value)}
              placeholder="اكتب الرد التلقائي عندما لا يجد البوت قاعدة تطابق استفسار العميل..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 text-white text-xs rounded-xl py-3 px-4 outline-none transition-all resize-none"
            />
          </div>

          {/* Handoff Reply */}
          <div>
            <label className="block text-slate-300 text-xs font-semibold mb-2 pr-1">رسالة التحويل لموظف (Handoff Reply)</label>
            <textarea
              rows={3}
              required
              value={handoffReply}
              onChange={(e) => setHandoffReply(e.target.value)}
              placeholder="اكتب رسالة التحويل لخدمة العملاء..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 text-white text-xs rounded-xl py-3 px-4 outline-none transition-all resize-none"
            />
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-purple-950/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            حفظ تعديلات البوت
          </button>
        </div>
      </form>

      {/* Meta Settings & Connectivity card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <h2 className="text-sm font-bold text-slate-200 border-b border-slate-800/80 pb-3">إعدادات الربط والتحقق (Meta API Settings)</h2>

        {/* Masked env configurations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/40 p-4 border border-slate-850 rounded-xl text-xs">
          <div className="flex justify-between py-1 border-b border-slate-900/80">
            <span className="text-slate-400">حساب إنستغرام للأعمال (ID):</span>
            <span className="text-slate-200 font-mono font-semibold">{envInfo?.instagramAccountId || "غير محدد"}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-900/80">
            <span className="text-slate-400">رمز التحقق للـ Webhook (Verify Token):</span>
            <span className="text-slate-400 font-mono font-semibold">{envInfo?.instagramVerifyTokenMasked}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-900/80">
            <span className="text-slate-400">رمز الوصول للـ API (Access Token):</span>
            <span className="text-slate-200 font-semibold">{envInfo?.instagramAccessTokenPresent ? "مهيأ بنجاح (مخفي)" : "غير مضاف"}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-900/80">
            <span className="text-slate-400">إصدار Meta API:</span>
            <span className="text-slate-200 font-mono font-semibold">{envInfo?.metaApiVersion}</span>
          </div>
        </div>

        {/* Integration and verification tests */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Test DB */}
          <div className="space-y-3 bg-slate-900 border border-slate-800/80 p-4 rounded-xl">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-purple-400" />
              اختبار قاعدة البيانات
            </h3>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              التحقق من صحة الاتصال بقاعدة بيانات PostgreSQL المحلية واستجابتها للاستعلامات.
            </p>
            <button
              type="button"
              onClick={testDatabase}
              disabled={dbTesting}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/50 rounded-lg text-[10px] font-bold text-slate-300 hover:text-white cursor-pointer disabled:opacity-50"
            >
              {dbTesting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              فحص الاتصال بقاعدة البيانات
            </button>

            {dbTestResult && (
              <div
                className={`text-[10px] rounded-lg p-2.5 border ${
                  dbTestResult.success
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-red-500/10 border-red-500/30 text-red-400"
                }`}
              >
                {dbTestResult.message}
              </div>
            )}
          </div>

          {/* Test Instagram */}
          <div className="space-y-3 bg-slate-900 border border-slate-800/80 p-4 rounded-xl">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-pink-400" />
              اختبار إعدادات Instagram
            </h3>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              عمل طلب وهمي خفيف إلى خوادم Meta للتحقق من صلاحية رموز التوثيق الحالية.
            </p>
            <button
              type="button"
              onClick={testInstagram}
              disabled={igTesting}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/50 rounded-lg text-[10px] font-bold text-slate-300 hover:text-white cursor-pointer disabled:opacity-50"
            >
              {igTesting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              فحص الربط بإنستغرام
            </button>

            {igTestResult && (
              <div
                className={`text-[10px] rounded-lg p-2.5 border ${
                  igTestResult.success
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-red-500/10 border-red-500/30 text-red-400"
                }`}
              >
                {igTestResult.message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
