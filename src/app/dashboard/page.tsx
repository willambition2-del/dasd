"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MessageSquare,
  MessageCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  UserCheck,
} from "lucide-react";

interface Stats {
  totalConversations: number;
  todayConversations: number;
  todayMessages: number;
  todayBotReplies: number;
  waitingAgentCount: number;
  humanActiveCount: number;
  recentConversations: Array<{
    id: string;
    channel: string;
    status: string;
    lastMessageAt: string;
    customer: {
      name: string;
      username: string;
      externalUserId: string;
    };
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to load dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "BOT_ACTIVE":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">البوت نشط</span>;
      case "WAITING_AGENT":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">انتظار الموظف</span>;
      case "HUMAN_ACTIVE":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">الموظف نشط</span>;
      case "CLOSED":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">مغلقة</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh] text-slate-400 text-sm">
        جاري تحميل الإحصائيات...
      </div>
    );
  }

  const statCards = [
    {
      title: "إجمالي المحادثات",
      value: stats?.totalConversations ?? 0,
      icon: MessageSquare,
      color: "from-blue-600 to-indigo-600",
      description: "إجمالي المحادثات المسجلة في النظام",
    },
    {
      title: "محادثات اليوم",
      value: stats?.todayConversations ?? 0,
      icon: TrendingUp,
      color: "from-purple-600 to-pink-600",
      description: "المحادثات الجديدة التي بدأت اليوم",
    },
    {
      title: "رسائل اليوم",
      value: stats?.todayMessages ?? 0,
      icon: MessageCircle,
      color: "from-emerald-600 to-teal-600",
      description: "الرسائل الواردة والصادرة اليوم",
    },
    {
      title: "ردود البوت التلقائية",
      value: stats?.todayBotReplies ?? 0,
      icon: HelpCircle,
      color: "from-violet-600 to-purple-600",
      description: "الردود التلقائية التي أرسلها البوت اليوم",
    },
    {
      title: "انتظار الموظف",
      value: stats?.waitingAgentCount ?? 0,
      icon: Clock,
      color: "from-amber-600 to-orange-600",
      description: "محادثات تم تحويلها للموظف وبانتظار الرد",
    },
    {
      title: "نشط مع الموظف",
      value: stats?.humanActiveCount ?? 0,
      icon: UserCheck,
      color: "from-cyan-600 to-blue-600",
      description: "المحادثات التي يتابعها الموظف حاليًا",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">لوحة التحكم</h1>
        <p className="text-slate-400 text-sm mt-1">مرحباً بك في نظام الرد التلقائي على رسائل إنستغرام.</p>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden transition-all duration-300 hover:border-slate-700/80 shadow-md group"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-slate-400 text-xs font-semibold">{card.title}</p>
                  <p className="text-3xl font-bold text-slate-100 mt-2 font-mono group-hover:scale-105 transition-transform duration-200">
                    {card.value}
                  </p>
                </div>
                <div className={`p-3 bg-gradient-to-tr ${card.color} rounded-xl shadow-lg shadow-purple-900/10`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-slate-500 text-[11px] mt-4 border-t border-slate-800/80 pt-3">
                {card.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Recent Conversations */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-base font-bold text-slate-200">آخر المحادثات الواردة</h2>
          <Link
            href="/dashboard/conversations"
            className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
          >
            عرض كل المحادثات
            <ArrowRight className="w-4 h-4 rotate-180" />
          </Link>
        </div>

        {stats?.recentConversations && stats.recentConversations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold">
                  <th className="pb-3 pt-1 px-4">العميل</th>
                  <th className="pb-3 pt-1 px-4">الحساب الخارجي</th>
                  <th className="pb-3 pt-1 px-4">تاريخ آخر رسالة</th>
                  <th className="pb-3 pt-1 px-4">الحالة</th>
                  <th className="pb-3 pt-1 px-4 text-left">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {stats.recentConversations.map((conv) => (
                  <tr key={conv.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 px-4 font-semibold text-slate-200">
                      {conv.customer.name || `مستخدم ${conv.customer.externalUserId.slice(-4)}`}
                      {conv.customer.username && (
                        <span className="block text-xs text-slate-500 font-normal mt-0.5">
                          @{conv.customer.username}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 font-mono text-xs text-slate-400">
                      {conv.customer.externalUserId}
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-400">
                      {new Date(conv.lastMessageAt).toLocaleString("ar-SA", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                      })}
                    </td>
                    <td className="py-4 px-4">{getStatusBadge(conv.status)}</td>
                    <td className="py-4 px-4 text-left">
                      <Link
                        href={`/dashboard/conversations/${conv.id}`}
                        className="inline-flex items-center justify-center px-4 py-1.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/50 hover:border-slate-600 rounded-lg text-xs font-medium text-slate-200 hover:text-white transition-all"
                      >
                        عرض ودخول
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500 text-sm">
            لا توجد محادثات مسجلة حاليًا.
          </div>
        )}
      </div>
    </div>
  );
}
