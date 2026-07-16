/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Sliders,
  AlertCircle,
  X,
  Loader2,
} from "lucide-react";

interface BotRule {
  id: string;
  name: string;
  triggerWords: string;
  replyText: string;
  priority: number;
  requiresHuman: boolean;
  isActive: boolean;
}

export default function RulesPage() {
  const [rules, setRules] = useState<BotRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<BotRule | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [triggerWords, setTriggerWords] = useState("");
  const [replyText, setReplyText] = useState("");
  const [priority, setPriority] = useState(0);
  const [requiresHuman, setRequiresHuman] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchRules = async () => {
    try {
      const res = await fetch("/api/rules");
      if (res.ok) {
        const data = await res.json();
        setRules(data);
      }
    } catch (err) {
      console.error("Failed to load bot rules:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAddModal = () => {
    setEditingRule(null);
    setName("");
    setTriggerWords("");
    setReplyText("");
    setPriority(0);
    setRequiresHuman(false);
    setIsActive(true);
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (rule: BotRule) => {
    setEditingRule(rule);
    setName(rule.name);
    setTriggerWords(rule.triggerWords);
    setReplyText(rule.replyText);
    setPriority(rule.priority);
    setRequiresHuman(rule.requiresHuman);
    setIsActive(rule.isActive);
    setFormError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !triggerWords.trim() || !replyText.trim()) {
      setFormError("يرجى ملء جميع الحقول المطلوبة.");
      return;
    }

    setSaving(true);
    setFormError("");

    const payload = {
      name,
      triggerWords,
      replyText,
      priority,
      requiresHuman,
      isActive,
    };

    try {
      const method = editingRule ? "PUT" : "POST";
      const url = editingRule ? `/api/rules/${editingRule.id}` : "/api/rules";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "فشلت العملية");
      }

      setModalOpen(false);
      fetchRules();
    } catch (err: any) {
      setFormError(err.message || "حدث خطأ ما");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه القاعدة؟")) return;

    try {
      const res = await fetch(`/api/rules/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchRules();
      } else {
        const data = await res.json();
        alert(data.error || "فشل الحذف");
      }
    } catch (err: any) {
      alert("حدث خطأ أثناء حذف القاعدة: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Sliders className="w-7 h-7 text-purple-500" />
            قواعد الرد الكلمات المفتاحية (Bot Rules)
          </h1>
          <p className="text-slate-400 text-sm mt-1">تحديد كلمات مفتاحية معينة لتفعيل ردود تلقائية فورية من البوت.</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-purple-950/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          إضافة قاعدة جديدة
        </button>
      </div>

      {/* Main Table/Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-slate-400 text-sm">
            جاري تحميل قواعد البوت...
          </div>
        ) : rules.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold bg-slate-900/50">
                  <th className="py-4 px-6">اسم القاعدة</th>
                  <th className="py-4 px-6">الكلمات المفتاحية المطلقة</th>
                  <th className="py-4 px-6">الرد التلقائي</th>
                  <th className="py-4 px-6">أولوية القاعدة</th>
                  <th className="py-4 px-6">تحويل للموظف</th>
                  <th className="py-4 px-6">الحالة</th>
                  <th className="py-4 px-6 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-800/10 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-200">
                      {rule.name}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-400 max-w-[180px] truncate" title={rule.triggerWords}>
                      {rule.triggerWords}
                    </td>
                    <td className="py-4 px-6 max-w-xs truncate" title={rule.replyText}>
                      {rule.replyText}
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-400">
                      {rule.priority}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`text-xs ${rule.requiresHuman ? "text-red-400 font-semibold" : "text-slate-500"}`}>
                        {rule.requiresHuman ? "نعم" : "لا"}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold ${
                          rule.isActive ? "text-emerald-400" : "text-slate-500"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${rule.isActive ? "bg-emerald-400" : "bg-slate-500"}`}></span>
                        {rule.isActive ? "نشط" : "معطّل"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-left">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => openEditModal(rule)}
                          className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(rule.id)}
                          className="p-2 bg-slate-850 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/30 rounded-lg text-slate-500 hover:text-red-400 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-20 text-slate-500 text-sm">
            لا توجد قواعد رد معرّفة حاليًا. اضغط على «إضافة قاعدة جديدة» للبدء.
          </div>
        )}
      </div>

      {/* Modal Form */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative animate-zoom-in">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-950/30">
              <h3 className="text-base font-bold text-slate-200">
                {editingRule ? "تعديل قاعدة الرد" : "إضافة قاعدة رد جديدة"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {formError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-200 text-xs rounded-xl p-3 text-center flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {formError}
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-2 pr-1">اسم القاعدة</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: قاعدة الاستفسار عن الأسعار"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 text-white text-xs rounded-xl py-3 px-4 outline-none transition-all"
                />
              </div>

              {/* Trigger Words */}
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-2 pr-1">
                  الكلمات المفتاحية للتشغيل (مفصولة بفاصلة)
                </label>
                <input
                  type="text"
                  required
                  value={triggerWords}
                  onChange={(e) => setTriggerWords(e.target.value)}
                  placeholder="مثال: اسعار,سعر,بكم,تكلفة"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 text-white text-xs rounded-xl py-3 px-4 outline-none transition-all"
                />
                <p className="text-[10px] text-slate-500 mt-1 pr-1">
                  ملاحظة: سيقوم البوت بمطابقة هذه الكلمات بشكل كامل أو جزئي بحسب تركيب الجملة.
                </p>
              </div>

              {/* Reply Text */}
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-2 pr-1">نص الرد التلقائي</label>
                <textarea
                  required
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="أدخل نص الرد التلقائي الذي سيرسله البوت للعميل..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 text-white text-xs rounded-xl py-3 px-4 outline-none transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/40 p-4 border border-slate-800/80 rounded-xl">
                {/* Priority */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2 pr-1">أولوية المطابقة</label>
                  <input
                    type="number"
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 text-white text-xs rounded-xl py-2 px-3 outline-none transition-all"
                  />
                </div>

                {/* Requires Human */}
                <div className="flex items-center gap-3 mt-4 md:mt-0">
                  <input
                    type="checkbox"
                    id="requiresHumanRule"
                    checked={requiresHuman}
                    onChange={(e) => setRequiresHuman(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 bg-slate-950 border-slate-800 focus:ring-purple-500"
                  />
                  <label htmlFor="requiresHumanRule" className="text-slate-300 text-xs font-semibold cursor-pointer">
                    تحويل لموظف بعد الرد
                  </label>
                </div>

                {/* Active */}
                <div className="flex items-center gap-3 mt-4 md:mt-0">
                  <input
                    type="checkbox"
                    id="isActiveRule"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 bg-slate-950 border-slate-800 focus:ring-purple-500"
                  />
                  <label htmlFor="isActiveRule" className="text-slate-300 text-xs font-semibold cursor-pointer">
                    تفعيل القاعدة
                  </label>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/50 text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-purple-950/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingRule ? "تحديث" : "إضافة"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
