/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Search,
  RefreshCw,
  Bell,
  Bot,
  UserCheck,
} from "lucide-react";

interface Conversation {
  id: string;
  channel: string;
  status: string;
  botEnabled: boolean;
  needsHuman: boolean;
  unreadCount: number;
  lastMessageAt: string;
  customer: {
    id: string;
    name: string;
    username: string;
    externalUserId: string;
  };
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = async (status = statusFilter, search = searchTerm) => {
    try {
      let url = "/api/conversations";
      const params = new URLSearchParams();
      if (status) params.append("status", status);
      if (search) params.append("search", search);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchConversations(statusFilter, searchTerm);
    // Poll for updates every 10 seconds for real-time updates
    const interval = setInterval(() => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchConversations(statusFilter, searchTerm);
    }, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, searchTerm]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchConversations(statusFilter, searchTerm);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "BOT_ACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Bot className="w-3.5 h-3.5" />
            البوت نشط
          </span>
        );
      case "WAITING_AGENT":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Bell className="w-3.5 h-3.5 animate-bounce" />
            انتظار الموظف
          </span>
        );
      case "HUMAN_ACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <UserCheck className="w-3.5 h-3.5" />
            الموظف نشط
          </span>
        );
      case "CLOSED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">
            مغلقة
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">
            {status}
          </span>
        );
    }
  };

  const filters = [
    { name: "الكل", value: "" },
    { name: "البوت نشط", value: "BOT_ACTIVE" },
    { name: "انتظار موظف", value: "WAITING_AGENT" },
    { name: "الموظف نشط", value: "HUMAN_ACTIVE" },
    { name: "المغلقة", value: "CLOSED" },
  ];

  return (
    <div className="space-y-6">
      {/* Title & Refresh */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">إدارة المحادثات</h1>
          <p className="text-slate-400 text-sm mt-1">متابعة رسائل العملاء، والتحكم بحالة رد البوت الآلي.</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
        {/* Search */}
        <div className="relative lg:col-span-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث باسم العميل، المعرف أو الـ Username..."
            className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl py-2.5 pr-11 pl-4 text-white placeholder-slate-500 outline-none transition-all text-xs"
          />
        </div>

        {/* Status filters */}
        <div className="flex flex-wrap gap-2 lg:col-span-2 justify-start lg:justify-end">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => {
                setLoading(true);
                setStatusFilter(filter.value);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                statusFilter === filter.value
                  ? "bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-950/20"
                  : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
              }`}
            >
              {filter.name}
            </button>
          ))}
        </div>
      </div>

      {/* Conversations List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-slate-400 text-sm">
            جاري تحميل المحادثات...
          </div>
        ) : conversations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold bg-slate-900/50">
                  <th className="py-4 px-6">العميل</th>
                  <th className="py-4 px-6">المعرف الخارجي</th>
                  <th className="py-4 px-6">حالة البوت</th>
                  <th className="py-4 px-6">تاريخ النشاط</th>
                  <th className="py-4 px-6">حالة المحادثة</th>
                  <th className="py-4 px-6 text-left">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {conversations.map((conv) => (
                  <tr
                    key={conv.id}
                    className={`hover:bg-slate-800/10 transition-colors ${
                      conv.unreadCount > 0 ? "bg-purple-950/5" : ""
                    }`}
                  >
                    <td className="py-4 px-6 font-semibold text-slate-200">
                      <div className="flex items-center gap-3">
                        {conv.unreadCount > 0 && (
                          <span className="h-5 min-w-[20px] px-1.5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full animate-pulse">
                            {conv.unreadCount}
                          </span>
                        )}
                        <div>
                          <span>
                            {conv.customer.name || `عميل إنستغرام (${conv.customer.externalUserId.slice(-4)})`}
                          </span>
                          {conv.customer.username && (
                            <span className="block text-xs text-slate-500 font-normal mt-0.5">
                              @{conv.customer.username}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-400">
                      {conv.customer.externalUserId}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`text-xs font-semibold ${
                          conv.botEnabled ? "text-emerald-400" : "text-amber-400"
                        }`}
                      >
                        {conv.botEnabled ? "مفعّل تلقائيًا" : "معطّل (يدوي)"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-400">
                      {new Date(conv.lastMessageAt).toLocaleString("ar-SA", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                      })}
                    </td>
                    <td className="py-4 px-6">{getStatusBadge(conv.status)}</td>
                    <td className="py-4 px-6 text-left">
                      <Link
                        href={`/dashboard/conversations/${conv.id}`}
                        className="inline-flex items-center justify-center px-4 py-2 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/50 hover:border-slate-600 rounded-xl text-xs font-semibold text-slate-200 hover:text-white transition-all"
                      >
                        عرض وتحديث
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-20 text-slate-500 text-sm">
            لا توجد محادثات تطابق الفلترة الحالية.
          </div>
        )}
      </div>
    </div>
  );
}
