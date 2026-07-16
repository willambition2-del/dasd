/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Send,
  ArrowRight,
  Bot,
  User,
  Shield,
  Clock,
  UserCheck,
  CheckCircle,
  HelpCircle,
  Loader2,
  XCircle,
} from "lucide-react";

interface Message {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  senderType: "CUSTOMER" | "BOT" | "AGENT";
  replySource?: "RULE" | "KNOWLEDGE" | "AI" | "DEFAULT" | "HUMAN" | null;
  contentType: string;
  text?: string | null;
  mediaUrl?: string | null;
  deliveryStatus?: string | null;
  errorMessage?: string | null;
  createdAt: string;
}

interface Conversation {
  id: string;
  channel: string;
  status: "BOT_ACTIVE" | "WAITING_AGENT" | "HUMAN_ACTIVE" | "CLOSED";
  botEnabled: boolean;
  needsHuman: boolean;
  customer: {
    id: string;
    name: string;
    username: string;
    externalUserId: string;
  };
  messages: Message[];
}

export default function ConversationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchDetails = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        setConversation(data);
      }
    } catch (err) {
      console.error("Failed to load conversation details:", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDetails(true);

    // Poll messages every 5 seconds for live chat
    const interval = setInterval(() => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchDetails(false);
    }, 5000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Scroll to bottom when messages load or change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: replyText }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "فشل إرسال الرسالة");
        return;
      }

      setReplyText("");
      fetchDetails(false);
    } catch (err: any) {
      alert("حدث خطأ أثناء إرسال الرسالة: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (actionPath: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/${actionPath}`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "فشلت العملية");
        return;
      }

      fetchDetails(false);
    } catch (err: any) {
      alert("حدث خطأ: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getSourceText = (source: string | null | undefined) => {
    switch (source) {
      case "RULE":
        return "مطابقة القواعد";
      case "KNOWLEDGE":
        return "قاعدة المعرفة";
      case "DEFAULT":
        return "الرد التلقائي الافتراضي";
      case "HUMAN":
        return "الموظف";
      default:
        return "غير محدد";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "BOT_ACTIVE":
        return <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">رد البوت نشط</span>;
      case "WAITING_AGENT":
        return <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">بانتظار موظف</span>;
      case "HUMAN_ACTIVE":
        return <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">متابعة يدوية نشطة</span>;
      case "CLOSED":
        return <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">المحادثة مغلقة</span>;
      default:
        return <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-slate-500/10 text-slate-400">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh] text-slate-400 text-sm">
        جاري تحميل المحادثة...
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-red-400">المحادثة غير موجودة أو تم حذفها.</p>
        <Link href="/dashboard/conversations" className="text-purple-400 hover:underline">
          العودة للمحادثات
        </Link>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col lg:flex-row gap-6 animate-fade-in">
      {/* Right Column: Chat History */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col min-w-0 overflow-hidden shadow-lg">
        {/* Chat Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/conversations"
              className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
            </Link>
            <div>
              <h2 className="text-sm font-bold text-slate-200">
                {conversation.customer.name || `عميل (${conversation.customer.externalUserId.slice(-4)})`}
              </h2>
              {conversation.customer.username && (
                <p className="text-xs text-slate-500 mt-0.5">@{conversation.customer.username}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(conversation.status)}
          </div>
        </div>

        {/* Messages Log */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-950/20">
          {conversation.messages.length > 0 ? (
            conversation.messages.map((msg) => {
              const isInbound = msg.direction === "INBOUND";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isInbound ? "items-start" : "items-end"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-md ${
                      isInbound
                        ? "bg-slate-800 text-slate-200 rounded-tr-none border border-slate-700/50"
                        : msg.senderType === "BOT"
                        ? "bg-gradient-to-l from-purple-900 to-indigo-950 text-purple-100 rounded-tl-none border border-purple-800/40"
                        : "bg-gradient-to-l from-pink-900 to-rose-950 text-pink-100 rounded-tl-none border border-pink-800/40"
                    }`}
                  >
                    {/* Header info */}
                    <div className="flex items-center gap-1.5 mb-1.5 text-[10px] text-slate-400 font-semibold">
                      {msg.senderType === "BOT" ? (
                        <>
                          <Bot className="w-3 h-3 text-purple-400" />
                          <span>رد آلي ({getSourceText(msg.replySource)})</span>
                        </>
                      ) : msg.senderType === "AGENT" ? (
                        <>
                          <User className="w-3 h-3 text-pink-400" />
                          <span>رد الموظف</span>
                        </>
                      ) : (
                        <span>العميل</span>
                      )}
                    </div>

                    {/* Text content */}
                    {msg.text && <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.text}</p>}

                    {/* Media content */}
                    {msg.mediaUrl && (
                      <div className="mt-2 rounded-lg overflow-hidden border border-slate-700 max-w-xs">
                        {msg.contentType === "IMAGE" ? (
                          <img
                            src={msg.mediaUrl}
                            alt="Sent media"
                            className="object-cover w-full h-auto max-h-48"
                          />
                        ) : (
                          <a
                            href={msg.mediaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-purple-300 underline block p-2"
                          >
                            مشاهدة الملف المرفق
                          </a>
                        )}
                      </div>
                    )}

                    {/* Meta error info */}
                    {msg.deliveryStatus === "FAILED" && (
                      <p className="text-[10px] text-red-400 mt-1 border-t border-red-500/20 pt-1 flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        فشل الإرسال: {msg.errorMessage}
                      </p>
                    )}
                  </div>

                  {/* Timestamp */}
                  <span className="text-[9px] text-slate-500 mt-1.5 px-2">
                    {new Date(msg.createdAt).toLocaleTimeString("ar-SA", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="text-center py-20 text-slate-500 text-xs">لا توجد رسائل مسجلة.</div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Manual Reply Footer */}
        {conversation.status !== "CLOSED" ? (
          <form
            onSubmit={handleSendReply}
            className="p-4 border-t border-slate-800 bg-slate-900/40 flex items-center gap-3"
          >
            <input
              type="text"
              required
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="اكتب ردك اليدوي هنا لإرساله للعميل..."
              className="flex-1 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl py-3 px-4 text-white text-xs outline-none transition-all"
            />
            <button
              type="submit"
              disabled={submitting || !replyText.trim()}
              className="p-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl shadow-lg shadow-purple-950/20 transition-all cursor-pointer flex items-center justify-center"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 rotate-180" />}
            </button>
          </form>
        ) : (
          <div className="p-4 bg-slate-950/60 border-t border-slate-800 text-center text-xs text-slate-400">
            تم إغلاق هذه المحادثة. يمكنك إعادة تشغيل البوت أو استلامها لتتمكن من إرسال الرسائل.
          </div>
        )}
      </div>

      {/* Left Column: Side Management Drawer */}
      <div className="w-full lg:w-72 space-y-6">
        {/* Info card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3">إدارة الحالة</h3>

          {/* Quick info grid */}
          <div className="space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">حالة البوت:</span>
              <span className={`font-semibold ${conversation.botEnabled ? "text-emerald-400" : "text-amber-400"}`}>
                {conversation.botEnabled ? "مفعّل تلقائيًا" : "معطّل"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">الحاجة لموظف:</span>
              <span className={`font-semibold ${conversation.needsHuman ? "text-red-400" : "text-slate-400"}`}>
                {conversation.needsHuman ? "نعم، عاجل" : "لا"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">اسم العميل:</span>
              <span className="text-slate-200 font-mono">{conversation.customer.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">معرف العميل:</span>
              <span className="text-slate-400 font-mono text-[10px] truncate max-w-[140px]" title={conversation.customer.externalUserId}>
                {conversation.customer.externalUserId}
              </span>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3 mb-4">إجراءات الموظف</h3>

          {/* Claim conversation */}
          {conversation.status !== "HUMAN_ACTIVE" && conversation.status !== "CLOSED" && (
            <button
              onClick={() => handleAction("claim")}
              disabled={actionLoading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-950/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <UserCheck className="w-4 h-4" />
              استلام المحادثة (رد يدوي)
            </button>
          )}

          {/* Transfer to human queue */}
          {conversation.status !== "WAITING_AGENT" && conversation.status !== "CLOSED" && (
            <button
              onClick={() => handleAction("transfer")}
              disabled={actionLoading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-950/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Clock className="w-4 h-4" />
              تحويل إلى موظف
            </button>
          )}

          {/* Restart Bot */}
          {(!conversation.botEnabled || conversation.status !== "BOT_ACTIVE") && (
            <button
              onClick={() => handleAction("enable-bot")}
              disabled={actionLoading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-950/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Bot className="w-4 h-4" />
              إعادة تشغيل البوت
            </button>
          )}

          {/* Close conversation */}
          {conversation.status !== "CLOSED" && (
            <button
              onClick={() => handleAction("close")}
              disabled={actionLoading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700/50 hover:border-slate-600 transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              إغلاق المحادثة
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
