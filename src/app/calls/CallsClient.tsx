"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import type { User } from "@/lib/auth";

interface CallCategory {
  id: number;
  name: string;
  manual: string | null;
  sort_order: number;
}

interface Props {
  user: User;
}

const CATEGORY_ICONS: Record<string, string> = {
  "期日前投票関連": "🗳️",
  "入場整理券関連": "📨",
  "選挙公報関連": "📰",
  "選挙運動・政治活動関連": "📣",
  "不在者・郵便投票関連": "✉️",
  "その他": "📋",
};

const CATEGORY_COLORS: { bg: string; border: string; icon: string }[] = [
  { bg: "bg-blue-50 hover:bg-blue-100", border: "border-blue-200", icon: "text-blue-600" },
  { bg: "bg-indigo-50 hover:bg-indigo-100", border: "border-indigo-200", icon: "text-indigo-600" },
  { bg: "bg-violet-50 hover:bg-violet-100", border: "border-violet-200", icon: "text-violet-600" },
  { bg: "bg-amber-50 hover:bg-amber-100", border: "border-amber-200", icon: "text-amber-600" },
  { bg: "bg-emerald-50 hover:bg-emerald-100", border: "border-emerald-200", icon: "text-emerald-600" },
  { bg: "bg-slate-50 hover:bg-slate-100", border: "border-slate-200", icon: "text-slate-600" },
];

export default function CallsClient({ user }: Props) {
  const router = useRouter();
  const [categories, setCategories] = useState<CallCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/calls");
      const data = await res.json() as { categories: CallCategory[] };
      setCategories(data.categories);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  return (
    <AppShell user={user} demoMode={false}>
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: "#f0f5ff" }}>

        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📞</span>
            <div>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Call Log</p>
              <h1 className="text-base font-bold text-slate-800 leading-tight">受電記録</h1>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">問い合わせカテゴリを選択してください</p>
        </div>

        {/* Category Grid */}
        <div className="px-6 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <span className="text-slate-400 text-sm">読み込み中...</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {categories.map((cat, idx) => {
                const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                return (
                  <button
                    key={cat.id}
                    onClick={() => router.push(`/calls/${cat.id}`)}
                    className={`relative flex flex-col items-start gap-3 rounded-2xl border-2 ${color.bg} ${color.border} p-5 text-left shadow-sm hover:shadow-md active:scale-[0.98] transition-all`}
                  >
                    <span className={`text-3xl ${color.icon}`}>{CATEGORY_ICONS[cat.name] ?? "📞"}</span>
                    <p className="text-sm font-bold text-slate-800 leading-snug">{cat.name}</p>
                    <div className="absolute top-3 right-3 text-slate-300">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
