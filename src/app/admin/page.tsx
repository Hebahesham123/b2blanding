"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Submission } from "@/lib/supabase";

async function fetchSubmissions(): Promise<Submission[]> {
  try {
    const res = await fetch("/api/submissions", {
      cache: "no-store",
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}

function formatDate(iso: string) {
  try {
    const date = new Date(iso);
    return date.toLocaleString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatDateShort(iso: string) {
  try {
    const date = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "اليوم";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "أمس";
    }
    return date.toLocaleDateString("ar-EG", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function AdminPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    loadSubmissions();
    const interval = setInterval(loadSubmissions, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredSubmissions(submissions);
    } else {
      const filtered = submissions.filter(
        (sub) =>
          sub.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sub.phone_number.includes(searchTerm) ||
          sub.promo_code.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSubmissions(filtered);
    }
  }, [searchTerm, submissions]);

  async function loadSubmissions() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSubmissions();
      if (Array.isArray(data)) {
        setSubmissions(data);
        setFilteredSubmissions(data);
      } else {
        setError("خطأ في تحميل البيانات");
      }
    } catch (error) {
      console.error("Failed to load submissions:", error);
      setError("فشل في تحميل البيانات. تأكد من إعداد Supabase بشكل صحيح.");
    } finally {
      setLoading(false);
    }
  }

  const totalSubmissions = submissions.length;
  const todaySubmissions = submissions.filter((sub) => {
    const subDate = new Date(sub.created_at);
    const today = new Date();
    return subDate.toDateString() === today.toDateString();
  }).length;

  const thisWeekSubmissions = submissions.filter((sub) => {
    const subDate = new Date(sub.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return subDate >= weekAgo;
  }).length;

  const uniquePromoCodes = new Set(submissions.map((s) => s.promo_code)).size;

  function exportToCSV() {
    const headers = ["الاسم الكامل", "رقم الهاتف", "كود الخصم", "التاريخ"];
    const rows = filteredSubmissions.map((sub) => [
      sub.full_name,
      sub.phone_number,
      sub.promo_code,
      formatDate(sub.created_at),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `submissions-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 py-6 px-4 sm:py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-stone-800 mb-1">لوحة التحكم</h1>
            <p className="text-stone-600 text-sm">إدارة طلبات العملاء والقسائم</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadSubmissions}
              disabled={loading}
              className="px-4 py-2 bg-stone-700 hover:bg-stone-800 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              تحديث
            </button>
            {filteredSubmissions.length > 0 && (
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                تصدير CSV
              </button>
            )}
            <Link
              href="/"
              className="px-4 py-2 bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 rounded-lg text-sm font-medium transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              العودة للصفحة الرئيسية
            </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-stone-600 text-sm mb-1">إجمالي الطلبات</p>
                <p className="text-3xl font-bold text-stone-800">{totalSubmissions}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-stone-600 text-sm mb-1">طلبات اليوم</p>
                <p className="text-3xl font-bold text-amber-600">{todaySubmissions}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-stone-600 text-sm mb-1">طلبات هذا الأسبوع</p>
                <p className="text-3xl font-bold text-green-600">{thisWeekSubmissions}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-stone-600 text-sm mb-1">أكواد الخصم</p>
                <p className="text-3xl font-bold text-purple-600">{uniquePromoCodes}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Table */}
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="p-4 border-b border-stone-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-stone-800">الطلبات</h2>
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="بحث بالاسم، رقم الهاتف، أو كود الخصم..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pr-10 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm"
                  dir="rtl"
                />
                <svg
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-stone-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
              <p className="mt-4 text-stone-600">جاري التحميل...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-600 font-medium mb-2">{error}</p>
              <p className="text-stone-600 text-sm mb-4">
                تأكد من إعداد متغيرات البيئة في Vercel:
                <br />
                NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_ANON_KEY
              </p>
              <button
                onClick={loadSubmissions}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="p-12 text-center text-stone-500">
              {searchTerm ? "لم يتم العثور على نتائج" : "لا توجد طلبات حتى الآن. ستظهر هنا عند تقديم العملاء للنموذج."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold text-stone-700 text-sm">#</th>
                    <th className="py-3 px-4 font-semibold text-stone-700 text-sm">الاسم الكامل</th>
                    <th className="py-3 px-4 font-semibold text-stone-700 text-sm">رقم الهاتف</th>
                    <th className="py-3 px-4 font-semibold text-stone-700 text-sm">كود الخصم</th>
                    <th className="py-3 px-4 font-semibold text-stone-700 text-sm">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.map((row, index) => (
                    <tr
                      key={row.id}
                      className="border-b border-stone-100 hover:bg-stone-50 transition"
                    >
                      <td className="py-3 px-4 text-stone-500 text-sm">{filteredSubmissions.length - index}</td>
                      <td className="py-3 px-4 text-stone-800 font-medium">{row.full_name}</td>
                      <td className="py-3 px-4 text-stone-700">
                        <a href={`tel:${row.phone_number}`} className="hover:text-amber-600 transition">
                          {row.phone_number}
                        </a>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 font-mono font-semibold rounded-lg text-sm">
                          {row.promo_code}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-stone-600 text-sm">
                        <div className="flex flex-col">
                          <span>{formatDateShort(row.created_at)}</span>
                          <span className="text-xs text-stone-400">{formatDate(row.created_at)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filteredSubmissions.length > 0 && (
            <div className="p-4 border-t border-stone-200 bg-stone-50 text-sm text-stone-600">
              عرض {filteredSubmissions.length} من {totalSubmissions} طلب
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
