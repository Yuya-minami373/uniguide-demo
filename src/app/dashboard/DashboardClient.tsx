"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import type { User } from "@/lib/auth";

const ANNOUNCEMENT_DATE = "2026-05-04";
const VOTE_DATE = "2026-05-11";

interface Task {
  id: number;
  title: string;
  category: string;
  status: string;
  start_date: string | null;
  due_date: string;
  assignee_name: string;
  playbook_conditions: string;
  playbook_criteria: string;
  playbook_pitfalls: string;
}

function getPlaybookCounts(task: Task) {
  let pitfalls = 0, conditions = 0;
  try { pitfalls = (JSON.parse(task.playbook_pitfalls || "[]") as unknown[]).length; } catch { /* ignore */ }
  try { conditions = (JSON.parse(task.playbook_conditions || "[]") as unknown[]).length; } catch { /* ignore */ }
  return { pitfalls, conditions };
}

interface DashboardClientProps {
  user: User;
  tasks: Task[];
  allTasks?: Task[];
  todayTasks: Task[];
  tomorrowTasks: Task[];
  today: string;
  tomorrow: string;
  demoMode?: boolean;
}

const STATUS_CONFIG = {
  "未着手":   { dot: "bg-gray-400",    badge: "bg-gray-100 text-gray-500 border border-gray-200",        label: "未着手" },
  "進行中":   { dot: "bg-blue-500",    badge: "bg-blue-50 text-blue-700 border border-blue-200",          label: "進行中" },
  "確認待ち": { dot: "bg-yellow-500",  badge: "bg-yellow-50 text-yellow-700 border border-yellow-200",    label: "確認待ち" },
  "完了":     { dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border border-emerald-200", label: "完了" },
} as const;

const GANTT_BADGE: Record<string, { dot: string; bg: string; text: string; border: string }> = {
  "未着手":   { dot: "bg-gray-400",   bg: "bg-gray-50",   text: "text-gray-500",   border: "border-gray-200" },
  "進行中":   { dot: "bg-blue-500",   bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200" },
  "確認待ち": { dot: "bg-yellow-500", bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
};

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function formatMMDD(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function getDayDiff(dateStr: string, baseDate: string): number {
  const base = new Date(baseDate + "T00:00:00");
  const target = new Date(dateStr + "T00:00:00");
  return Math.round((target.getTime() - base.getTime()) / (1000 * 60 * 60 * 24));
}

function getCategoryStats(tasks: Task[]) {
  const cats: Record<string, { tasks: Task[] }> = {};
  tasks.forEach(t => {
    if (!cats[t.category]) cats[t.category] = { tasks: [] };
    cats[t.category].tasks.push(t);
  });
  return cats;
}

export default function DashboardClient({
  user, tasks, allTasks = [], todayTasks, tomorrowTasks, today, demoMode = false,
}: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"morning" | "list" | "gantt" | "roadmap">("morning");
  const [showCompleted, setShowCompleted] = useState(false);
  const ganttScrollRef = useRef<HTMLDivElement>(null);

  const [ganttScrollLeft, setGanttScrollLeft] = useState(0);

  // ガントチャート: 今日の4日前が左端に来るよう自動スクロール
  useEffect(() => {
    if (activeTab === "gantt" && ganttScrollRef.current) {
      const GCELL = 26;
      const GANTT_START_D2 = new Date(today + "T00:00:00");
      GANTT_START_D2.setDate(GANTT_START_D2.getDate() - 21);
      const GANTT_START2 = GANTT_START_D2.toISOString().split("T")[0];
      const daysSinceStart = Math.round(
        (new Date(today + "T00:00:00").getTime() - new Date(GANTT_START2 + "T00:00:00").getTime()) / 86400000
      );
      const todayX = daysSinceStart * GCELL;
      ganttScrollRef.current.scrollLeft = Math.max(0, todayX - 4 * GCELL);
    }
  }, [activeTab, today]);

  // スクロール量を追跡
  useEffect(() => {
    const el = ganttScrollRef.current;
    if (!el) return;
    const handler = () => setGanttScrollLeft(el.scrollLeft);
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, [activeTab]);

  const categories = getCategoryStats(tasks);
  const categoryNames = Object.keys(categories);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    categoryNames.length > 0 ? categoryNames[0] : null
  );

  const alertTaskIds = new Set([...todayTasks.map(t => t.id), ...tomorrowTasks.map(t => t.id)]);
  const allShownTasks = selectedCategory ? categories[selectedCategory]?.tasks ?? [] : tasks;
  const shownTasks = showCompleted ? allShownTasks : allShownTasks.filter(t => t.status !== "完了");
  const completedCount = allShownTasks.filter(t => t.status === "完了").length;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "完了").length;
  const inProgressTasks = tasks.filter(t => t.status === "進行中").length;
  const progressCompleted = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const progressInProgress = totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0;

  // Gantt config
  const DAYS = 21;
  const dayOffset = -2;
  const CELL = 52;
  const LEFT_W = 320;

  const days: string[] = [];
  for (let i = dayOffset; i < dayOffset + DAYS; i++) {
    const d = new Date(today + "T00:00:00");
    d.setDate(d.getDate() + i);
    days.push(d.toISOString().split("T")[0]);
  }
  const todayIdx = days.indexOf(today);
  const announcementIdx = days.indexOf(ANNOUNCEMENT_DATE);
  const voteIdx = days.indexOf(VOTE_DATE);

  const monthGroups: { label: string; count: number }[] = [];
  days.forEach(day => {
    const d = new Date(day + "T00:00:00");
    const label = `${d.getFullYear()}年${d.getMonth() + 1}月`;
    const last = monthGroups[monthGroups.length - 1];
    if (last && last.label === label) { last.count++; }
    else { monthGroups.push({ label, count: 1 }); }
  });

  const activeTasks = tasks.filter(t => t.status !== "完了");

  return (
    <AppShell user={user} progressCompleted={progressCompleted} progressInProgress={progressInProgress} demoMode={demoMode}>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ━━━ Page Header ━━━ */}
        <div className="bg-white border-b border-gray-200 px-6 py-2 shrink-0">
          <div className="flex items-center justify-between mb-1">
            <div>
              <p className="text-[10px] text-gray-400 font-medium tracking-wide">Myプロジェクト</p>
              <h1 className="text-base font-bold text-gray-900 leading-tight">{user.name} — {user.category || "担当業務"}</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-lg px-3 py-1">
                <p className="text-[10px] text-orange-500 font-bold">告示日まで</p>
                <p className="text-xl font-bold text-orange-500 tabular-nums leading-none">{Math.round((new Date(ANNOUNCEMENT_DATE + "T00:00:00").getTime() - new Date(today + "T00:00:00").getTime()) / 86400000)}</p>
                <p className="text-[10px] text-orange-400">日</p>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1">
                <p className="text-[10px] text-gray-500 font-bold">投票日まで</p>
                <p className="text-xl font-bold text-gray-700 tabular-nums leading-none">{Math.round((new Date(VOTE_DATE + "T00:00:00").getTime() - new Date(today + "T00:00:00").getTime()) / 86400000)}</p>
                <p className="text-[10px] text-gray-400">日</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-1">
            {[
              { key: "morning",  label: "Today's UniGuide" },
              { key: "list",     label: "タスク一覧" },
              { key: "gantt",    label: "ガントチャート" },
              { key: "roadmap",  label: "ロードマップ" },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as "morning" | "list" | "gantt" | "roadmap")}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
                  activeTab === tab.key
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ━━━ 朝の確認タブ ━━━ */}
        {activeTab === "morning" && (() => {
          // アクションリスト生成: 今日期限 > 明日期限 > 進行中 > 未着手期限近い順
          const actionItems: { task: Task; reason: "today" | "tomorrow" | "in_progress" | "upcoming" }[] = [];
          const usedIds = new Set<number>();
          todayTasks.forEach(t => { actionItems.push({ task: t, reason: "today" }); usedIds.add(t.id); });
          tomorrowTasks.forEach(t => { actionItems.push({ task: t, reason: "tomorrow" }); usedIds.add(t.id); });
          activeTasks.filter(t => t.status === "進行中" && !usedIds.has(t.id)).forEach(t => {
            actionItems.push({ task: t, reason: "in_progress" }); usedIds.add(t.id);
          });
          activeTasks
            .filter(t => t.status === "未着手" && t.due_date && t.due_date > today && !usedIds.has(t.id))
            .sort((a, b) => a.due_date.localeCompare(b.due_date))
            .slice(0, Math.max(0, 5 - actionItems.length))
            .forEach(t => { actionItems.push({ task: t, reason: "upcoming" }); });

          const REASON_CONFIG = {
            today:       { label: "今日期限", color: "bg-red-500",    text: "text-red-600",    border: "border-red-200",   bg: "bg-red-50/60" },
            tomorrow:    { label: "明日期限", color: "bg-amber-400",  text: "text-amber-600",  border: "border-amber-200", bg: "bg-amber-50/60" },
            in_progress: { label: "進行中",   color: "bg-blue-500",   text: "text-blue-600",   border: "border-blue-200",  bg: "bg-blue-50/40" },
            upcoming:    { label: "次の予定", color: "bg-gray-400",   text: "text-gray-500",   border: "border-gray-200",  bg: "" },
          };

          const inProgressCount = activeTasks.filter(t => t.status === "進行中").length;
          const pendingCount = activeTasks.filter(t => t.status === "確認待ち").length;
          const announceDiff = Math.round((new Date(ANNOUNCEMENT_DATE + "T00:00:00").getTime() - new Date(today + "T00:00:00").getTime()) / 86400000);

          return (
          <div className="flex-1 overflow-y-auto" style={{ backgroundColor: "#f8fafc" }}>

            {/* ── KPIバー ── */}
            <div className="px-5 pt-4">
              <div className="grid grid-cols-5 gap-3">
                <div className={`bg-white rounded-xl border px-4 py-3 ${todayTasks.length > 0 ? "border-red-200" : "border-gray-200"}`}>
                  <p className="text-[10px] font-semibold text-gray-400 mb-1">今日期限</p>
                  <p className={`text-2xl font-bold tabular-nums ${todayTasks.length > 0 ? "text-red-600" : "text-gray-300"}`}>{todayTasks.length}<span className="text-xs font-normal text-gray-400 ml-0.5">件</span></p>
                </div>
                <div className={`bg-white rounded-xl border px-4 py-3 ${tomorrowTasks.length > 0 ? "border-amber-200" : "border-gray-200"}`}>
                  <p className="text-[10px] font-semibold text-gray-400 mb-1">明日期限</p>
                  <p className={`text-2xl font-bold tabular-nums ${tomorrowTasks.length > 0 ? "text-amber-600" : "text-gray-300"}`}>{tomorrowTasks.length}<span className="text-xs font-normal text-gray-400 ml-0.5">件</span></p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
                  <p className="text-[10px] font-semibold text-gray-400 mb-1">進行中</p>
                  <p className="text-2xl font-bold tabular-nums text-blue-600">{inProgressCount}<span className="text-xs font-normal text-gray-400 ml-0.5">件</span></p>
                </div>
                <div className={`bg-white rounded-xl border px-4 py-3 ${pendingCount > 0 ? "border-yellow-200" : "border-gray-200"}`}>
                  <p className="text-[10px] font-semibold text-gray-400 mb-1">確認待ち</p>
                  <p className={`text-2xl font-bold tabular-nums ${pendingCount > 0 ? "text-yellow-600" : "text-gray-300"}`}>{pendingCount}<span className="text-xs font-normal text-gray-400 ml-0.5">件</span></p>
                </div>
                <div className="bg-white rounded-xl border border-orange-200 px-4 py-3">
                  <p className="text-[10px] font-semibold text-gray-400 mb-1">告示まで</p>
                  <p className="text-2xl font-bold tabular-nums text-orange-500">{announceDiff}<span className="text-xs font-normal text-gray-400 ml-0.5">日</span></p>
                </div>
              </div>
            </div>

            {/* ── アクションリスト + スケジュール ── */}
            <div className="px-5 pb-5 pt-3">
              <div className="grid gap-4" style={{ gridTemplateColumns: "280px 1fr" }}>

                {/* 左: 今日のアクションリスト */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                    <h2 className="font-bold text-gray-800 text-sm">今日やること</h2>
                    <span className="ml-auto text-[10px] bg-gray-100 text-gray-500 font-bold px-2 py-0.5 rounded-full">{actionItems.length}件</span>
                  </div>
                  {actionItems.length === 0 ? (
                    <div className="px-5 py-10 text-center">
                      <p className="text-2xl mb-2">✅</p>
                      <p className="text-sm text-gray-500 font-medium">今日の対応タスクはありません</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {actionItems.map(({ task, reason }, i) => {
                        const rc = REASON_CONFIG[reason];
                        let hint: string | null = null;
                        try {
                          const crit = JSON.parse(task.playbook_criteria || "[]");
                          if (Array.isArray(crit) && crit.length > 0) hint = crit[0].a;
                        } catch { /* ignore */ }
                        return (
                          <Link key={task.id} href={`/tasks/${task.id}`}>
                            <div className={`flex items-start gap-2 px-2 py-3.5 hover:bg-gray-50/80 transition group ${rc.bg}`}>
                              {/* 番号 */}
                              <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white shrink-0 ${rc.color}`}>{rc.label}</span>
                                </div>
                                <p className="text-sm font-semibold text-gray-800 whitespace-nowrap">{task.title}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{task.category}</p>
                                {hint && (
                                  <p className="text-[10px] text-indigo-500 mt-1.5 flex items-start gap-1">
                                    <span className="shrink-0">💡</span>
                                    <span className="line-clamp-1">{hint}</span>
                                  </p>
                                )}
                              </div>
                              {task.due_date && (
                                <span className={`text-[10px] tabular-nums font-semibold shrink-0 mt-1 ${rc.text}`}>
                                  {formatDate(task.due_date)}
                                </span>
                              )}
                              <svg className="w-4 h-4 text-gray-200 shrink-0 group-hover:text-blue-300 transition-colors mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 右: プロジェクト別スケジュール（タスク名行ガント） */}
                {categoryNames.length > 0 && (() => {
                  const MINI_DAYS = 14;
                  const LABEL_W = 280;
                  const miniDays: string[] = [];
                  for (let i = 0; i < MINI_DAYS; i++) {
                    const d = new Date(today + "T00:00:00");
                    d.setDate(d.getDate() + i);
                    miniDays.push(d.toISOString().split("T")[0]);
                  }
                  const statusDot: Record<string, string> = {
                    "進行中":   "bg-blue-500",
                    "確認待ち": "bg-yellow-500",
                    "未着手":   "bg-gray-400",
                  };
                  return (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                      {/* Header */}
                      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        <h2 className="font-bold text-gray-800 text-sm">プロジェクト別スケジュール</h2>
                        <span className="ml-auto text-[10px] text-gray-400">今後14日</span>
                      </div>
                      {/* Day header row */}
                      <div className="flex border-b border-gray-100 bg-gray-50/60" style={{ minHeight: 24 }}>
                        <div className="shrink-0 border-r border-gray-200 bg-gray-50/60" style={{ width: LABEL_W }} />
                        <div className="flex flex-1">
                          {miniDays.map((day, i) => {
                            const d = new Date(day + "T00:00:00");
                            const isSun = d.getDay() === 0;
                            const isSat = d.getDay() === 6;
                            return (
                              <div key={day} className={`flex-1 flex items-center justify-center border-r border-gray-100 ${
                                isSun ? "bg-red-50/40" : isSat ? "bg-blue-50/30" : ""
                              }`}>
                                <span className={`text-[9px] tabular-nums font-semibold ${
                                  i === 0 ? "text-red-500" : isSun ? "text-red-300" : isSat ? "text-blue-300" : "text-gray-300"
                                }`}>{d.getDate()}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      {/* Categories + task rows */}
                      {categoryNames.map(cat => {
                        const catTasks = categories[cat].tasks;
                        const done = catTasks.filter(t => t.status === "完了").length;
                        const pct = catTasks.length > 0 ? Math.round((done / catTasks.length) * 100) : 0;
                        const windowTasks = catTasks.filter(
                          t => t.status !== "完了" && t.due_date && miniDays.includes(t.due_date)
                        );
                        const outsideCount = catTasks.filter(
                          t => t.status !== "完了" && t.due_date && !miniDays.includes(t.due_date)
                        ).length;
                        return (
                          <div key={cat}>
                            {/* Category header */}
                            <div className="flex items-center border-b border-indigo-100/60 bg-indigo-50/50">
                              <div className="shrink-0 px-3 py-2 border-r border-indigo-100/60 flex items-center justify-between gap-2" style={{ width: LABEL_W }}>
                                <span className="text-xs font-bold text-indigo-700 truncate">{cat}</span>
                                <span className="text-[10px] text-indigo-400 tabular-nums shrink-0">{pct}%</span>
                              </div>
                              {/* Progress bar spanning timeline */}
                              <div className="flex-1 px-2 flex items-center" style={{ height: 30 }}>
                                <div className="flex-1 h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            </div>
                            {/* Task rows */}
                            {windowTasks.map(task => {
                              const dayIdx = miniDays.indexOf(task.due_date);
                              const dot = statusDot[task.status] ?? "bg-gray-400";
                              const isUrgent = dayIdx <= 1;
                              return (
                                <Link key={task.id} href={`/tasks/${task.id}`}>
                                  <div className="flex items-center border-b border-gray-50 hover:bg-blue-50/20 transition group" style={{ minHeight: 38 }}>
                                    <div className="shrink-0 px-3 py-2 border-r border-gray-100 flex items-center gap-1.5" style={{ width: LABEL_W }}>
                                      <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                                      <p className={`text-xs flex-1 min-w-0 whitespace-nowrap ${isUrgent ? "text-red-600 font-semibold" : "text-gray-700"}`}>{task.title}</p>
                                    </div>
                                    <div className="flex flex-1 relative" style={{ height: 36 }}>
                                      {/* Background cells */}
                                      {miniDays.map((day, i) => {
                                        const d = new Date(day + "T00:00:00");
                                        const isSun = d.getDay() === 0;
                                        const isSat = d.getDay() === 6;
                                        return (
                                          <div key={day} className={`flex-1 border-r border-gray-50 ${
                                            i === 0 ? "bg-red-50/30" : isSun ? "bg-red-50/20" : isSat ? "bg-blue-50/20" : ""
                                          }`} />
                                        );
                                      })}
                                      {/* Today line */}
                                      <div className="absolute top-0 bottom-0 w-px bg-red-300/50" style={{ left: `${(0.5 / MINI_DAYS) * 100}%` }} />
                                      {/* Deadline marker */}
                                      {dayIdx >= 0 && (
                                        <>
                                          <div
                                            className={`absolute top-0 bottom-0 w-0.5 z-10 ${isUrgent ? "bg-red-400" : "bg-indigo-300"}`}
                                            style={{ left: `${((dayIdx + 0.5) / MINI_DAYS) * 100}%` }}
                                          />
                                          <div
                                            className="absolute top-1/2 -translate-y-1/2 z-20"
                                            style={{ left: `calc(${((dayIdx + 0.5) / MINI_DAYS) * 100}% + 3px)` }}
                                          >
                                            <span className={`text-[9px] font-bold tabular-nums ${isUrgent ? "text-red-500" : "text-indigo-400"}`}>
                                              {formatMMDD(task.due_date)}
                                            </span>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </Link>
                              );
                            })}
                            {/* Outside window notice */}
                            {outsideCount > 0 && (
                              <div className="flex border-b border-gray-50">
                                <div className="shrink-0 px-3 py-1 border-r border-gray-100" style={{ width: LABEL_W }} />
                                <div className="flex-1 px-3 py-1">
                                  <span className="text-[10px] text-gray-400">他 {outsideCount}件（期間外）</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>


            </div>
          </div>
          );
        })()}

        {/* ━━━ タスク一覧タブ ━━━ */}
        {activeTab === "list" && (
          <div className="flex-1 flex min-w-0 overflow-hidden">

            {/* Left: Category sidebar */}
            <div className="w-[260px] shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
              <div className="px-4 py-4 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-800">Myプロジェクト</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {categoryNames.length}カテゴリ · {totalTasks}タスク
                </p>
              </div>

              {/* Alert bar */}
              {(todayTasks.length > 0 || tomorrowTasks.length > 0) && (
                <div className="px-3 py-2.5 border-b border-red-100 bg-red-50/70">
                  {todayTasks.length > 0 && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">今日</span>
                      <span className="text-[11px] text-red-700 font-semibold">{todayTasks.length}件が本日期限</span>
                    </div>
                  )}
                  {tomorrowTasks.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-400 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">明日</span>
                      <span className="text-[11px] text-amber-700 font-semibold">{tomorrowTasks.length}件が明日期限</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
                {categoryNames.map(cat => {
                  const { tasks: catTasks } = categories[cat];
                  const done = catTasks.filter(t => t.status === "完了").length;
                  const doing = catTasks.filter(t => t.status === "進行中").length;
                  const waiting = catTasks.filter(t => t.status === "確認待ち").length;
                  const todo = catTasks.filter(t => t.status === "未着手").length;
                  const pct = catTasks.length > 0 ? Math.round((done / catTasks.length) * 100) : 0;
                  const isActive = selectedCategory === cat;
                  const hasAlert = catTasks.some(t => alertTaskIds.has(t.id));

                  return (
                    <button
                      key={cat}
                      onClick={() => { setSelectedCategory(cat); setShowCompleted(false); }}
                      className={`w-full text-left rounded-xl p-3 transition-all duration-150 ${
                        isActive
                          ? "bg-blue-600 shadow-md shadow-blue-500/20"
                          : "bg-white hover:bg-gray-50 border border-gray-100 hover:border-gray-200 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-bold truncate flex-1 ${isActive ? "text-white" : "text-gray-700"}`}>{cat}</span>
                        {hasAlert && <span className={`w-2 h-2 rounded-full shrink-0 ${isActive ? "bg-red-300" : "bg-red-500"}`} />}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isActive ? "bg-blue-500/40" : "bg-gray-100"}`}>
                          <div className={`h-full rounded-full ${isActive ? "bg-white" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className={`text-[9px] tabular-nums font-semibold ${isActive ? "text-blue-100" : "text-gray-500"}`}>{pct}%</span>
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {done > 0 && <span className={`flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded font-semibold ${isActive ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-700"}`}><span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-white" : "bg-emerald-500"}`} />{done}完了</span>}
                        {doing > 0 && <span className={`flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded font-semibold ${isActive ? "bg-white/20 text-white" : "bg-blue-50 text-blue-700"}`}><span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-white" : "bg-blue-500"}`} />{doing}進行中</span>}
                        {waiting > 0 && <span className={`flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded font-semibold ${isActive ? "bg-white/20 text-white" : "bg-yellow-50 text-yellow-700"}`}><span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-white" : "bg-yellow-500"}`} />{waiting}確認待</span>}
                        {todo > 0 && <span className={`flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded font-semibold ${isActive ? "bg-white/20 text-white" : "bg-gray-50 text-gray-500"}`}><span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-white/60" : "bg-gray-300"}`} />{todo}未着手</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Task list */}
            <div className="flex-1 min-w-0 flex flex-col overflow-hidden" style={{ backgroundColor: "#f8fafc" }}>
              <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-sm font-bold text-gray-800">{selectedCategory ?? "すべてのタスク"}</h2>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {shownTasks.length}タスク表示中
                  </p>
                </div>
                {completedCount > 0 && (
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
                    完了 {completedCount}件{showCompleted ? "を隠す" : "を表示"}
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {/* 今日やること */}
                {todayTasks.length > 0 && (
                  <div className="max-w-[680px] mb-7">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-2 h-2 rounded-full bg-red-500 " />
                      <h3 className="text-xs font-bold text-gray-700 tracking-wide">今日やること</h3>
                      <span className="text-[10px] text-red-600 font-bold bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">{todayTasks.length}件</span>
                    </div>
                    <div className="space-y-2">
                      {todayTasks.map(task => {
                        const st = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG["未着手"];
                        return (
                          <Link key={task.id} href={`/tasks/${task.id}`}>
                            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border-2 border-red-200 hover:border-red-300 hover:shadow-md hover:shadow-red-500/10 transition-all" style={{ minHeight: 52 }}>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${st.badge}`}>{st.label}</span>
                              <span className="text-[13px] flex-1 min-w-0 truncate text-gray-900 font-semibold">{task.title}</span>
                              <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full shrink-0">今日期限</span>
                              <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                    <div className="mt-5 flex items-center gap-3">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-[10px] text-gray-400 font-medium">すべてのタスク</span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>
                  </div>
                )}

                <div className="max-w-[680px] space-y-2">
                  {shownTasks.map(task => {
                    const st = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG["未着手"];
                    const isAlert = alertTaskIds.has(task.id);
                    const isOverdue = task.due_date && task.due_date < today && task.status !== "完了";
                    const diff = task.due_date
                      ? Math.round((new Date(task.due_date + "T00:00:00").getTime() - new Date(today + "T00:00:00").getTime()) / 86400000)
                      : null;
                    let hint: string | null = null;
                    if (task.playbook_criteria) {
                      try {
                        const crit = JSON.parse(task.playbook_criteria);
                        if (Array.isArray(crit) && crit.length > 0) hint = crit[0].a;
                      } catch { /* ignore */ }
                    }
                    const { pitfalls, conditions } = getPlaybookCounts(task);
                    const accentColor =
                      task.status === "完了"    ? "#10b981" :
                      task.status === "進行中"  ? "#3b82f6" :
                      task.status === "確認待ち"? "#f59e0b" :
                      isOverdue               ? "#ef4444" : "#d1d5db";

                    return (
                      <Link key={task.id} href={`/tasks/${task.id}`}>
                        <div
                          className={`flex items-start gap-3 pl-0 pr-4 py-0 rounded-xl transition-all bg-white border group overflow-hidden ${
                            isAlert
                              ? "border-red-200 hover:border-red-300 hover:shadow-md hover:shadow-red-500/10"
                              : task.status === "完了"
                              ? "border-gray-100 hover:border-gray-200"
                              : "border-gray-100 hover:border-blue-200 hover:shadow-md hover:shadow-blue-500/10"
                          }`}
                        >
                          {/* Left accent bar */}
                          <div className="w-1 self-stretch shrink-0 rounded-l-xl" style={{ backgroundColor: accentColor }} />

                          {/* Content */}
                          <div className="flex-1 min-w-0 py-3">
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${st.badge}`}>{st.label}</span>
                              <span className={`text-[13px] flex-1 min-w-0 truncate font-medium ${
                                task.status === "完了" ? "line-through text-gray-400"
                                : isOverdue ? "text-red-600 font-semibold"
                                : "text-gray-800"
                              }`}>{task.title}</span>
                              {task.status !== "完了" && (pitfalls > 0 || conditions > 0) && (
                                <div className="flex items-center gap-1 shrink-0">
                                  {pitfalls > 0 && <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-red-50 text-red-500 border border-red-100">⚠️{pitfalls}</span>}
                                  {conditions > 0 && <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100">✅{conditions}</span>}
                                </div>
                              )}
                            </div>
                            {hint && task.status !== "完了" && (
                              <p className="text-[11px] text-indigo-500 mt-1.5 flex items-start gap-1">
                                <span className="shrink-0">💡</span>
                                <span className="line-clamp-1">{hint}</span>
                              </p>
                            )}
                          </div>

                          {/* Right: date + countdown */}
                          <div className="shrink-0 flex flex-col items-end justify-center gap-0.5 py-3 min-w-[72px]">
                            {isAlert && (
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full text-white ${
                                todayTasks.some(t => t.id === task.id) ? "bg-red-500" : "bg-amber-400"
                              }`}>
                                {todayTasks.some(t => t.id === task.id) ? "今日" : "明日"}
                              </span>
                            )}
                            {task.due_date && task.status !== "完了" && (
                              <span className={`text-[11px] tabular-nums font-medium ${isOverdue ? "text-red-400" : "text-gray-400"}`}>
                                {formatDate(task.due_date)}
                              </span>
                            )}
                            {diff !== null && task.status !== "完了" && !isAlert && (
                              <span className={`text-[10px] tabular-nums font-bold ${
                                isOverdue ? "text-red-400" : diff <= 7 ? "text-orange-400" : "text-gray-300"
                              }`}>
                                {isOverdue ? `${Math.abs(diff)}日超過` : `あと${diff}日`}
                              </span>
                            )}
                          </div>

                          <svg className="w-4 h-4 text-gray-200 shrink-0 group-hover:text-blue-300 transition-colors self-center" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </Link>
                    );
                  })}

                  {shownTasks.length === 0 && (
                    <div className="text-center py-20">
                      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-500 font-medium">担当タスクはありません</p>
                      <p className="text-xs text-gray-400 mt-1">このカテゴリのタスクは完了しています</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ━━━ ガントチャートタブ ━━━ */}
        {activeTab === "gantt" && (() => {
          const GCELL = 26;
          const GLEFT = 280;
          const GANTT_START_D = new Date(today + "T00:00:00");
          GANTT_START_D.setDate(GANTT_START_D.getDate() - 21);
          const GANTT_START = GANTT_START_D.toISOString().split("T")[0];
          const GANTT_END_D = new Date(VOTE_DATE + "T00:00:00");
          GANTT_END_D.setDate(GANTT_END_D.getDate() + 7);
          const GANTT_END = GANTT_END_D.toISOString().split("T")[0];

          const ganttDays: string[] = [];
          for (
            const d = new Date(GANTT_START + "T00:00:00");
            d.toISOString().split("T")[0] <= GANTT_END;
            d.setDate(d.getDate() + 1)
          ) {
            ganttDays.push(d.toISOString().split("T")[0]);
          }
          const GDAYS = ganttDays.length;

          const gMonthGroups: { label: string; count: number }[] = [];
          ganttDays.forEach(day => {
            const d = new Date(day + "T00:00:00");
            const label = `${d.getFullYear()}年${d.getMonth() + 1}月`;
            const last = gMonthGroups[gMonthGroups.length - 1];
            if (last && last.label === label) last.count++;
            else gMonthGroups.push({ label, count: 1 });
          });

          const gTodayIdx = ganttDays.indexOf(today);
          const gAnnIdx   = ganttDays.indexOf(ANNOUNCEMENT_DATE);
          const gVoteIdx  = ganttDays.indexOf(VOTE_DATE);

          const barCls = (status: string, isOverdue: boolean) => {
            if (isOverdue)             return "bg-red-50 border-2 border-red-400";
            if (status === "完了")     return "border border-emerald-400";
            if (status === "進行中")   return "bg-blue-50 border border-blue-400";
            if (status === "確認待ち") return "bg-amber-50 border border-amber-400";
            return "bg-slate-100 border border-slate-300";
          };

          const barInlineStyle = (status: string): React.CSSProperties => {
            if (status === "完了") return { background: "repeating-linear-gradient(45deg,rgba(16,185,129,.18),rgba(16,185,129,.18) 3px,rgba(209,250,229,.6) 3px,rgba(209,250,229,.6) 9px)" };
            return {};
          };

          const barLabelCls = (status: string, isOverdue: boolean) =>
            isOverdue             ? "text-red-700 font-bold"
            : status === "完了"   ? "text-emerald-700"
            : status === "進行中" ? "text-blue-700 font-semibold"
            : status === "確認待ち" ? "text-amber-700 font-semibold"
            : "text-slate-500";

          const dotColor = (status: string, isOverdue: boolean) =>
            status === "完了"       ? "bg-emerald-500"
            : status === "進行中"   ? "bg-blue-500"
            : status === "確認待ち" ? "bg-amber-500"
            : isOverdue             ? "bg-red-400"
            : "bg-gray-300";

          const milestones = (
            <>
              {gTodayIdx >= 0 && <div className="absolute top-0 bottom-0 w-px bg-red-500 z-10 opacity-70" style={{ left: gTodayIdx * GCELL + GCELL / 2 }} />}
              {gAnnIdx   >= 0 && <div className="absolute top-0 bottom-0 z-10 opacity-50" style={{ left: gAnnIdx * GCELL + GCELL / 2, borderLeft: "1px dashed #f97316" }} />}
              {gVoteIdx  >= 0 && <div className="absolute top-0 bottom-0 z-10 opacity-50" style={{ left: gVoteIdx * GCELL + GCELL / 2, borderLeft: "1px dashed #ef4444" }} />}
            </>
          );

          const visibleTasks = showCompleted ? tasks : activeTasks;

          return (
          <div className="flex-1 overflow-hidden flex flex-col bg-white border-t border-gray-200">
            {/* 凡例 + 完了トグル */}
            <div className="flex items-center gap-4 px-4 py-2 border-b border-gray-100 bg-slate-50/60 flex-wrap shrink-0">
              <span className="text-[10px] font-semibold text-gray-400 tracking-wide shrink-0">凡例</span>
              <div className="flex items-center gap-1.5">
                <span className="w-8 h-3.5 rounded-full shrink-0 bg-blue-50 border border-blue-400" />
                <span className="text-[11px] text-blue-700 font-semibold">進行中</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-8 h-3.5 rounded-full shrink-0 bg-amber-50 border border-amber-400" />
                <span className="text-[11px] text-amber-700 font-semibold">確認待ち</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-8 h-3.5 rounded-full shrink-0 bg-slate-100 border border-slate-300" />
                <span className="text-[11px] text-slate-500 font-semibold">未着手</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-8 h-3.5 rounded-full shrink-0 bg-red-50 border-2 border-red-400" />
                <span className="text-[11px] text-red-700 font-semibold">着手遅れ</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-8 h-3.5 rounded-full shrink-0 border border-emerald-400" style={{ background: "repeating-linear-gradient(45deg,rgba(16,185,129,.18),rgba(16,185,129,.18) 3px,rgba(209,250,229,.6) 3px,rgba(209,250,229,.6) 9px)" }} />
                <span className="text-[11px] text-emerald-700 font-semibold">完了</span>
              </div>
              <div className="ml-auto flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] text-gray-500">完了タスクを表示</span>
                <button
                  onClick={() => setShowCompleted(v => !v)}
                  className={`relative w-8 h-4 rounded-full transition-colors ${showCompleted ? "bg-blue-500" : "bg-gray-200"}`}
                >
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${showCompleted ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
              </div>
            </div>

            <div ref={ganttScrollRef} className="flex-1 overflow-x-auto overflow-y-auto">
              <div style={{ minWidth: `${GLEFT + GDAYS * GCELL}px` }}>

                {/* 月ヘッダー */}
                <div className="flex border-b border-gray-100 bg-white sticky top-0 z-40">
                  <div className="shrink-0 border-r-2 border-gray-200 px-3 flex items-end pb-1 bg-white sticky left-0 z-50" style={{ width: GLEFT }}>
                    <span className="text-[10px] font-semibold text-gray-400 tracking-wide">タスク</span>
                  </div>
                  <div className="flex">
                    {gMonthGroups.map(mg => (
                      <div key={mg.label} style={{ width: mg.count * GCELL }} className="shrink-0 border-r border-gray-100 px-2 pt-1.5 pb-0.5">
                        <span className="text-[11px] font-bold text-gray-500">{mg.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 日付ヘッダー */}
                <div className="flex border-b-2 border-gray-200 bg-white sticky top-[24px] z-40">
                  <div className="shrink-0 border-r-2 border-gray-200 bg-white sticky left-0 z-50" style={{ width: GLEFT }} />
                  <div className="flex">
                    {ganttDays.map(day => {
                      const isToday = day === today;
                      const isAnn   = day === ANNOUNCEMENT_DATE;
                      const isVote  = day === VOTE_DATE;
                      const d = new Date(day + "T00:00:00");
                      const isSun = d.getDay() === 0;
                      const isSat = d.getDay() === 6;
                      return (
                        <div key={day} style={{ width: GCELL }}
                          className={`shrink-0 flex items-center justify-center py-0.5 border-r border-gray-100 ${isAnn ? "bg-orange-50" : isVote ? "bg-red-50" : isSun || isSat ? "bg-gray-50" : ""}`}>
                          {isToday ? (
                            <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{d.getDate()}</span>
                          ) : isAnn ? (
                            <div className="flex flex-col items-center leading-none">
                              <span className="text-[6px] font-bold text-orange-600">告</span>
                              <span className="text-[10px] font-bold text-orange-500">{d.getDate()}</span>
                            </div>
                          ) : isVote ? (
                            <div className="flex flex-col items-center leading-none">
                              <span className="text-[6px] font-bold text-red-600">投</span>
                              <span className="text-[10px] font-bold text-red-500">{d.getDate()}</span>
                            </div>
                          ) : (
                            <span className={`text-[10px] ${isSun ? "text-red-400" : isSat ? "text-blue-400" : "text-gray-400"}`}>{d.getDate()}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* カテゴリ別タスク行 */}
                {categoryNames.map(cat => {
                  const catTasks = visibleTasks.filter(t => t.category === cat);
                  if (catTasks.length === 0) return null;
                  const catAll = categories[cat].tasks;
                  const done = catAll.filter(t => t.status === "完了").length;
                  const pct = catAll.length > 0 ? Math.round((done / catAll.length) * 100) : 0;

                  const sorted = [...catTasks].sort((a, b) => {
                    const ord: Record<string, number> = { "進行中": 0, "確認待ち": 1, "未着手": 2, "完了": 3 };
                    const d2 = (ord[a.status] ?? 9) - (ord[b.status] ?? 9);
                    return d2 !== 0 ? d2 : a.due_date < b.due_date ? -1 : 1;
                  });

                  return (
                    <div key={cat}>
                      {/* カテゴリヘッダー */}
                      <div className="flex border-b border-blue-100 bg-gradient-to-r from-slate-50 to-blue-50/30">
                        <div className="shrink-0 border-r-2 border-gray-200 px-3 py-1.5 flex items-center gap-2 sticky left-0 z-30 bg-slate-50" style={{ width: GLEFT }}>
                          <span className="text-xs font-bold text-indigo-700 flex-1">{cat}</span>
                          <span className="text-[10px] text-indigo-500 font-semibold tabular-nums shrink-0">{pct}%</span>
                        </div>
                        <div className="flex-1 relative" style={{ minHeight: 28 }}>
                          {milestones}
                        </div>
                      </div>

                      {/* タスク行 */}
                      {sorted.map(task => {
                        const s = task.start_date || task.due_date;
                        const isOverdue = task.status !== "完了" && task.due_date < today;
                        const isComplete = task.status === "完了";

                        const realSIdx = ganttDays.indexOf(s);
                        const clampedStart = s < GANTT_START;
                        const startDay = clampedStart ? 0 : Math.max(0, realSIdx);
                        const clampedEnd = task.due_date > GANTT_END;
                        const eIdx = clampedEnd ? GDAYS - 1 : ganttDays.indexOf(task.due_date);
                        const hasBar = eIdx >= 0;
                        const barLeft = hasBar ? startDay * GCELL + 2 : 0;
                        const barW    = hasBar ? Math.max(GCELL * 3, (eIdx + 1) * GCELL - startDay * GCELL - 4) : 0;

                        const statusLabel = isOverdue && !isComplete ? "着手遅れ"
                          : task.status === "進行中"   ? "進行中"
                          : task.status === "確認待ち" ? "確認待ち"
                          : task.status === "完了"     ? "完了"
                          : "未着手";

                        return (
                          <Link key={task.id} href={`/tasks/${task.id}`}>
                            <div className={`flex border-b border-gray-50 hover:bg-blue-50/25 transition group cursor-pointer ${isComplete ? "opacity-55" : ""}`}>
                              <div className="shrink-0 border-r-2 border-gray-200 px-3 py-1.5 flex items-center gap-2 sticky left-0 z-30 bg-white group-hover:bg-blue-50 pl-5" style={{ width: GLEFT }}>
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor(task.status, isOverdue)}`} />
                                <span className={`text-[11px] leading-tight flex-1 truncate ${isOverdue ? "text-red-600 font-semibold" : isComplete ? "text-gray-400 line-through" : "text-gray-800"}`}>
                                  {task.title}
                                </span>
                              </div>
                              <div className="flex-1 relative" style={{ minHeight: 32 }}>
                                {milestones}
                                {hasBar && (() => {
                                  const labelOffset = Math.max(0, ganttScrollLeft - barLeft);
                                  return (
                                    <div
                                      className={`absolute top-1/2 -translate-y-1/2 h-[22px] z-[5] overflow-hidden ${barCls(task.status, isOverdue)} ${clampedStart ? "rounded-r-full" : "rounded-full"}`}
                                      style={{ left: barLeft, width: barW, ...barInlineStyle(task.status) }}
                                    >
                                      <div
                                        className={`px-2 h-full flex items-center gap-1.5 whitespace-nowrap ${barLabelCls(task.status, isOverdue)}`}
                                        style={{ marginLeft: labelOffset }}
                                      >
                                        {labelOffset > 0 && <span className="text-[10px] shrink-0">←</span>}
                                        <span className="text-[10px] font-bold shrink-0">{statusLabel}</span>
                                        <span className="text-[10px] tabular-nums shrink-0">{formatMMDD(s)} → {formatMMDD(task.due_date)}</span>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          );
        })()}

        {/* ━━━ ロードマップタブ ━━━ */}
        {activeTab === "roadmap" && (() => {
          const announceDate = new Date(ANNOUNCEMENT_DATE + "T00:00:00");
          const voteDate     = new Date(VOTE_DATE + "T00:00:00");
          const todayDate    = new Date(today + "T00:00:00");

          const daysToAnnounce = Math.round((announceDate.getTime() - todayDate.getTime()) / 86400000);
          const daysToVote     = Math.round((voteDate.getTime()     - todayDate.getTime()) / 86400000);

          // タイムラインバー: 開始=告示7日前, 終了=投票日
          const timelineStart = new Date(announceDate);
          timelineStart.setDate(timelineStart.getDate() - 7);
          const spanMs      = voteDate.getTime() - timelineStart.getTime();
          const todayPct    = ((todayDate.getTime()   - timelineStart.getTime()) / spanMs) * 100;
          const announcePct = ((announceDate.getTime() - timelineStart.getTime()) / spanMs) * 100;

          // フェーズ定義: due_date で判定
          const phases = [
            {
              id: "pre",
              label: "告示前",
              sublabel: `〜${formatMMDD(ANNOUNCEMENT_DATE)}前日`,
              icon: "📋",
              milestone: `告示日 ${formatMMDD(ANNOUNCEMENT_DATE)}`,
              hdr: "bg-blue-600",
              bar: "bg-blue-500",
              ring: "ring-blue-200",
              bg: "bg-blue-50",
              badge: "bg-blue-100 text-blue-700",
              tasks: allTasks.filter(t => t.due_date && t.due_date < ANNOUNCEMENT_DATE),
            },
            {
              id: "announce",
              label: "告示日",
              sublabel: formatMMDD(ANNOUNCEMENT_DATE),
              icon: "📢",
              milestone: "告示完了",
              hdr: "bg-amber-600",
              bar: "bg-amber-500",
              ring: "ring-amber-200",
              bg: "bg-amber-50",
              badge: "bg-amber-100 text-amber-700",
              tasks: allTasks.filter(t => t.due_date && t.due_date === ANNOUNCEMENT_DATE),
            },
            {
              id: "period",
              label: "選挙期間",
              sublabel: `${formatMMDD(ANNOUNCEMENT_DATE)}〜${formatMMDD(VOTE_DATE)}`,
              icon: "🗳️",
              milestone: `投票日 ${formatMMDD(VOTE_DATE)}`,
              hdr: "bg-purple-600",
              bar: "bg-purple-500",
              ring: "ring-purple-200",
              bg: "bg-purple-50",
              badge: "bg-purple-100 text-purple-700",
              tasks: allTasks.filter(t => t.due_date && t.due_date > ANNOUNCEMENT_DATE && t.due_date < VOTE_DATE),
            },
            {
              id: "vote",
              label: "投票日前日・当日",
              sublabel: `投票日前日〜当日`,
              icon: "📊",
              milestone: "開票完了",
              hdr: "bg-emerald-600",
              bar: "bg-emerald-500",
              ring: "ring-emerald-200",
              bg: "bg-emerald-50",
              badge: "bg-emerald-100 text-emerald-700",
              tasks: allTasks.filter(t => t.due_date && t.due_date >= VOTE_DATE),
            },
          ];

          const totalAll   = allTasks.length;
          const doneAll    = allTasks.filter(t => t.status === "完了").length;
          const overallPct = totalAll > 0 ? Math.round((doneAll / totalAll) * 100) : 0;

          return (
            <div className="flex-1 overflow-y-auto" style={{ backgroundColor: "#f8fafc" }}>
              <div className="px-6 py-5 max-w-[1080px] mx-auto">

                {/* ── タイムラインヘッダー ── */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-5 mb-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="font-bold text-base">選挙ロードマップ</h2>
                      <p className="text-slate-400 text-xs mt-0.5">全タスク {totalAll} 件 — 全体 {overallPct}% 完了</p>
                    </div>
                    <div className="flex gap-4 text-center">
                      <div>
                        <p className="text-[10px] text-slate-400">告示まで</p>
                        <p className={`text-xl font-extrabold tabular-nums ${daysToAnnounce <= 0 ? "text-slate-400" : "text-orange-400"}`}>
                          {daysToAnnounce <= 0 ? "告示済" : `${daysToAnnounce}日`}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">投票日まで</p>
                        <p className={`text-xl font-extrabold tabular-nums ${daysToVote <= 0 ? "text-slate-400" : "text-white"}`}>
                          {daysToVote <= 0 ? "終了" : `${daysToVote}日`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* プロジェクト別進捗 */}
                  <div className="mt-4 space-y-2">
                    {Array.from(new Set(tasks.map(t => t.category))).map(cat => {
                      const catTasks = tasks.filter(t => t.category === cat);
                      const done = catTasks.filter(t => t.status === "完了").length;
                      const pct = catTasks.length > 0 ? Math.round(done / catTasks.length * 100) : 0;
                      const hasOverdue = catTasks.some(t => t.status !== "完了" && t.due_date < today);
                      return (
                        <div key={cat} className="flex items-center gap-3">
                          <span className="text-[11px] text-slate-300 w-28 shrink-0 truncate">{cat}</span>
                          <div className="flex-1 h-1.5 bg-slate-600 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${pct === 100 ? "bg-emerald-400" : hasOverdue ? "bg-red-400" : "bg-blue-400"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-slate-400 w-10 text-right tabular-nums shrink-0">{done}/{catTasks.length}</span>
                          <span className={`text-[11px] w-8 text-right tabular-nums font-bold shrink-0 ${pct === 100 ? "text-emerald-400" : hasOverdue ? "text-red-400" : "text-slate-300"}`}>{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── フェーズカラム ── */}
                <div className="grid grid-cols-4 gap-4">
                  {phases.map(phase => {
                    const byCategory: Record<string, Task[]> = {};
                    phase.tasks.forEach(t => {
                      if (!byCategory[t.category]) byCategory[t.category] = [];
                      byCategory[t.category].push(t);
                    });
                    const catNames = Object.keys(byCategory);
                    const phaseTotal   = phase.tasks.length;
                    const phaseDone    = phase.tasks.filter(t => t.status === "完了").length;
                    const phasePct     = phaseTotal > 0 ? Math.round((phaseDone / phaseTotal) * 100) : 0;
                    const phaseCleared = phaseTotal > 0 && phaseDone === phaseTotal;

                    return (
                      <div key={phase.id} className={`rounded-2xl overflow-hidden shadow-sm ring-1 ${phase.ring}`}>
                        {/* フェーズヘッダー */}
                        <div className={`${phase.hdr} text-white px-4 py-3`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{phase.icon}</span>
                              <div>
                                <p className="font-bold text-sm leading-tight">{phase.label}</p>
                                <p className="text-[10px] text-white/70">{phase.sublabel}</p>
                              </div>
                            </div>
                            {phaseCleared ? (
                              <span className="bg-white/25 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                ✅ クリア
                              </span>
                            ) : (
                              <span className="text-white/80 text-sm font-bold tabular-nums">{phasePct}%</span>
                            )}
                          </div>
                          {/* フェーズ進捗バー */}
                          <div className="mt-2 h-1.5 bg-white/20 rounded-full overflow-hidden">
                            <div className="h-full bg-white/70 rounded-full transition-all" style={{ width: `${phasePct}%` }} />
                          </div>
                        </div>

                        {/* カテゴリリスト */}
                        <div className={`${phase.bg} p-3 space-y-2`}>
                          {catNames.length === 0 && (
                            <p className="text-xs text-gray-400 text-center py-3">このフェーズにタスクなし</p>
                          )}
                          {catNames.map(cat => {
                            const catTasks = byCategory[cat];
                            const done     = catTasks.filter(t => t.status === "完了").length;
                            const inProg   = catTasks.filter(t => t.status === "進行中").length;
                            const total    = catTasks.length;
                            const pct      = Math.round((done / total) * 100);
                            const cleared  = done === total;

                            return (
                              <div key={cat} className="bg-white rounded-xl px-3 py-2.5 shadow-sm">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-xs font-semibold text-gray-700 truncate flex-1">{cat}</span>
                                  {cleared ? (
                                    <span className="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded-full ml-2 shrink-0">
                                      ✅ クリア
                                    </span>
                                  ) : inProg > 0 ? (
                                    <span className="text-[9px] bg-blue-50 text-blue-600 font-bold px-1.5 py-0.5 rounded-full ml-2 shrink-0">
                                      進行中 {inProg}
                                    </span>
                                  ) : (
                                    <span className="text-[9px] text-gray-400 ml-2 shrink-0 tabular-nums">{done}/{total}</span>
                                  )}
                                </div>
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${cleared ? "bg-emerald-500" : phase.bar}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* マイルストーン */}
                        <div className="bg-white border-t border-gray-100 px-4 py-2 flex items-center gap-1.5">
                          <span className="text-[10px] text-gray-400">ゴール:</span>
                          <span className="text-[10px] font-semibold text-gray-600">{phase.milestone}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>
          );
        })()}

      </div>
    </AppShell>
  );
}
