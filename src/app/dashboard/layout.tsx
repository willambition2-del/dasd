"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  Sliders,
  Settings,
  LogOut,
  Menu,
  X,
  Camera,
  Bot,
  User as UserIcon,
  CircleDot,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [instagramConnected, setInstagramConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 1. Fetch user session and Instagram configuration status
    const fetchSessionAndStatus = async () => {
      try {
        const sessionRes = await fetch("/api/auth/session");
        if (!sessionRes.ok) {
          router.push("/login");
          return;
        }
        const sessionData = await sessionRes.json();
        setUser(sessionData.session);

        const healthRes = await fetch("/api/health");
        if (healthRes.ok) {
          const healthData = await healthRes.json();
          setInstagramConnected(healthData.instagramConfigured);
        }
      } catch (err) {
        console.error("Error loading dashboard session/status:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionAndStatus();
  }, [router]);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        router.push("/login");
        router.refresh();
      }
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const navItems = [
    { name: "الرئيسية", path: "/dashboard", icon: LayoutDashboard },
    { name: "المحادثات", path: "/dashboard/conversations", icon: MessageSquare },
    { name: "قاعدة المعرفة", path: "/dashboard/knowledge", icon: BookOpen },
    { name: "قواعد الرد", path: "/dashboard/rules", icon: Sliders },
    { name: "الإعدادات", path: "/dashboard/settings", icon: Settings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Bot className="w-12 h-12 text-purple-500 animate-bounce mb-4" />
        <p className="text-gray-400 text-sm">جاري تحميل لوحة التحكم...</p>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 md:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Component */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-64 bg-slate-900 border-l border-slate-800 flex flex-col transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
              مساعد إنستغرام
            </span>
          </div>
          <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || (item.path !== "/dashboard" && pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-l from-purple-900/40 to-slate-800 text-purple-200 border-r-4 border-purple-500"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Settings & Status */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 space-y-4">
          {/* User profile */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center text-slate-300">
              <UserIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>

          {/* Instagram connection status */}
          <div className="flex items-center justify-between px-2 py-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-pink-500" />
              <span className="text-xs text-slate-400">حالة الربط</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CircleDot className={`w-3.5 h-3.5 ${instagramConnected ? "text-emerald-500" : "text-amber-500"}`} />
              <span className="text-[10px] font-medium">
                {instagramConnected ? "متصل" : "غير مهيأ"}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-red-500/10 hover:border-red-500/30 text-slate-400 hover:text-red-200 text-xs font-semibold transition-all duration-300 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Mobile Bar */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 md:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-base text-white">مساعد إنستغرام</span>
          </div>
          <button
            className="text-slate-400 hover:text-white p-2 rounded-lg bg-slate-800/50 border border-slate-700/50"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Children Render */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
