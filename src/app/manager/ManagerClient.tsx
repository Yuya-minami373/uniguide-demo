"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import FlowOverview from "@/components/FlowChart/FlowOverview";
import FlowCategory from "@/components/FlowChart/FlowCategory";
import type { User } from "@/lib/auth";

// デモ用選挙日程
const ANNOUNCEMENT_DATE = "2026-05-04"; // 告示日
const VOTE_DATE = "2026-05-11";         // 投票日

interface Task {
  id: number;
  title: string;
  category: string;
  status: string;
  start_date: string | null;
  due_date: string;
  assignee_id: number;
  assignee_name: string;
  completed_at: string | null;
  effort_label: string | null;
  sub_assignee_id: number | null;
  sub_assignee_name: string | null;
}

interface StaffUser {
  id: number;
  name: string;
  role: string;
  category: string;
}

interface Props {
  session: User;
  tasks: Task[];
  staffUsers: StaffUser[];
  urgentTasks: Task[];
  today: string;
  tomorrow: string;
  demoMode?: boolean;
  viewAs?: string;
}

const STATUS_BADGE: Record<string, { dot: string; bg: string; text: string; border: string }> = {
  "未着手":   { dot: "bg-gray-400",   bg: "bg-gray-50",   text: "text-gray-500",   border: "border-gray-200" },
  "進行中":   { dot: "bg-blue-500",   bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200" },
  "確認待ち": { dot: "bg-yellow-500", bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
};

function getDayDiff(dateStr: string, baseDate: string): number {
  const base = new Date(baseDate + "T00:00:00");
  const target = new Date(dateStr + "T00:00:00");
  return Math.round((target.getTime() - base.getTime()) / (1000 * 60 * 60 * 24));
}

function formatMMDD(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

interface CallStats {
  total: number;
  todayTotal: number;
  byCategory: { name: string; count: number }[];
  recent: { id: number; category_name: string; sub_category: string | null; duration: string; recorded_by_name: string; recorded_at: string }[];
}

export default function ManagerClient({ session, tasks, staffUsers, urgentTasks, today, demoMode = false, viewAs }: Props) {
  const [activeTab, setActiveTab] = useState<"morning" | "gantt" | "flow" | "calls" | "calendar" | "report">("morning");
  const [flowView, setFlowView] = useState<"overview" | "category">("overview");
  const [flowCategory, setFlowCategory] = useState<string | null>(null);
  const [selectedCalDate, setSelectedCalDate] = useState<string | null>(null);
  const [selectedCalCategory, setSelectedCalCategory] = useState<string>("all");
  const [showCompleted, setShowCompleted] = useState(false);
  const ganttScrollRef = useRef<HTMLDivElement>(null);
  // ユニポールアカウントかつviewAs=manager以外のとき実績カレンダー・UniReportを表示
  const isUnipoll = session.role === "unipoll" && viewAs !== "manager";

  const [callStats, setCallStats] = useState<CallStats | null>(null);
  useEffect(() => {
    fetch("/api/calls/stats")
      .then(r => r.json())
      .then((data: CallStats) => setCallStats(data))
      .catch(() => null);
  }, []);

  // ガントチャート: 今日の位置に自動スクロール
  useEffect(() => {
    if (activeTab === "gantt" && ganttScrollRef.current) {
      const GCELL = 26;
      const GLEFT = 280;
      const GANTT_START = "2026-02-01";
      const daysSinceStart = Math.round(
        (new Date(today + "T00:00:00").getTime() - new Date(GANTT_START + "T00:00:00").getTime()) / 86400000
      );
      const todayX = GLEFT + daysSinceStart * GCELL;
      const containerW = ganttScrollRef.current.clientWidth;
      ganttScrollRef.current.scrollLeft = todayX - containerW / 3;
    }
  }, [activeTab, today]);

  const [ganttScrollLeft, setGanttScrollLeft] = useState(0);
  useEffect(() => {
    const el = ganttScrollRef.current;
    if (!el) return;
    const handler = () => setGanttScrollLeft(el.scrollLeft);
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, [activeTab]);

  const DAYS = 28;
  const dayOffset = -2;
  const CELL = 38;
  const LEFT_W = 300;

  const days: string[] = [];
  for (let i = dayOffset; i < dayOffset + DAYS; i++) {
    const d = new Date(today + "T00:00:00");
    d.setDate(d.getDate() + i);
    days.push(d.toISOString().split("T")[0]);
  }
  const todayIdx = days.indexOf(today);
  const announcementIdx = days.indexOf(ANNOUNCEMENT_DATE);
  const voteIdx = days.indexOf(VOTE_DATE);

  const monthGroups: { label: string; start: number; count: number }[] = [];
  days.forEach((day, i) => {
    const d = new Date(day + "T00:00:00");
    const label = `${d.getFullYear()}年${d.getMonth() + 1}月`;
    const last = monthGroups[monthGroups.length - 1];
    if (last && last.label === label) { last.count++; }
    else { monthGroups.push({ label, start: i, count: 1 }); }
  });

  const activeTasks = tasks.filter(t => t.status !== "完了");
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "完了").length;
  const inProgressTasks = tasks.filter(t => t.status === "進行中").length;
  const progressCompleted = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const progressInProgress = totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0;

  const daysToAnnouncement = getDayDiff(ANNOUNCEMENT_DATE, today);
  const daysToVote = getDayDiff(VOTE_DATE, today);

  // 未着手かつ期限切れ（着手遅れ）
  const overdueUntouched = activeTasks.filter(
    t => t.status === "未着手" && t.due_date && t.due_date < today
  );

  return (
    <AppShell
      user={session}
      progressCompleted={progressCompleted}
      progressInProgress={progressInProgress}
      demoMode={demoMode}
    >
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ backgroundColor: "#f8fafc" }}>

        {/* ━━━ Page Header ━━━ */}
        <div className="bg-white border-b border-gray-200 px-6 py-2 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-400 font-medium tracking-wide">係長ダッシュボード</p>
              <h1 className="text-base font-bold text-gray-900 leading-tight">選挙業務ダッシュボード</h1>
            </div>

            {/* Countdown pills */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-lg px-3 py-1">
                <p className="text-[10px] text-orange-500 font-bold">告示日まで</p>
                <p className="text-xl font-black text-orange-500 tabular-nums leading-none">{daysToAnnouncement}</p>
                <p className="text-[10px] text-orange-400">日</p>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1">
                <p className="text-[10px] text-slate-500 font-bold">投票日まで</p>
                <p className="text-xl font-black text-slate-700 tabular-nums leading-none">{daysToVote}</p>
                <p className="text-[10px] text-slate-400">日</p>
              </div>
<Link
                href="/manager/categories"
                className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 transition shadow-sm"
              >
                業務別進捗
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-2">
            {[
              { key: "morning",  label: "Today's UniGuide" },
              { key: "flow",     label: "業務フロー" },
              { key: "gantt",    label: "ガントチャート" },
              { key: "calls",    label: "受電ステータス" },
              ...(isUnipoll ? [
                { key: "calendar", label: "実績カレンダー" },
                { key: "report",   label: "UniReport" },
              ] : []),
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as "morning" | "gantt" | "flow" | "calls" | "calendar" | "report")}
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
          {activeTab === "morning" && (
            <div className="px-6 py-3 space-y-4 flex-1 overflow-y-auto">

              {/* ━━━ 進捗サマリーバー ━━━ */}
              {(() => {
                const RING_R = 18;
                const RING_CIRC = 2 * Math.PI * RING_R;
                const progressDash = (progressCompleted / 100) * RING_CIRC;
                const overdueCount = activeTasks.filter(t => t.status === "未着手" && t.due_date && t.due_date < today).length;
                return (
                  <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm px-5 py-3 flex items-center gap-5">
                    {/* ミニ進捗リング */}
                    <div className="relative shrink-0">
                      <svg width="44" height="44" viewBox="0 0 44 44" className="-rotate-90">
                        <circle cx="22" cy="22" r={RING_R} fill="none" stroke="#f1f5f9" strokeWidth="5" />
                        <circle cx="22" cy="22" r={RING_R} fill="none" stroke="url(#mini-grad)" strokeWidth="5"
                          strokeLinecap="round" strokeDasharray={`${progressDash} ${RING_CIRC}`} />
                        <defs>
                          <linearGradient id="mini-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#4f46e5" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[11px] font-extrabold text-slate-700 tabular-nums">{progressCompleted}%</span>
                      </div>
                    </div>
                    <div className="w-px h-8 bg-slate-100 shrink-0" />
                    {/* 完了 */}
                    <div className="shrink-0">
                      <p className="text-[10px] text-slate-400 mb-0.5">完了</p>
                      <p className="text-base font-bold text-slate-800 tabular-nums leading-none">{completedTasks}<span className="text-xs font-normal text-slate-400">/{totalTasks}件</span></p>
                    </div>
                    {/* 進行中 */}
                    <div className="shrink-0">
                      <p className="text-[10px] text-slate-400 mb-0.5">進行中</p>
                      <p className="text-base font-bold text-blue-600 tabular-nums leading-none">{inProgressTasks}<span className="text-xs font-normal text-slate-400">件</span></p>
                    </div>
                    {/* 未着手 */}
                    <div className="shrink-0">
                      <p className="text-[10px] text-slate-400 mb-0.5">未着手</p>
                      <p className="text-base font-bold text-slate-500 tabular-nums leading-none">{activeTasks.filter(t => t.status === "未着手").length}<span className="text-xs font-normal text-slate-400">件</span></p>
                    </div>
                    {overdueCount > 0 && (
                      <>
                        <div className="w-px h-8 bg-slate-100 shrink-0" />
                        <div className="shrink-0 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-400  shrink-0" />
                          <div>
                            <p className="text-[10px] text-red-400 mb-0.5">着手遅れ</p>
                            <p className="text-base font-bold text-red-500 tabular-nums leading-none">{overdueCount}<span className="text-xs font-normal text-slate-400">件</span></p>
                          </div>
                        </div>
                      </>
                    )}
                    {/* プログレスバー */}
                    <div className="flex-1 ml-2">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>全体進捗</span>
                        <span>{progressCompleted}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full flex">
                          <div className="bg-emerald-400 rounded-l-full transition-all" style={{ width: `${progressCompleted}%` }} />
                          <div className="bg-blue-300 transition-all" style={{ width: `${progressInProgress}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ② プロジェクト別進捗 */}
              {(() => {
                const cats: Record<string, typeof tasks> = {};
                tasks.forEach(t => {
                  if (!cats[t.category]) cats[t.category] = [];
                  cats[t.category].push(t);
                });
                const catNames = Object.keys(cats);
                return (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      <h2 className="font-bold text-gray-800 text-sm">プロジェクト別進捗</h2>
                      <span className="ml-auto text-[10px] text-gray-400">{catNames.length}件</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {catNames.map(cat => {
                        const catTasks = cats[cat];
                        const done = catTasks.filter(t => t.status === "完了").length;
                        const doing = catTasks.filter(t => t.status === "進行中").length;
                        const waiting = catTasks.filter(t => t.status === "確認待ち").length;
                        const todo = catTasks.filter(t => t.status === "未着手").length;
                        const pct = catTasks.length > 0 ? Math.round((done / catTasks.length) * 100) : 0;
                        const hasOverdue = catTasks.some(t => t.status === "未着手" && t.due_date && t.due_date < today);
                        const tomorrowStr = new Date(new Date(today + "T00:00:00").getTime() + 86400000).toISOString().split("T")[0];
                        const hasUrgent = catTasks.some(t => (t.due_date === today || t.due_date === tomorrowStr) && t.status !== "完了");
                        const assignees = [...new Set(catTasks.map(t => t.assignee_name?.split(" ")[0]).filter(Boolean))];
                        return (
                          <div key={cat} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50/60 transition">
                            <div className="w-40 shrink-0">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <p className="text-sm font-bold text-gray-800 truncate flex-1 min-w-0">{cat}</p>
                                {hasUrgent && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" title="期限アラートあり" />}
                                {hasOverdue && <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-full shrink-0 whitespace-nowrap">遅れ</span>}
                              </div>
                              <p className="text-[10px] text-gray-400 truncate">{assignees.join("・")}</p>
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                                <span>{catTasks.length}タスク</span>
                                <span className="font-semibold text-gray-600">{pct}%</span>
                              </div>
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full flex">
                                  <div className="bg-emerald-500 rounded-l-full transition-all" style={{ width: `${pct}%` }} />
                                  <div className="bg-blue-400 transition-all" style={{ width: `${catTasks.length > 0 ? Math.round((doing / catTasks.length) * 100) : 0}%` }} />
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-1.5 shrink-0 justify-end" style={{ width: 240 }}>
                              {done > 0 && <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">完了 {done}</span>}
                              {doing > 0 && <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold">進行中 {doing}</span>}
                              {waiting > 0 && <span className="text-[10px] bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full font-bold">確認待 {waiting}</span>}
                              {todo > 0 && <span className="text-[10px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full font-bold">未着手 {todo}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* ② 要対応 + 進行中 + 完了タスク — 3カラム */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                {/* 要対応（着手遅れ + 期限アラート統合） */}
                <div className={`rounded-2xl shadow-sm overflow-hidden ${(overdueUntouched.length > 0 || urgentTasks.length > 0) ? "bg-white border border-red-200" : "bg-white border border-gray-200"}`}>
                  <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${(overdueUntouched.length > 0 || urgentTasks.length > 0) ? "bg-red-500" : "bg-gray-300"}`} />
                    <h2 className="font-bold text-gray-800 text-sm">要対応</h2>
                    {(overdueUntouched.length + urgentTasks.length) > 0 && (
                      <span className="ml-auto text-[10px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">
                        {overdueUntouched.length + urgentTasks.length}件
                      </span>
                    )}
                  </div>
                  <div className="divide-y divide-gray-50">
                    {overdueUntouched.length === 0 && urgentTasks.length === 0 ? (
                      <div className="py-6 text-center">
                        <p className="text-xs text-gray-400">要対応タスクなし</p>
                      </div>
                    ) : (
                      <>
                        {overdueUntouched.map(task => (
                          <Link key={task.id} href={`/tasks/${task.id}`}>
                            <div className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-red-50/40 transition">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white shrink-0">遅れ</span>
                              <span className="text-xs text-gray-800 font-medium flex-1 truncate">{task.title}</span>
                              <span className="text-[10px] text-gray-400 shrink-0">{task.category}</span>
                              <span className="text-[10px] text-red-500 font-bold shrink-0 tabular-nums">{formatMMDD(task.due_date)}</span>
                            </div>
                          </Link>
                        ))}
                        {urgentTasks.map(task => (
                          <Link key={task.id} href={`/tasks/${task.id}`}>
                            <div className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-red-50/40 transition">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white shrink-0 ${task.due_date === today ? "bg-red-500" : "bg-amber-400"}`}>
                                {task.due_date === today ? "今日" : "明日"}
                              </span>
                              <span className="text-xs text-gray-800 font-medium flex-1 truncate">{task.title}</span>
                              <span className="text-[10px] text-gray-400 shrink-0">{task.category}</span>
                              <span className="text-[10px] text-gray-500 shrink-0">{task.assignee_name?.split(" ")[0]}{task.sub_assignee_name ? ` +${task.sub_assignee_name.split(" ")[0]}` : ""}</span>
                            </div>
                          </Link>
                        ))}
                      </>
                    )}
                  </div>
                </div>

                {/* 進行中タスク */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <h2 className="font-bold text-gray-800 text-sm">進行中</h2>
                    <span className="ml-auto text-[10px] bg-blue-100 text-blue-600 font-bold px-2 py-0.5 rounded-full">
                      {activeTasks.filter(t => t.status === "進行中").length}件
                    </span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {activeTasks.filter(t => t.status === "進行中").length === 0 ? (
                      <div className="py-6 text-center">
                        <p className="text-xs text-gray-400">進行中のタスクなし</p>
                      </div>
                    ) : activeTasks.filter(t => t.status === "進行中").map(task => (
                      <Link key={task.id} href={`/tasks/${task.id}`}>
                        <div className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-blue-50/30 transition">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                          <span className="text-xs text-gray-800 font-medium flex-1 truncate">{task.title}</span>
                          <span className="text-[10px] text-gray-400 shrink-0">{task.category}</span>
                          <span className="text-[10px] text-gray-500 shrink-0">{task.assignee_name?.split(" ")[0]}{task.sub_assignee_name ? ` +${task.sub_assignee_name.split(" ")[0]}` : ""}</span>
                          <span className="text-[10px] text-gray-400 shrink-0 tabular-nums">{formatMMDD(task.due_date)}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* 直近の完了タスク */}
                {(() => {
                  const yesterday = new Date(today + "T00:00:00");
                  yesterday.setDate(yesterday.getDate() - 1);
                  const yesterdayStr = yesterday.toISOString().split("T")[0];
                  const completedToday = tasks.filter(t => t.status === "完了" && t.completed_at && t.completed_at.startsWith(today));
                  const completedYesterday = tasks.filter(t => t.status === "完了" && t.completed_at && t.completed_at.startsWith(yesterdayStr));
                  return (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <h2 className="font-bold text-gray-800 text-sm">完了</h2>
                        <span className="ml-auto text-[10px] text-gray-400">{completedToday.length + completedYesterday.length}件</span>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {completedToday.length === 0 && completedYesterday.length === 0 ? (
                          <div className="py-6 text-center">
                            <p className="text-xs text-gray-400">直近の完了タスクなし</p>
                          </div>
                        ) : (
                          <>
                            {completedToday.length > 0 && (
                              <div>
                                <div className="px-3 py-1 bg-emerald-50/50">
                                  <span className="text-[10px] font-bold text-emerald-600">今日 — {completedToday.length}件</span>
                                </div>
                                {completedToday.map(task => (
                                  <Link key={task.id} href={`/tasks/${task.id}`}>
                                    <div className="flex items-center gap-2 px-3 py-2.5 hover:bg-emerald-50/30 transition">
                                      <span className="text-emerald-500 text-xs shrink-0">✓</span>
                                      <span className="text-xs text-gray-800 font-medium flex-1 truncate">{task.title}</span>
                                      <span className="text-[10px] text-gray-400 shrink-0">{task.category}</span>
                                      <span className="text-[10px] text-gray-400 shrink-0">{task.assignee_name?.split(" ")[0]}{task.sub_assignee_name ? ` +${task.sub_assignee_name.split(" ")[0]}` : ""}</span>
                                      {task.effort_label && (
                                        <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-medium shrink-0">{task.effort_label}</span>
                                      )}
                                    </div>
                                  </Link>
                                ))}
                              </div>
                            )}
                            {completedYesterday.length > 0 && (
                              <div>
                                <div className="px-3 py-1 bg-slate-50/50">
                                  <span className="text-[10px] font-bold text-slate-500">昨日 — {completedYesterday.length}件</span>
                                </div>
                                {completedYesterday.map(task => (
                                  <Link key={task.id} href={`/tasks/${task.id}`}>
                                    <div className="flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50/50 transition">
                                      <span className="text-slate-400 text-xs shrink-0">✓</span>
                                      <span className="text-xs text-gray-600 flex-1 truncate">{task.title}</span>
                                      <span className="text-[10px] text-gray-400 shrink-0">{task.category}</span>
                                      <span className="text-[10px] text-gray-400 shrink-0">{task.assignee_name?.split(" ")[0]}{task.sub_assignee_name ? ` +${task.sub_assignee_name.split(" ")[0]}` : ""}</span>
                                      {task.effort_label && (
                                        <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-medium shrink-0">{task.effort_label}</span>
                                      )}
                                    </div>
                                  </Link>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })()}

              </div>

            </div>
          )}

          {/* ━━━ 受電ステータスタブ ━━━ */}
          {activeTab === "calls" && callStats && (() => {
            // 日付別に集計
            const byDate: Record<string, typeof callStats.recent> = {};
            for (const log of callStats.recent) {
              const dateKey = log.recorded_at.split(" ")[0];
              if (!byDate[dateKey]) byDate[dateKey] = [];
              byDate[dateKey].push(log);
            }
            const dateKeys = Object.keys(byDate).sort();

            const CATEGORY_COLORS: Record<string, string> = {
              "期日前投票": "bg-emerald-100 text-emerald-700",
              "入場整理券": "bg-blue-100 text-blue-700",
              "選挙公報": "bg-amber-100 text-amber-700",
              "選挙運動・政治活動": "bg-red-100 text-red-700",
              "不在者・郵便投票": "bg-purple-100 text-purple-700",
              "その他": "bg-gray-100 text-gray-600",
            };
            const getCatColor = (name: string) => {
              const short = name.replace("関連", "");
              return CATEGORY_COLORS[short] || "bg-gray-100 text-gray-600";
            };

            return (
              <div className="px-3 md:px-6 py-3 space-y-4 flex-1 overflow-y-auto">
                {/* KPIカード */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3">
                    <p className="text-[10px] text-gray-400 mb-1">今日の受電</p>
                    <p className="text-2xl font-extrabold text-violet-600 tabular-nums">{callStats.todayTotal}<span className="text-sm font-normal text-gray-400 ml-1">件</span></p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3">
                    <p className="text-[10px] text-gray-400 mb-1">累計</p>
                    <p className="text-2xl font-extrabold text-gray-800 tabular-nums">{callStats.total}<span className="text-sm font-normal text-gray-400 ml-1">件</span></p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3">
                    <p className="text-[10px] text-gray-400 mb-1">最多カテゴリ</p>
                    <p className="text-sm font-bold text-gray-800 truncate">{callStats.byCategory[0]?.name.replace("関連", "") ?? "—"}</p>
                    <p className="text-[10px] text-gray-400">{callStats.byCategory[0]?.count ?? 0}件</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3">
                    <p className="text-[10px] text-gray-400 mb-1">カテゴリ数</p>
                    <p className="text-2xl font-extrabold text-gray-800 tabular-nums">{callStats.byCategory.filter(c => c.count > 0).length}<span className="text-sm font-normal text-gray-400 ml-1">種</span></p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* カテゴリ別内訳 */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-violet-500" />
                      <h2 className="font-bold text-gray-800 text-sm">カテゴリ別内訳</h2>
                    </div>
                    <div className="p-4 space-y-2.5">
                      {callStats.byCategory.map(c => {
                        const maxCount = Math.max(...callStats!.byCategory.map(x => x.count), 1);
                        const short = c.name.replace("関連", "");
                        return (
                          <div key={c.name}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-700 font-medium">{short}</span>
                              <span className="text-xs font-bold text-gray-800 tabular-nums">{c.count}件</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-violet-400 rounded-full transition-all" style={{ width: `${(c.count / maxCount) * 100}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 受電履歴（日付別） */}
                  <div className="col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-violet-500" />
                      <h2 className="font-bold text-gray-800 text-sm">受電履歴</h2>
                      <span className="ml-auto text-[10px] text-gray-400">直近{callStats.recent.length}件</span>
                    </div>
                    <div className="divide-y divide-gray-100 max-h-[480px] overflow-y-auto">
                      {dateKeys.map(dateKey => {
                        const logs = byDate[dateKey];
                        const dt = new Date(dateKey + "T00:00:00");
                        const isToday = dateKey === today;
                        const dateLabel = isToday ? "今日" : `${dt.getMonth() + 1}/${dt.getDate()}（${"日月火水木金土"[dt.getDay()]}）`;
                        return (
                          <div key={dateKey}>
                            <div className={`px-4 py-1.5 ${isToday ? "bg-violet-50" : "bg-gray-50"}`}>
                              <span className={`text-[10px] font-bold ${isToday ? "text-violet-600" : "text-gray-500"}`}>{dateLabel} — {logs.length}件</span>
                            </div>
                            {logs.sort((a, b) => a.recorded_at.localeCompare(b.recorded_at)).map(log => {
                              const t = new Date(log.recorded_at);
                              const timeStr = `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
                              return (
                                <div key={log.id} className="flex items-center gap-2.5 px-4 py-2 hover:bg-gray-50/50 transition">
                                  <span className="text-[11px] text-gray-400 tabular-nums shrink-0 w-10">{timeStr}</span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${getCatColor(log.category_name)}`}>{log.category_name.replace("関連", "")}</span>
                                  <span className="text-xs text-gray-700 flex-1 truncate">{log.sub_category || "—"}</span>
                                  <span className="text-[10px] text-gray-400 shrink-0">{log.recorded_by_name}</span>
                                  <span className="text-[10px] bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded shrink-0">{log.duration}</span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

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

            // ステータス別バースタイル（薄め背景 + ボーダー）
            const barCls = (status: string, isOverdue: boolean, isSub = false) => {
              if (isOverdue)             return "bg-red-50 border-2 border-red-400";
              if (status === "完了")     return "border border-emerald-400";
              if (isSub) {
                if (status === "進行中")   return "bg-orange-50 border border-orange-300";
                if (status === "確認待ち") return "bg-orange-50/50 border border-orange-200";
                return "bg-orange-50/30 border border-orange-200";
              }
              if (status === "進行中")   return "bg-blue-50 border border-blue-400";
              if (status === "確認待ち") return "bg-amber-50 border border-amber-400";
              return "bg-slate-100 border border-slate-300";
            };

            const barInlineStyle = (status: string, isOverdue: boolean): React.CSSProperties => {
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

            return (
              <div className="flex-1 overflow-hidden flex flex-col bg-white border-t border-gray-200">
                {/* ━━━ 凡例 + 完了トグル ━━━ */}
                <div className="flex items-center gap-4 px-4 py-2 border-b border-gray-100 bg-slate-50/60 flex-wrap shrink-0">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide shrink-0">凡例</span>
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
                  <div className="flex items-center gap-1.5">
                    <span className="w-8 h-3.5 rounded-full shrink-0 bg-orange-50 border border-orange-300" />
                    <span className="text-[11px] text-orange-700 font-semibold">サブ担当</span>
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

                    {/* ━ 月ヘッダー ━ */}
                    <div className="flex border-b border-gray-100 bg-white sticky top-0 z-40">
                      <div className="shrink-0 border-r-2 border-gray-200 px-3 flex items-end pb-1 bg-white sticky left-0 z-50" style={{ width: GLEFT }}>
                        <span className="text-[10px] font-semibold text-gray-400 tracking-wide">タスク / 担当</span>
                      </div>
                      <div className="flex">
                        {gMonthGroups.map(mg => (
                          <div key={mg.label} style={{ width: mg.count * GCELL }} className="shrink-0 border-r border-gray-100 px-2 pt-1.5 pb-0.5">
                            <span className="text-[11px] font-bold text-gray-500">{mg.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ━ 日付ヘッダー ━ */}
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

                    {/* ━ 職員別タスク行 ━ */}
                    {staffUsers.map(staff => {
                      const staffTasks = tasks.filter(t => t.assignee_id === staff.id || t.sub_assignee_id === staff.id);
                      const visibleTasks = staffTasks.filter(t => showCompleted || t.status !== "完了");
                      if (visibleTasks.length === 0) return null;

                      const sorted = [...staffTasks]
                        .filter(t => showCompleted || t.status !== "完了")
                        .sort((a, b) => {
                          const ord: Record<string, number> = { "進行中": 0, "確認待ち": 1, "未着手": 2, "完了": 3 };
                          const d = (ord[a.status] ?? 9) - (ord[b.status] ?? 9);
                          return d !== 0 ? d : a.due_date < b.due_date ? -1 : 1;
                        });

                      // マイルストーンライン（共通JSX）
                      const milestones = (
                        <>
                          {gTodayIdx >= 0 && <div className="absolute top-0 bottom-0 w-px bg-red-500 z-10 opacity-70" style={{ left: gTodayIdx * GCELL + GCELL / 2 }} />}
                          {gAnnIdx   >= 0 && <div className="absolute top-0 bottom-0 z-10 opacity-50" style={{ left: gAnnIdx * GCELL + GCELL / 2, borderLeft: "1px dashed #f97316" }} />}
                          {gVoteIdx  >= 0 && <div className="absolute top-0 bottom-0 z-10 opacity-50" style={{ left: gVoteIdx * GCELL + GCELL / 2, borderLeft: "1px dashed #ef4444" }} />}
                        </>
                      );

                      return (
                        <div key={staff.id}>
                          {/* 職員ヘッダー行 */}
                          <div className="flex border-b border-blue-100 bg-gradient-to-r from-slate-50 to-blue-50/30">
                            <div className="shrink-0 border-r-2 border-gray-200 px-3 py-1.5 flex items-center gap-2 sticky left-0 z-30 bg-slate-50" style={{ width: GLEFT }}>
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-black shrink-0">
                                {staff.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-800 truncate">{staff.name}</p>
                                <p className="text-[10px] text-gray-400 truncate">{staff.category}</p>
                              </div>
                              <span className="ml-auto text-[10px] text-gray-400 shrink-0">{staffTasks.length}件</span>
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

                            // バー座標計算（範囲外はクランプ）
                            const realSIdx = ganttDays.indexOf(s);
                            const clampedStart = s < GANTT_START;
                            const sIdx = clampedStart ? 0 : Math.max(0, realSIdx);
                            const clampedEnd = task.due_date > GANTT_END;
                            const eIdx = clampedEnd ? GDAYS - 1 : ganttDays.indexOf(task.due_date);
                            const hasBar = eIdx >= 0;
                            const barLeft = hasBar ? sIdx * GCELL + 2 : 0;
                            const barW    = hasBar ? Math.max(GCELL * 3, (eIdx + 1) * GCELL - sIdx * GCELL - 4) : 0;

                            // バー内ラベル
                            const statusLabel = isOverdue && task.status !== "完了" ? "着手遅れ"
                              : task.status === "進行中"   ? "進行中"
                              : task.status === "確認待ち" ? "確認待ち"
                              : task.status === "完了"     ? "完了"
                              : "未着手";

                            const isSub = task.assignee_id !== staff.id && task.sub_assignee_id === staff.id;

                            return (
                              <Link key={task.id} href={`/tasks/${task.id}`}>
                                <div className={`flex border-b border-gray-50 transition group cursor-pointer ${isComplete ? "opacity-55" : ""} ${isSub ? "hover:bg-orange-50/40" : "hover:bg-blue-50/25"}`}>
                                  {/* 左パネル */}
                                  <div className={`shrink-0 border-r-2 border-gray-200 py-1.5 flex items-center gap-2 sticky left-0 z-30 ${isSub ? "bg-orange-50 group-hover:bg-orange-100 pl-0 pr-3" : "bg-white group-hover:bg-blue-50 px-3"}`} style={{ width: GLEFT }}>
                                    {isSub ? <div className="w-[3px] self-stretch bg-orange-400 rounded-r shrink-0" /> : null}
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSub ? "ml-2" : "ml-5"} ${isSub ? "bg-orange-400" : dotColor(task.status, isOverdue)}`} />
                                    <span className={`text-[11px] leading-tight flex-1 truncate ${isOverdue ? "text-red-600 font-semibold" : isComplete ? "text-gray-400 line-through" : isSub ? "text-orange-700" : "text-gray-800"}`}>
                                      {task.title}
                                    </span>
                                    {isSub && <span className="text-[9px] font-bold text-orange-600 bg-orange-100 border border-orange-200 px-1.5 py-0.5 rounded shrink-0">サブ</span>}
                                  </div>

                                  {/* バーエリア */}
                                  <div className="flex-1 relative" style={{ minHeight: 32 }}>
                                    {milestones}
                                    {hasBar && (() => {
                                      const labelOffset = Math.max(0, ganttScrollLeft - barLeft);
                                      return (
                                        <div
                                          className={`absolute top-1/2 -translate-y-1/2 h-[22px] z-[5] overflow-hidden ${barCls(task.status, isOverdue, isSub)} ${clampedStart ? "rounded-r-full" : "rounded-full"}`}
                                          style={{ left: barLeft, width: barW, ...barInlineStyle(task.status, isOverdue) }}
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

          {/* ━━━ 業務フロータブ ━━━ */}
          {activeTab === "flow" && (
            <div className="px-6 py-4 flex-1 overflow-y-auto">
              {flowView === "overview" ? (
                <FlowOverview
                  tasks={tasks}
                  onCategoryClick={(cat) => { setFlowView("category"); setFlowCategory(cat); }}
                />
              ) : flowCategory ? (
                <FlowCategory
                  tasks={tasks.filter(t => t.category === flowCategory)}
                  category={flowCategory}
                  onBack={() => { setFlowView("overview"); setFlowCategory(null); }}
                />
              ) : null}
            </div>
          )}

          {/* ━━━ 実績カレンダータブ ━━━ */}
          {activeTab === "calendar" && (() => {
            const allCompleted = tasks.filter(t => t.status === "完了" && t.completed_at);
            const categoryOptions = ["all", ...Array.from(new Set(allCompleted.map(t => t.category)))];
            const filtered = selectedCalCategory === "all"
              ? allCompleted
              : allCompleted.filter(t => t.category === selectedCalCategory);

            const byDate: Record<string, Task[]> = {};
            filtered.forEach(t => {
              const d = t.completed_at!;
              if (!byDate[d]) byDate[d] = [];
              byDate[d].push(t);
            });

            const maxPerDay = Math.max(...Object.values(byDate).map(v => v.length), 1);
            const activeDays = Object.keys(byDate).length;
            const onTime = filtered.filter(t => t.completed_at! <= t.due_date);
            const onTimeRate = filtered.length > 0 ? Math.round(onTime.length / filtered.length * 100) : 0;
            const leadTimes = filtered.map(t =>
              Math.round((new Date(t.due_date+"T00:00:00").getTime() - new Date(t.completed_at!+"T00:00:00").getTime()) / 86400000)
            );
            const avgLead = leadTimes.length > 0 ? leadTimes.reduce((a,b) => a+b, 0) / leadTimes.length : 0;

            // 右パネル: デフォルトは完了が存在する最初の日
            const sortedDates = Object.keys(byDate).sort();
            const displayDate = selectedCalDate ?? sortedDates[0] ?? null;

            const cellColor = (count: number) => {
              if (count === 0) return "bg-slate-100 hover:bg-slate-200 text-slate-300";
              const p = count / maxPerDay;
              if (p <= 0.33) return "bg-emerald-200 hover:bg-emerald-300 text-emerald-800";
              if (p <= 0.66) return "bg-emerald-400 hover:bg-emerald-500 text-white";
              return "bg-emerald-600 hover:bg-emerald-700 text-white";
            };

            const calMonths = [
              { year: 2026, month: 1, label: "1月" },
              { year: 2026, month: 2, label: "2月" },
              { year: 2026, month: 3, label: "3月" },
            ];

            return (
              <div className="px-6 py-3 space-y-4 flex-1 overflow-y-auto">
                {/* Header card */}
                <div className="bg-white border border-slate-200 rounded-xl px-6 py-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Task Completion Record</p>
                      <h2 className="text-base font-bold text-slate-900 mt-0.5">実績カレンダー</h2>
                      <p className="text-xs text-slate-400 mt-0.5">令和8年 ○○市議会議員選挙 — 担当者が替わっても、記録は残る</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <span>少</span>
                      {["bg-slate-100","bg-emerald-200","bg-emerald-400","bg-emerald-600"].map(c => (
                        <span key={c} className={`inline-block w-4 h-4 rounded-sm ${c}`} />
                      ))}
                      <span>多</span>
                    </div>
                  </div>

                  {/* KPIs */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    {[
                      { label: "記録済みタスク数", value: `${filtered.length}`, unit: "件", sub: "次の担当者への引き継ぎ資料になります", subColor: "text-slate-400" },
                      { label: "稼働日数", value: `${activeDays}`, unit: "日間", sub: "完了が発生した実働日", subColor: "text-slate-400" },
                      { label: "当日に間に合った率", value: `${onTimeRate}`, unit: "%",
                        sub: onTimeRate >= 80 ? "次回もこの基準を目標に" : onTimeRate >= 60 ? "改善余地あり・今回の気づきを確認" : "着手タイミングの見直しが必要",
                        subColor: onTimeRate >= 80 ? "text-emerald-500" : onTimeRate >= 60 ? "text-amber-500" : "text-red-500" },
                      { label: "余裕をもって終わった日数", value: avgLead >= 0 ? `+${avgLead.toFixed(1)}` : avgLead.toFixed(1), unit: "日",
                        sub: avgLead >= 0 ? "次回の期限を後ろ倒しにできる余地" : "期限の前倒し設定を推奨",
                        subColor: avgLead >= 0 ? "text-emerald-500" : "text-red-500" },
                    ].map(kpi => (
                      <div key={kpi.label} className="bg-slate-50 rounded-lg px-4 py-3">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">{kpi.label}</p>
                        <p className="text-xl font-black tabular-nums text-slate-900">
                          {kpi.value}<span className="text-xs font-normal text-slate-400 ml-1">{kpi.unit}</span>
                        </p>
                        <p className={`text-[10px] mt-0.5 ${kpi.subColor}`}>{kpi.sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* Category filter */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mr-1">業務カテゴリ</span>
                    {categoryOptions.map(cat => (
                      <button
                        key={cat}
                        onClick={() => { setSelectedCalCategory(cat); setSelectedCalDate(null); }}
                        className={`px-3 py-1 rounded-full text-[11px] font-semibold transition ${
                          selectedCalCategory === cat
                            ? "bg-slate-800 text-white"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {cat === "all" ? "すべて" : cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2-pane: カレンダー（左）+ タスク一覧（右・常時表示） */}
                <div className="grid gap-4 grid-cols-1 lg:[grid-template-columns:1fr_320px]">
                  {/* Left: monthly grids */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {calMonths.map(({ year, month, label }) => {
                      const firstDow = new Date(year, month - 1, 1).getDay();
                      const daysInMonth = new Date(year, month, 0).getDate();
                      return (
                        <div key={label} className="bg-white border border-slate-200 rounded-xl p-4">
                          <h3 className="text-sm font-bold text-slate-700 mb-3">2026年{label}</h3>
                          <div className="grid grid-cols-7 gap-1 mb-1">
                            {["日","月","火","水","木","金","土"].map(d => (
                              <div key={d} className="text-center text-[10px] text-slate-400 font-medium">{d}</div>
                            ))}
                          </div>
                          <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                              const day = i + 1;
                              const dateStr = `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                              const count = byDate[dateStr]?.length ?? 0;
                              const isSelected = displayDate === dateStr;
                              return (
                                <button
                                  key={day}
                                  onClick={() => setSelectedCalDate(isSelected ? null : dateStr)}
                                  className={`aspect-square flex items-center justify-center rounded text-[11px] font-semibold transition relative
                                    ${cellColor(count)}
                                    ${isSelected ? "ring-2 ring-indigo-500 ring-offset-1" : ""}
                                  `}
                                >
                                  {day}
                                  {count > 0 && (
                                    <span className="absolute bottom-0 right-0.5 text-[8px] font-bold leading-none opacity-80">{count}</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right: task detail panel（常時表示） */}
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col" style={{ minHeight: 360 }}>
                    {displayDate && byDate[displayDate] ? (
                      <>
                        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                          <p className="text-sm font-bold text-slate-800">{displayDate.replace(/-/g,"/")} の完了タスク</p>
                          <p className="text-xs text-slate-400 mt-0.5">{byDate[displayDate].length}件 — 期限比（前倒し・遅れ）</p>
                        </div>
                        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                          {byDate[displayDate].map(task => {
                            const diff = task.due_date
                              ? Math.round((new Date(task.due_date+"T00:00:00").getTime() - new Date(task.completed_at!+"T00:00:00").getTime()) / 86400000)
                              : null;
                            return (
                              <div key={task.id} className="px-4 py-3">
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                  <span className="text-sm text-slate-800 font-medium leading-snug flex-1">{task.title}</span>
                                  {diff !== null && (
                                    <span className={`text-xs font-bold tabular-nums shrink-0 px-2 py-0.5 rounded-full ${
                                      diff > 0 ? "bg-emerald-50 text-emerald-600" : diff < 0 ? "bg-red-50 text-red-500" : "bg-slate-100 text-slate-500"
                                    }`}>
                                      {diff > 0 ? `${diff}日早` : diff < 0 ? `${Math.abs(diff)}日遅` : "期限当日"}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">{task.category}</span>
                                  <span className="text-[10px] text-slate-400">{task.assignee_name.split(" ")[0]}</span>
                                  {task.due_date && <span className="text-[10px] text-slate-300 ml-auto">期限 {task.due_date.slice(5).replace("-","/")}</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="px-4 py-3 bg-emerald-50 border-t border-emerald-100">
                          <p className="text-[10px] font-semibold text-emerald-700">次回選挙への活用</p>
                          <p className="text-[10px] text-emerald-600 mt-0.5">この日の完了タイミングをもとに、次回の期限を前後に調整できます。UniReportで詳細分析を確認してください。</p>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center flex-col gap-3 px-6 text-center">
                        <p className="text-3xl">📅</p>
                        <p className="text-sm font-medium text-slate-600">日付をクリックすると<br />その日の完了タスクが表示されます</p>
                        <p className="text-[10px] text-slate-400 leading-relaxed">色が濃い日ほど多くのタスクが完了した日。<br />担当者が変わっても、この記録は残ります。</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ━━━ UniReport タブ ━━━ */}
          {activeTab === "report" && (() => {
            const completed = tasks.filter(t => t.status === "完了" && t.completed_at);
            const total = tasks.length;

            const dayDiff = (a: string, b: string) =>
              Math.round((new Date(b+"T00:00:00").getTime() - new Date(a+"T00:00:00").getTime()) / 86400000);

            const onTime = completed.filter(t => t.completed_at! <= t.due_date);
            const onTimeRate = completed.length > 0 ? Math.round(onTime.length / completed.length * 100) : 0;
            const leadTimes = completed.map(t => dayDiff(t.completed_at!, t.due_date));
            const avgLead = leadTimes.length > 0 ? leadTimes.reduce((a,b) => a+b, 0) / leadTimes.length : 0;
            const lateCount = leadTimes.filter(l => l < 0).length;

            const categoryNames = Array.from(new Set(tasks.map(t => t.category)));
            const catStats = categoryNames.map(cat => {
              const catAll = tasks.filter(t => t.category === cat);
              const catDone = completed.filter(t => t.category === cat);
              const catOnTime = catDone.filter(t => t.completed_at! <= t.due_date);
              const catLeads = catDone.map(t => dayDiff(t.completed_at!, t.due_date));
              const catAvgLead = catLeads.length > 0 ? catLeads.reduce((a,b) => a+b, 0) / catLeads.length : null;
              return {
                cat,
                total: catAll.length,
                done: catDone.length,
                pct: Math.round(catDone.length / catAll.length * 100),
                onTimePct: catDone.length > 0 ? Math.round(catOnTime.length / catDone.length * 100) : null,
                avgLead: catAvgLead,
              };
            });

            // 今回の気づき（自動集計）— 3段階評価
            const handoverItems: { level: "danger" | "warn" | "good"; cat: string; message: string }[] = [];
            catStats.forEach(s => {
              if (s.avgLead !== null && s.avgLead < -1) {
                handoverItems.push({ level: "danger", cat: s.cat, message: `着手を ${Math.ceil(Math.abs(s.avgLead) + 2)}日前倒しすることで、超過リスクをゼロにできます` });
              } else if (s.onTimePct !== null && s.onTimePct < 80) {
                handoverItems.push({ level: "warn", cat: s.cat, message: `期限内完了率 ${s.onTimePct}%。次回は余裕を持ったスケジュール設計を推奨します` });
              } else if (s.done > 0) {
                handoverItems.push({ level: "good", cat: s.cat, message: `期限内完了率 ${s.onTimePct ?? 100}%。今回のスケジュールを次回の基準として活用できます` });
              }
            });

            // 工数（effort_label実績 → 時間換算。未記録分は標準推計で補完）
            const STD_HOURS: Record<string, number> = {
              "入場整理券": 2, "選挙公報": 4, "期日前投票": 3,
              "開票": 3, "投票所管理": 2, "ポスター掲示場": 2,
            };
            const EFFORT_TO_H: Record<string, number> = {
              "30分以内": 0.5, "1〜2時間": 1.5,
              "半日（3〜4時間）": 3.5, "1日以上": 8,
            };
            const workloadStats = catStats.map(s => {
              const catDone = completed.filter(t => t.category === s.cat);
              const actualH = catDone.reduce((sum, t) =>
                sum + (t.effort_label ? (EFFORT_TO_H[t.effort_label] ?? 0) : (STD_HOURS[s.cat] ?? 2)), 0
              );
              const estH = (STD_HOURS[s.cat] ?? 2) * s.done;
              const hasActual = catDone.some(t => t.effort_label);
              return { cat: s.cat, stdH: STD_HOURS[s.cat] ?? 2, estH, actualH, hasActual, done: s.done };
            });
            const totalActualH = workloadStats.reduce((sum, w) => sum + w.actualH, 0);
            const totalEstH = workloadStats.reduce((sum, w) => sum + w.estH, 0);
            const hasAnyActual = workloadStats.some(w => w.hasActual);

            // 担当者別負荷
            const staffStats = staffUsers.map(staff => {
              const done = completed.filter(t => t.assignee_id === staff.id);
              const estH = done.reduce((sum, t) => sum + (STD_HOURS[t.category] ?? 2), 0);
              const onT = done.filter(t => t.completed_at! <= t.due_date);
              return {
                name: staff.name,
                count: done.length,
                estH,
                onTimePct: done.length > 0 ? Math.round(onT.length / done.length * 100) : null,
              };
            }).filter(s => s.count > 0);

            // 週次完了データ（カテゴリ別）
            const CAT_COLORS: Record<string, string> = {
              "入場整理券": "#3b82f6",
              "投票所管理": "#10b981",
              "選挙公報":   "#8b5cf6",
              "期日前投票": "#f59e0b",
              "開票":       "#f43f5e",
              "ポスター掲示場": "#0ea5e9",
            };
            const allCats = Array.from(new Set(completed.map(t => t.category)));
            const weekBuckets: { label: string; count: number; catCounts: Record<string, number>; isPeak: boolean }[] = [];
            const weekStart = new Date("2026-01-26T00:00:00");
            for (let w = 0; w < 10; w++) {
              const ws = new Date(weekStart); ws.setDate(ws.getDate() + w * 7);
              const we = new Date(ws); we.setDate(we.getDate() + 6);
              const wsStr = ws.toISOString().split("T")[0];
              const weStr = we.toISOString().split("T")[0];
              const weekTasks = completed.filter(t => t.completed_at! >= wsStr && t.completed_at! <= weStr);
              const catCounts: Record<string, number> = {};
              allCats.forEach(cat => { catCounts[cat] = weekTasks.filter(t => t.category === cat).length; });
              weekBuckets.push({ label: `${ws.getMonth()+1}/${ws.getDate()}週`, count: weekTasks.length, catCounts, isPeak: false });
            }
            const maxWeekCount = Math.max(...weekBuckets.map(w => w.count), 1);
            const peakIdx = weekBuckets.reduce((mi, w, i) => w.count > weekBuckets[mi].count ? i : mi, 0);
            weekBuckets[peakIdx].isPeak = true;


            // 費用対効果（職員時給2,500円想定）
            const HOURLY_RATE = 2500;
            const costEst = Math.round(totalEstH * HOURLY_RATE / 10000);

            // 仮想ベンチマーク（同規模自治体平均）
            const BENCHMARK_RATE = 82;

            return (
              <div className="px-6 py-3 space-y-4 flex-1 overflow-y-auto">

                {/* ① Executive header */}
                <div className="rounded-xl px-6 py-5 text-white" style={{ background: "linear-gradient(135deg, #1a3a8f 0%, #1e4db7 60%, #1a3a8f 100%)" }}>
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      <p className="text-[10px] font-semibold text-blue-300 uppercase tracking-wider">UniReport — 選挙後分析レポート</p>
                      <h2 className="text-lg font-bold text-white mt-0.5">UniReport</h2>
                      <p className="text-xs text-blue-300 mt-0.5">令和8年 ○○市議会議員選挙 / 2026年2月〜3月</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-blue-300">今回の管理工数{hasAnyActual ? "（実績）" : "（推計）"}</p>
                      <p className="text-4xl font-black tabular-nums text-white leading-none mt-1">
                        {hasAnyActual ? totalActualH.toFixed(1) : totalEstH}<span className="text-xl">h</span>
                      </p>
                      <p className="text-[10px] text-blue-300 mt-1">{completed.length}件完了</p>
                    </div>
                  </div>
                </div>

                {/* ⑤ 業務別工数実績 */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">業務別工数実績</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">業務カテゴリごとの合計工数 — 次回選挙の計画基準として活用できます</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-slate-900 tabular-nums">{hasAnyActual ? totalActualH.toFixed(1) : totalEstH}<span className="text-xs font-normal text-slate-400 ml-1">h</span></p>
                      <p className="text-[9px] text-slate-400 mt-0.5">合計{hasAnyActual ? "（実績）" : "（推計）"}</p>
                    </div>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        {["業務カテゴリ", "完了タスク数", "合計工数", "1件あたり平均", "工数バー"].map(h => (
                          <th key={h} className="px-5 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {workloadStats.filter(w => w.actualH > 0).map((w, i) => {
                        const avg = w.done > 0 ? w.actualH / w.done : 0;
                        const barMax = Math.max(...workloadStats.map(x => x.actualH), 1);
                        return (
                          <tr key={w.cat} className={`border-b border-slate-50 ${i % 2 === 0 ? "" : "bg-slate-50/40"}`}>
                            <td className="px-5 py-3 text-sm font-medium text-slate-800">{w.cat}</td>
                            <td className="px-5 py-3 text-sm text-slate-600 tabular-nums">{w.done}件</td>
                            <td className="px-5 py-3">
                              <span className="text-sm font-black text-orange-600 tabular-nums">{w.actualH.toFixed(1)}h</span>
                              {w.hasActual && <span className="text-[9px] text-violet-400 ml-1">実績</span>}
                            </td>
                            <td className="px-5 py-3 text-sm text-slate-500 tabular-nums">{avg.toFixed(1)}h/件</td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-orange-400 rounded-full" style={{ width: `${(w.actualH / barMax) * 100}%` }} />
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100">
                    <p className="text-[10px] text-slate-500">タスク完了時に工数を記録すると、次回選挙の計画精度が上がります。</p>
                  </div>
                </div>

                {/* ⑥ 週次繁忙推移 */}
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-900">週次繁忙推移</h3>
                    <p className="text-[10px] text-slate-400">繁忙ピーク週: <span className="font-semibold text-slate-700">{weekBuckets[peakIdx]?.label}</span>（{weekBuckets[peakIdx]?.count}件完了）</p>
                  </div>
                  {/* 凡例 */}
                  <div className="flex flex-wrap gap-3 mb-4">
                    {allCats.map(cat => (
                      <span key={cat} className="flex items-center gap-1 text-[10px] text-slate-600">
                        <span className="w-2.5 h-2.5 rounded-sm inline-block shrink-0" style={{ backgroundColor: CAT_COLORS[cat] ?? "#94a3b8" }} />
                        {cat}
                      </span>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {weekBuckets.map((w) => (
                      <div key={w.label} className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-400 tabular-nums w-12 shrink-0">{w.label}</span>
                        <div className="flex-1 h-5 bg-slate-50 rounded overflow-hidden flex">
                          {w.count === 0 ? null : allCats.map(cat => {
                            const c = w.catCounts[cat] ?? 0;
                            if (c === 0) return null;
                            const widthPct = (c / maxWeekCount) * 100;
                            return (
                              <div
                                key={cat}
                                className="h-full flex items-center justify-center"
                                style={{ width: `${widthPct}%`, backgroundColor: CAT_COLORS[cat] ?? "#94a3b8" }}
                                title={`${cat}: ${c}件`}
                              >
                                {c > 0 && <span className="text-[9px] text-white font-bold">{c}</span>}
                              </div>
                            );
                          })}
                        </div>
                        <span className="text-[11px] tabular-nums w-14 text-right shrink-0 flex items-center justify-end gap-1">
                          <span className="text-slate-400">{w.count}件</span>
                          {w.isPeak && <span className="text-[9px] text-amber-500 font-bold">Peak</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-3">
                    ピーク週に業務が集中しています。次回は前後の週に分散させることで負荷を軽減できます。
                  </p>
                </div>

              </div>
            );
          })()}

      </div>
    </AppShell>
  );
}
