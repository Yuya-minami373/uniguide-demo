"use client";

import { useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import type { User } from "@/lib/auth";

interface Kian {
  id: number;
  title: string;
  category: string;
  task_id: number | null;
  task_title: string | null;
  due_timing: string | null;
  status: string;
  note: string | null;
}

interface Props {
  user: User;
  kians: Kian[];
}

const STATUS_STYLE = {
  "未着手": { dot: "bg-gray-400", badge: "bg-gray-100 text-gray-600 border-gray-200", label: "未着手" },
  "起案済": { dot: "bg-blue-500", badge: "bg-blue-50 text-blue-700 border-blue-200", label: "起案済" },
  "決裁済": { dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "決裁済" },
} as const;

export default function KianClient({ user, kians }: Props) {
  // プロジェクト別にグルーピング
  const categories: Record<string, Kian[]> = {};
  kians.forEach(k => {
    if (!categories[k.category]) categories[k.category] = [];
    categories[k.category].push(k);
  });
  const catNames = Object.keys(categories);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const totalKians = kians.length;
  const decided = kians.filter(k => k.status === "決裁済").length;
  const drafted = kians.filter(k => k.status === "起案済").length;
  const todo = kians.filter(k => k.status === "未着手").length;
  const overallPct = totalKians > 0 ? Math.round((decided / totalKians) * 100) : 0;

  return (
    <AppShell user={user}>
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: "#f8fafc" }}>
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-400 font-medium tracking-wide">起案管理</p>
              <h1 className="text-base font-bold text-gray-900 leading-tight">起案・議案一覧</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[11px] text-gray-500">決裁済 <span className="font-bold text-emerald-600">{decided}</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-[11px] text-gray-500">起案済 <span className="font-bold text-blue-600">{drafted}</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-gray-400" />
                  <span className="text-[11px] text-gray-500">未着手 <span className="font-bold text-gray-600">{todo}</span></span>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                <span className="text-[10px] text-gray-400 font-medium">全体進捗</span>
                <span className="text-lg font-bold text-gray-800 tabular-nums">{overallPct}%</span>
                <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full flex">
                    <div className="bg-emerald-500 rounded-l-full" style={{ width: `${overallPct}%` }} />
                    <div className="bg-blue-400" style={{ width: `${totalKians > 0 ? Math.round((drafted / totalKians) * 100) : 0}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {catNames.map(cat => {
            const items = categories[cat];
            const catDecided = items.filter(k => k.status === "決裁済").length;
            const catPct = items.length > 0 ? Math.round((catDecided / items.length) * 100) : 0;

            return (
              <div key={cat} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Category header */}
                <button
                  onClick={() => setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }))}
                  className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50/50 w-full text-left hover:bg-gray-50 transition"
                >
                  <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform shrink-0 ${collapsed[cat] ? "-rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                  <h2 className="text-sm font-bold text-gray-800">{cat}</h2>
                  <span className="text-[11px] text-gray-400">{items.length}件</span>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-[11px] text-gray-400">決裁済 {catDecided}/{items.length}</span>
                    <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${catPct}%` }} />
                    </div>
                    <span className="text-[11px] font-bold text-gray-600 tabular-nums">{catPct}%</span>
                  </div>
                </button>

                {/* Kian rows */}
                {!collapsed[cat] && <div className="divide-y divide-gray-50">
                  {items.map(kian => {
                    const st = STATUS_STYLE[kian.status as keyof typeof STATUS_STYLE] ?? STATUS_STYLE["未着手"];
                    return (
                      <div key={kian.id} className="grid items-center px-5 py-3 hover:bg-gray-50/50 transition" style={{ gridTemplateColumns: "12px 1fr 120px 64px 180px" }}>
                        {/* Status dot */}
                        <span className={`w-2 h-2 rounded-full ${st.dot}`} />

                        {/* Title + note */}
                        <div className="min-w-0 pr-3">
                          <p className={`text-sm font-medium truncate ${kian.status === "決裁済" ? "text-gray-400" : "text-gray-800"}`}>
                            {kian.title}
                          </p>
                          {kian.note && (
                            <p className="text-[11px] text-gray-400 mt-0.5 truncate">{kian.note}</p>
                          )}
                        </div>

                        {/* Due timing */}
                        <div className="text-right pr-2">
                          {kian.due_timing && (
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-lg ${
                              kian.status === "決裁済" ? "bg-gray-50 text-gray-400" : "bg-orange-50 text-orange-600 border border-orange-100"
                            }`}>
                              {kian.due_timing}
                            </span>
                          )}
                        </div>

                        {/* Status badge */}
                        <div className="text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${st.badge}`}>
                            {st.label}
                          </span>
                        </div>

                        {/* Linked task */}
                        <div className="truncate">
                          {kian.task_id && kian.task_title ? (
                            <Link
                              href={`/tasks/${kian.task_id}`}
                              className="text-[10px] text-blue-600 hover:text-blue-700 hover:underline font-medium truncate"
                            >
                              {kian.task_title}
                              <svg className="w-3 h-3 inline ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                            </Link>
                          ) : (
                            <span className="text-[10px] text-gray-300">—</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>}
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
