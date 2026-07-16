/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  BookOpen,
  Check,
  AlertCircle,
  X,
  Loader2,
} from "lucide-react";

interface KnowledgeItem {
  id: string;
  category: string;
  title: string;
  content: string;
  keywords: string;
  priority: number;
  requiresHuman: boolean;
  isActive: boolean;
}

const CATEGORIES = [
  { value: "BUSINESS_INFO", label: "معلومات العمل" },
  { value: "SERVICES", label: "الخدمات" },
  { value: "PRICES", label: "الأسعار" },
  { value: "PAYMENT", label: "الدفع وطرق السداد" },
  { value: "FAQ", label: "الأسئلة الشائعة" },
  { value: "ORDER_DETAILS", label: "تفاصيل الطلبات" },
  { value: "COMPLAINTS", label: "الشكاوى والاقتراحات" },
  { value: "WORKING_HOURS", label: "أوقات العمل" },
];

export default function KnowledgePage() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | null>(null);

  // Form Fields
  const [category, setCategory] = useState("BUSINESS_INFO");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [keywords, setKeywords] = useState("");
  const [priority, setPriority] = useState(0);
  const [requiresHuman, setRequiresHuman] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/knowledge");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error("Failed to load knowledge base:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setCategory("BUSINESS_INFO");
    setTitle("");
    setContent("");
    setKeywords("");
    setPriority(0);
    setRequiresHuman(false);
    setIsActive(true);
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (item: KnowledgeItem) => {
    setEditingItem(item);
    setCategory(item.category);
    setTitle(item.title);
    setContent(item.content);
    setKeywords(item.keywords);
    setPriority(item.priority);
    setRequiresHuman(item.requiresHuman);
    setIsActive(item.isActive);
    setFormError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !keywords.trim()) {
      setFormError("يرجى ملء جميع الحقول المطلوبة.");
      return;
    }

    setSaving(true);
    setFormError("");

    const payload = {
      category,
      title,
      content,
      keywords,
      priority,
      requiresHuman,
      isActive,
    };

    try {
      const method = editingItem ? "PUT" : "POST";
      const url = editingItem ? `/api/knowledge/${editingItem.id}` : "/api/knowledge";

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
      fetchItems();
    } catch (err: any) {
      setFormError(err.message || "حدث خطأ ما");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء.")) return;

    try {
      const res = await fetch(`/api/knowledge/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchItems();
      } else {
        const data = await res.json();
        alert(data.error || "فشل الحذف");
      }
    } catch (err: any) {
      alert("حدث خطأ أثناء حذف العنصر: " + err.message);
    }
  };

  const getCategoryLabel = (val: string) => {
    return CATEGORIES.find((c) => c.value === val)?.label || val;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-purple-500" />
            قاعدة المعرفة (Knowledge Base)
          </h1>
          <p className="text-slate-400 text-sm mt-1">تغذية البوت بالمعلومات العامة والأسئلة الشائعة ليجيب العملاء بشكل تلقائي.</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-purple-950/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          إضافة معلومة جديدة
        </button>
      </div>

      {/* Main Table/Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-slate-400 text-sm">
            جاري تحميل قاعدة المعرفة...
          </div>
        ) : items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold bg-slate-900/50">
                  <th className="py-4 px-6">العنوان</th>
                  <th className="py-4 px-6">التصنيف</th>
                  <th className="py-4 px-6">المحتوى</th>
                  <th className="py-4 px-6">الكلمات الدلالية</th>
                  <th className="py-4 px-6">تحويل للموظف</th>
                  <th className="py-4 px-6">الحالة</th>
                  <th className="py-4 px-6 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/10 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-200">
                      {item.title}
                      <span className="block text-[10px] text-slate-500 font-normal mt-0.5 font-mono">
                        الأولوية: {item.priority}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-1 text-[10px] font-medium bg-slate-800 border border-slate-700/80 rounded-md text-slate-300">
                        {getCategoryLabel(item.category)}
                      </span>
                    </td>
                    <td className="py-4 px-6 max-w-xs truncate" title={item.content}>
                      {item.content}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-400 max-w-[150px] truncate" title={item.keywords}>
                      {item.keywords}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`text-xs ${item.requiresHuman ? "text-red-400 font-semibold" : "text-slate-500"}`}>
                        {item.requiresHuman ? "نعم" : "لا"}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold ${
                          item.isActive ? "text-emerald-400" : "text-slate-500"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${item.isActive ? "bg-emerald-400" : "bg-slate-500"}`}></span>
                        {item.isActive ? "مفعّل" : "معطّل"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-left">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
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
            لا توجد عناصر معرفة حاليًا. اضغط على "إضافة معلومة جديدة" للبدء.
          </div>
        )}
      </div>

      {/* Slide-over Modal Form */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative animate-zoom-in">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-950/30">
              <h3 className="text-base font-bold text-slate-200">
                {editingItem ? "تعديل عنصر المعرفة" : "إضافة معلومة جديدة"}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2 pr-1">التصنيف</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 text-white text-xs rounded-xl py-3 px-4 outline-none transition-all"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-2 pr-1">العنوان</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: أوقات العمل الرسمية"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 text-white text-xs rounded-xl py-3 px-4 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-2 pr-1">
                  الكلمات المفتاحية (دلالية، مفصولة بفاصلة)
                </label>
                <input
                  type="text"
                  required
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="مثال: متى تفتحون,ساعات العمل,أوقات العمل,متى تسكرون"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 text-white text-xs rounded-xl py-3 px-4 outline-none transition-all"
                />
                <p className="text-[10px] text-slate-500 mt-1 pr-1">
                  ملاحظة: سيتم مطابقة هذه الكلمات بعد تنقية الرسائل الواردة بشكل مرن.
                </p>
              </div>

              {/* Content */}
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-2 pr-1">محتوى الإجابة / الرد</label>
                <textarea
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="أدخل النص التفصيلي للرد الذي سيرسله البوت..."
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
                    id="requiresHuman"
                    checked={requiresHuman}
                    onChange={(e) => setRequiresHuman(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 bg-slate-950 border-slate-800 focus:ring-purple-500"
                  />
                  <label htmlFor="requiresHuman" className="text-slate-300 text-xs font-semibold cursor-pointer">
                    تحويل لموظف بعد الرد
                  </label>
                </div>

                {/* Active */}
                <div className="flex items-center gap-3 mt-4 md:mt-0">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 bg-slate-950 border-slate-800 focus:ring-purple-500"
                  />
                  <label htmlFor="isActive" className="text-slate-300 text-xs font-semibold cursor-pointer">
                    تفعيل العنصر
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
                  {editingItem ? "تحديث" : "إضافة"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
