"use client";

import { useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import type { User } from "@/lib/auth";

interface Task {
  id: number;
  title: string;
  category: string;
  status: string;
  due_date: string;
  assignee_name: string;
}

interface Props {
  session: User;
  tasks: Task[];
}

const STATUS_COLORS: Record<string, string> = {
  "未着手": "bg-gray-400",
  "進行中": "bg-blue-500",
  "確認待ち": "bg-yellow-500",
  "完了": "bg-emerald-500",
};

const CATEGORY_ICONS: Record<string, string> = {
  "入場整理券": "🎫",
  "選挙人名簿": "📋",
  "投票所管理": "🏛️",
  "立候補届出": "📝",
  "投票": "🗳️",
  "開票": "📊",
  "公報": "📰",
  "選挙公報": "📰",
};

function formatMMDD(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function CategoriesClient({ session, tasks }: Props) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const categories: Record<string, Task[]> = {};
  tasks.forEach((task) => {
    if (!categories[task.category]) categories[task.category] = [];
    categories[task.category].push(task);
  });

  const categoryNames = Object.keys(categories).sort();

  // Sidebar progress
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "完了").length;
  const inProgressTasks = tasks.filter((t) => t.status === "進行中").length;
  const progressCompleted = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const progressInProgress = totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0;

  return (
    <AppShell
      user={session}
      progressCompleted={progressCompleted}
      progressInProgress={progressInProgress}
    >
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: "#f0f5ff" }}>
        <div className="px-6 py-5">
          {/* Page header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <Link
                href="/manager"
                className="inline-flex items-center gap-1 text-gray-400 hover:text-gray-600 text-xs mb-2 transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                ガントチャートへ
              </Link>
              <h1 className="text-xl font-bold text-gray-900">業務別進捗</h1>
            </div>
            <button
              onClick={() => setShowCompleted(v => !v)}
              className={`flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                showCompleted
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              完了タスク{showCompleted ? "を隠す" : "を表示"}
            </button>
          </div>

          {/* Overall summary */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-5">
            <h2 className="font-bold text-gray-800 mb-4">全体進捗サマリー</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {["未着手", "進行中", "確認待ち", "完了"].map((status) => {
                const count = tasks.filter((t) => t.status === status).length;
                const pct = totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0;
                return (
                  <div key={status} className="text-center p-3 bg-gray-50 rounded-xl">
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{status}</p>
                    <p className="text-xs text-gray-400">{pct}%</p>
                  </div>
                );
              })}
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>完了率</span>
                <span className="font-semibold text-gray-700">{progressCompleted}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full flex">
                  <div
                    className="h-full bg-emerald-500 rounded-l-full"
                    style={{ width: `${progressCompleted}%` }}
                  />
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: `${progressInProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Category cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            {categoryNames.map((category) => {
              const catTasks = categories[category];
              const done = catTasks.filter((t) => t.status === "完了").length;
              const doing = catTasks.filter((t) => t.status === "進行中").length;
              const waiting = catTasks.filter((t) => t.status === "確認待ち").length;
              const todo = catTasks.filter((t) => t.status === "未着手").length;
              const pct = catTasks.length > 0 ? Math.round((done / catTasks.length) * 100) : 0;
              const icon = CATEGORY_ICONS[category] ?? "📁";

              return (
                <div
                  key={category}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 hover:border-blue-200 transition cursor-pointer"
                  onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl shrink-0">
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-800 text-sm truncate">{category}</h3>
                        {pct === 100 && (
                          <span className="bg-emerald-100 text-emerald-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0">完了</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{catTasks.length}タスク</p>
                    </div>
                    <span className="text-lg font-bold text-gray-700 tabular-nums">{pct}%</span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Status chips */}
                  <div className="flex gap-1.5 flex-wrap">
                    {done > 0 && (
                      <span className="flex items-center gap-1 text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />完了 {done}
                      </span>
                    )}
                    {doing > 0 && (
                      <span className="flex items-center gap-1 text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />進行中 {doing}
                      </span>
                    )}
                    {waiting > 0 && (
                      <span className="flex items-center gap-1 text-[9px] bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />確認待ち {waiting}
                      </span>
                    )}
                    {todo > 0 && (
                      <span className="flex items-center gap-1 text-[9px] bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />未着手 {todo}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Accordion detail list */}
          <div className="space-y-3">
            {categoryNames.map((category) => {
              const catTasks = categories[category];
              const isExpanded = expandedCategory === category;

              return (
                <div key={category} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <button
                    onClick={() => setExpandedCategory(isExpanded ? null : category)}
                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                  >
                    <span className="font-bold text-gray-800 text-sm">{category}</span>
                    <div className="flex items-center gap-2">
                      {catTasks.filter(t => t.status !== "完了").length > 0 && (
                        <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-full">
                          残{catTasks.filter(t => t.status !== "完了").length}件
                        </span>
                      )}
                      <span className="text-gray-400 text-xs">{catTasks.length}件中</span>
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-100 divide-y divide-gray-50">
                      {(showCompleted ? catTasks : catTasks.filter(t => t.status !== "完了")).map((task) => (
                        <Link key={task.id} href={`/tasks/${task.id}`}>
                          <div
                            className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition"
                            style={{ minHeight: 52 }}
                          >
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm font-medium truncate ${
                                  task.status === "完了" ? "text-gray-400 line-through" : "text-gray-800"
                                }`}
                              >
                                {task.title}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-gray-400">{task.assignee_name}</span>
                                {task.due_date && (
                                  <span className="text-xs text-gray-400">期限: {formatMMDD(task.due_date)}</span>
                                )}
                              </div>
                            </div>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ml-3 shrink-0 ${
                                task.status === "完了" ? "bg-emerald-100 text-emerald-700" :
                                task.status === "進行中" ? "bg-blue-100 text-blue-700" :
                                task.status === "確認待ち" ? "bg-yellow-100 text-yellow-700" :
                                "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {task.status}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
