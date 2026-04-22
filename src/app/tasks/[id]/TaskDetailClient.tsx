"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import type { User } from "@/lib/auth";

interface Task {
  id: number;
  title: string;
  category: string;
  status: string;
  due_date: string;
  started_at: string | null;
  completed_at: string | null;
  assignee_name: string;
  sub_assignee_id: number | null;
  sub_assignee_name: string | null;
  playbook_conditions: string;
  playbook_criteria: string;
  playbook_pitfalls: string;
  playbook_tip: string;
  memo: string;
}

interface Manual {
  id: number;
  category: string;
  title: string;
  content: string;
}

interface NextTask {
  id: number;
  title: string;
  category: string;
  due_date: string;
}

interface KianItem {
  id: number;
  title: string;
  due_timing: string | null;
  status: string;
  note: string | null;
}

interface Props {
  task: Task;
  user: User;
  manual: Manual | null;
  nextTask: NextTask | null;
  kians?: KianItem[];
}

/* ── SVG Icons ── */
function IconShield({ className }: { className?: string }) {
  return (
    <svg className={className ?? "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}
function IconKey({ className }: { className?: string }) {
  return (
    <svg className={className ?? "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
    </svg>
  );
}
function IconScale({ className }: { className?: string }) {
  return (
    <svg className={className ?? "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
    </svg>
  );
}
function IconLightBulb({ className }: { className?: string }) {
  return (
    <svg className={className ?? "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
    </svg>
  );
}
function IconBook({ className }: { className?: string }) {
  return (
    <svg className={className ?? "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  );
}
function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className ?? "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}
function IconCheckCircle({ className }: { className?: string }) {
  return (
    <svg className={className ?? "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold text-slate-800 mt-5 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-slate-900 mt-6 mb-3">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-slate-900 mt-6 mb-3">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>')
    .replace(
      /^- \[ \] (.+)$/gm,
      '<div class="flex items-center gap-2 py-1"><input type="checkbox" class="w-4 h-4 rounded" /><span class="text-slate-700 text-sm">$1</span></div>'
    )
    .replace(
      /^- \[x\] (.+)$/gm,
      '<div class="flex items-center gap-2 py-1"><input type="checkbox" checked class="w-4 h-4 rounded" /><span class="text-slate-500 text-sm line-through">$1</span></div>'
    )
    .replace(
      /^- (.+)$/gm,
      '<li class="text-slate-700 text-sm py-0.5 flex items-start gap-1.5"><span class="text-blue-400 mt-1 flex-shrink-0">&bull;</span><span>$1</span></li>'
    )
    .replace(/^\|(.+)\|$/gm, (match) => {
      const cells = match.split("|").filter((_, i, a) => i > 0 && i < a.length - 1);
      const isHeader = cells.every((c) => c.trim().match(/^[-\s]+$/));
      if (isHeader)
        return (
          "<tr class=\"border-b border-slate-200\">" +
          cells.map((c) => `<td class="px-3 py-1.5 text-xs text-slate-400">${c.trim()}</td>`).join("") +
          "</tr>"
        );
      return (
        "<tr class=\"border-b border-slate-100 hover:bg-slate-50\">" +
        cells.map((c, i) => `<td class="${i === 0 ? "font-medium text-slate-800" : "text-slate-600"} px-3 py-2 text-sm">${c.trim()}</td>`).join("") +
        "</tr>"
      );
    })
    .replace(
      /(<tr.*<\/tr>\n?)+/g,
      (match) => `<div class="overflow-x-auto my-3"><table class="w-full border-collapse border border-slate-200 rounded-xl overflow-hidden">${match}</table></div>`
    )
    .replace(/^---$/gm, '<hr class="border-slate-200 my-4">')
    .replace(/^(?!<)(.+)$/gm, '<p class="text-slate-700 text-sm leading-relaxed mb-2">$1</p>');
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

const statusOptions = ["未着手", "進行中", "確認待ち"];

const STATUS_CONFIG = {
  "未着手":   { dot: "bg-gray-400", btn: "bg-white text-gray-600 border-gray-200 hover:border-gray-300", active: "bg-gray-600 text-white border-gray-600 shadow-sm" },
  "進行中":   { dot: "bg-blue-500", btn: "bg-white text-blue-600 border-gray-200 hover:border-blue-300", active: "bg-blue-600 text-white border-blue-600 shadow-sm" },
  "確認待ち": { dot: "bg-yellow-500", btn: "bg-white text-yellow-700 border-gray-200 hover:border-yellow-300", active: "bg-yellow-500 text-white border-yellow-500 shadow-sm" },
  "完了":     { dot: "bg-emerald-500", btn: "bg-white text-emerald-700 border-gray-200 hover:border-emerald-300", active: "bg-emerald-600 text-white border-emerald-600 shadow-sm" },
} as const;

const SEVERITY_STYLE = {
  critical: { label: "要確認", bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
  warning:  { label: "注意",   bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-400" },
  caution:  { label: "参考",   bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200", dot: "bg-slate-400" },
};

type SeverityKey = keyof typeof SEVERITY_STYLE;

interface PitfallItem { text: string; severity: SeverityKey }
interface CriteriaItem { q: string; a: string }

function parsePitfalls(raw: string): PitfallItem[] {
  try {
    const parsed = JSON.parse(raw || "[]");
    if (Array.isArray(parsed)) {
      return parsed.map((item) => {
        if (typeof item === "string") return { text: item, severity: "warning" as SeverityKey };
        if (item && typeof item === "object" && "text" in item) return { text: item.text, severity: (item.severity ?? "warning") as SeverityKey };
        return { text: String(item), severity: "warning" as SeverityKey };
      });
    }
  } catch { /* ignore */ }
  return [];
}

function parseCriteria(raw: string): CriteriaItem[] {
  try {
    const parsed = JSON.parse(raw || "[]");
    if (Array.isArray(parsed)) {
      return parsed.map((item) => {
        if (typeof item === "string") return { q: item, a: "" };
        if (item && typeof item === "object" && "q" in item) return item as CriteriaItem;
        return { q: String(item), a: "" };
      });
    }
  } catch { /* ignore */ }
  return [];
}

export default function TaskDetailClient({ task, user, manual, nextTask, kians = [] }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(task.status);
  const [memo, setMemo] = useState(task.memo || "");
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedEffort, setSelectedEffort] = useState<string | null>(null);
  const [savingEffort, setSavingEffort] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [memoExpanded, setMemoExpanded] = useState(false);
  const [kianOpen, setKianOpen] = useState(true);
  const [conditionsOpen, setConditionsOpen] = useState(true);
  const [pitfallsOpen, setPitfallsOpen] = useState(false);
  const [criteriaOpen, setCriteriaOpen] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const [kianStatuses, setKianStatuses] = useState<Record<number, string>>(
    () => Object.fromEntries(kians.map(k => [k.id, k.status]))
  );

  const conditions: string[] = JSON.parse(task.playbook_conditions || "[]");

  const storageKey = `task-${task.id}-conditions`;
  const [checkedConditions, setCheckedConditions] = useState<boolean[]>(() => {
    if (typeof window === "undefined") return conditions.map(() => false);
    try {
      const s = localStorage.getItem(storageKey);
      if (s) {
        const parsed: boolean[] = JSON.parse(s);
        return conditions.map((_, i) => parsed[i] ?? false);
      }
    } catch { /* ignore */ }
    return conditions.map(() => false);
  });

  function toggleCondition(i: number) {
    setCheckedConditions(prev => {
      const next = prev.map((v, idx) => idx === i ? !v : v);
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }

  const checkedCount = checkedConditions.filter(Boolean).length;
  const allChecked = conditions.length > 0 && checkedCount === conditions.length;
  const criteria = parseCriteria(task.playbook_criteria);
  const pitfalls = parsePitfalls(task.playbook_pitfalls);

  const hasGuide = conditions.length > 0 || criteria.length > 0 || pitfalls.length > 0 || !!task.playbook_tip;

  async function updateStatus(newStatus: string) {
    setSaving(true);
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setStatus(newStatus);
    setSaving(false);
  }

  async function handleComplete() {
    setCompleting(true);
    await updateStatus("完了");
    setCompleting(false);
    setShowCompleteModal(true);
  }

  async function handleEffortSave() {
    setSavingEffort(true);
    if (selectedEffort) {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ effort_label: selectedEffort }),
      });
    }
    setSavingEffort(false);
    setShowCompleteModal(false);
    router.push(user.role === "manager" ? "/manager" : "/dashboard");
  }

  function handleModalClose() {
    setShowCompleteModal(false);
    router.push(user.role === "manager" ? "/manager" : "/dashboard");
  }

  async function saveMemo() {
    setSaving(true);
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memo }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <AppShell user={user}>

      {/* ━━━ 完了モーダル ━━━ */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 px-7 py-6 w-[420px] max-w-[92vw] flex flex-col gap-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <IconCheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-sm font-bold text-emerald-600">タスク完了</p>
              </div>
              <p className="text-[15px] font-bold text-gray-800 leading-snug">{task.title}</p>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">このタスクにかかった時間は？</p>
              <div className="grid grid-cols-2 gap-2">
                {["30分以内", "1〜2時間", "半日（3〜4時間）", "1日以上"].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setSelectedEffort(opt)}
                    className={`py-3 rounded-xl text-sm font-semibold border transition-all ${
                      selectedEffort === opt
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {nextTask && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <p className="text-[11px] text-gray-400 font-semibold mb-1">次のタスク</p>
                <Link
                  href={`/tasks/${nextTask.id}`}
                  onClick={() => setShowCompleteModal(false)}
                  className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline leading-snug"
                >
                  {nextTask.title}
                  <svg className="w-3 h-3 inline ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
                {nextTask.due_date && (
                  <p className="text-[10px] text-gray-400 mt-0.5">期限: {formatDate(nextTask.due_date)}</p>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleModalClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-500 border border-gray-200 hover:bg-gray-50 transition"
              >
                スキップ
              </button>
              <button
                onClick={handleEffortSave}
                disabled={!selectedEffort || savingEffort}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
              >
                {savingEffort ? "記録中..." : "記録して完了"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex min-w-0 overflow-hidden">

        {/* ━━━ Left: Task info panel ━━━ */}
        <div className="w-[240px] lg:w-[300px] shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
          {/* Back + Title */}
          <div className="px-5 pt-4 pb-3 border-b border-gray-100">
            <Link
              href={user.role === "manager" ? "/manager" : "/dashboard"}
              className="inline-flex items-center gap-1 text-gray-400 hover:text-gray-600 text-xs mb-3 transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              戻る
            </Link>
            <h2 className="text-[15px] font-bold text-gray-900 leading-snug">{task.title}</h2>
          </div>

          <div className="px-5 py-4 space-y-5 flex-1">
            {/* Meta info */}
            <div className="space-y-2.5">
              {[
                { icon: <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>, label: task.category },
                task.due_date ? { icon: <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>, label: `期限: ${formatDate(task.due_date)}` } : null,
                task.started_at ? { icon: <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></svg>, label: `着手: ${formatDate(task.started_at)}` } : null,
                task.completed_at ? { icon: <IconCheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-500" />, label: `完了: ${formatDate(task.completed_at)}`, color: "text-emerald-600" } : null,
              ].filter(Boolean).map((item, i) => (
                <div key={i} className={`flex items-center gap-2.5 text-xs ${(item as { color?: string }).color ?? "text-gray-500"}`}>
                  <span className="text-gray-400">{(item as { icon: React.ReactNode }).icon}</span>
                  <span>{(item as { label: string }).label}</span>
                </div>
              ))}
            </div>

            {/* 担当者 */}
            <div className="space-y-2">
              <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">担当者</p>
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                  {task.assignee_name?.charAt(0) ?? "?"}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800">{task.assignee_name}</p>
                  <p className="text-[10px] text-gray-400">メイン担当</p>
                </div>
              </div>
              {task.sub_assignee_name && (
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-orange-400 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                    {task.sub_assignee_name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{task.sub_assignee_name}</p>
                    <p className="text-[10px] text-gray-400">サブ担当</p>
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100" />

            {/* Status selector */}
            <div>
              <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-2">ステータス</p>
              <div className="grid grid-cols-3 gap-1.5">
                {statusOptions.map((s) => {
                  const cfg = STATUS_CONFIG[s as keyof typeof STATUS_CONFIG];
                  const isActive = status === s;
                  return (
                    <button
                      key={s}
                      onClick={() => updateStatus(s)}
                      disabled={saving || status === "完了"}
                      className={`px-2 py-2 rounded-lg text-[11px] font-semibold border transition-all ${
                        isActive ? cfg.active : cfg.btn
                      } disabled:opacity-50`}
                    >
                      <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${cfg.dot}`} />
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Complete button */}
            {status !== "完了" ? (
              <button
                onClick={handleComplete}
                disabled={completing}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-400 text-white font-bold py-3.5 rounded-xl text-sm transition active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm"
              >
                {completing ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    完了処理中...
                  </>
                ) : (
                  <>
                    <IconCheck className="w-4 h-4" />
                    このタスクを完了にする
                  </>
                )}
              </button>
            ) : (
              <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2">
                <IconCheckCircle className="w-4 h-4" />
                完了済み
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-gray-100" />

            {/* Memo */}
            <div>
              <button
                onClick={() => setMemoExpanded(v => !v)}
                className="flex items-center justify-between w-full text-left group"
              >
                <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider group-hover:text-gray-500 transition">メモ・引き継ぎ</p>
                <svg className={`w-3.5 h-3.5 text-gray-300 transition-transform ${memoExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {memoExpanded && (
                <div className="mt-2 space-y-2">
                  <textarea
                    value={memo}
                    onChange={e => setMemo(e.target.value)}
                    placeholder="次の担当者への引き継ぎメモ..."
                    rows={4}
                    className="w-full rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder-gray-300 border border-gray-200 bg-gray-50/50 resize-none transition focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white"
                  />
                  <div className="flex items-center justify-end gap-2">
                    {saved && <span className="text-[11px] text-emerald-500 font-medium">保存しました</span>}
                    <button
                      onClick={saveMemo}
                      disabled={saving}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition"
                    >
                      {saving ? "保存中..." : "保存"}
                    </button>
                  </div>
                </div>
              )}
              {!memoExpanded && memo && (
                <p className="text-[11px] text-gray-400 mt-1 truncate">{memo}</p>
              )}
            </div>
          </div>
        </div>

        {/* ━━━ Right: UniGuide panel ━━━ */}
        <div className="flex-1 min-w-0 overflow-y-auto" style={{ backgroundColor: "#f8fafc" }}>
          <div className="px-6 py-5">

            {/* UniGuide header */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                <IconBook className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-blue-600 tracking-widest">UNIGUIDE</p>
                <p className="text-sm font-bold text-gray-900 leading-snug">{task.title}</p>
              </div>
            </div>

            {/* 関連起案（トップ表示） */}
            {kians.length > 0 && (
              <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4">
                <button
                  onClick={() => setKianOpen(v => !v)}
                  className="flex items-center gap-2.5 px-5 py-3 border-b border-gray-100 bg-gray-50/50 w-full text-left hover:bg-gray-50 transition"
                >
                  <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform shrink-0 ${kianOpen ? "" : "-rotate-90"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-bold text-gray-800">関連起案</h4>
                  <span className="ml-auto text-[11px] font-bold text-gray-400">{kians.length}件</span>
                </button>
                {kianOpen && <div className="divide-y divide-gray-50">
                  {kians.map(k => {
                    const currentStatus = kianStatuses[k.id] ?? k.status;

                    async function updateKianStatus(newStatus: string) {
                      setKianStatuses(prev => ({ ...prev, [k.id]: newStatus }));
                      await fetch(`/api/kians/${k.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: newStatus }),
                      });
                    }

                    const KIAN_STATUSES = [
                      { value: "未着手", dot: "bg-gray-400", active: "bg-gray-600 text-white border-gray-600", inactive: "bg-white text-gray-500 border-gray-200 hover:border-gray-300" },
                      { value: "起案済", dot: "bg-blue-500", active: "bg-blue-600 text-white border-blue-600", inactive: "bg-white text-blue-600 border-gray-200 hover:border-blue-300" },
                      { value: "決裁済", dot: "bg-emerald-500", active: "bg-emerald-600 text-white border-emerald-600", inactive: "bg-white text-emerald-600 border-gray-200 hover:border-emerald-300" },
                    ];

                    return (
                      <div key={k.id} className="px-5 py-3">
                        <div className="flex items-center gap-3 mb-2">
                          <p className={`text-sm font-medium flex-1 ${currentStatus === "決裁済" ? "text-gray-400 line-through" : "text-gray-800"}`}>{k.title}</p>
                          {k.due_timing && (
                            <span className={`text-[11px] font-medium shrink-0 px-2 py-0.5 rounded-lg ${
                              currentStatus === "決裁済" ? "bg-gray-50 text-gray-400" : "bg-orange-50 text-orange-600 border border-orange-100"
                            }`}>{k.due_timing}</span>
                          )}
                        </div>
                        {k.note && <p className="text-[11px] text-gray-400 mb-2">{k.note}</p>}
                        <div className="flex gap-1.5">
                          {KIAN_STATUSES.map(s => (
                            <button
                              key={s.value}
                              onClick={() => updateKianStatus(s.value)}
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                                currentStatus === s.value ? s.active : s.inactive
                              }`}
                            >
                              <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${currentStatus === s.value ? "bg-white" : s.dot}`} />
                              {s.value}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>}
              </section>
            )}

            {hasGuide ? (
              <div className="space-y-4">

                {/* 1. 着手条件（最上位・デフォルト開） */}
                {conditions.length > 0 && (
                  <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <button
                      onClick={() => setConditionsOpen(v => !v)}
                      className="flex items-center gap-2.5 px-5 py-3 border-b border-gray-100 bg-gray-50/50 w-full text-left hover:bg-gray-50 transition"
                    >
                      <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform shrink-0 ${conditionsOpen ? "" : "-rotate-90"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${allChecked ? "bg-emerald-100" : "bg-orange-100"}`}>
                        {allChecked
                          ? <IconCheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          : <IconKey className="w-3.5 h-3.5 text-orange-600" />
                        }
                      </div>
                      <h4 className="text-sm font-bold text-gray-800">着手条件</h4>
                      <span className="text-[11px] text-gray-400">着手前に必ず確認</span>
                      <span className={`text-[11px] font-bold ml-auto px-2 py-0.5 rounded-full ${
                        allChecked
                          ? "bg-emerald-100 text-emerald-700"
                          : checkedCount > 0
                          ? "bg-orange-100 text-orange-700"
                          : "bg-gray-100 text-gray-400"
                      }`}>
                        {checkedCount}/{conditions.length}
                      </span>
                    </button>
                    {conditionsOpen && (
                      <>
                        <div className="p-3 space-y-1">
                          {conditions.map((c, i) => {
                            const checked = checkedConditions[i] ?? false;
                            return (
                              <button
                                key={i}
                                onClick={() => toggleCondition(i)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                                  checked
                                    ? "bg-emerald-50/70"
                                    : "hover:bg-gray-50"
                                }`}
                              >
                                <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center transition-all border ${
                                  checked
                                    ? "bg-emerald-500 border-emerald-500"
                                    : "bg-white border-gray-300"
                                }`}>
                                  {checked && (
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                                <span className={`text-sm transition-colors ${checked ? "text-gray-400 line-through" : "text-gray-700"}`}>
                                  {c}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        {allChecked && (
                          <div className="px-5 pb-3">
                            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-50 rounded-lg px-3 py-2">
                              <IconCheckCircle className="w-3.5 h-3.5" />
                              すべての着手条件を確認しました
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </section>
                )}

                {/* 2. チェックポイント（デフォルト閉） */}
                {pitfalls.length > 0 && (
                  <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <button
                      onClick={() => setPitfallsOpen(v => !v)}
                      className="flex items-center gap-2.5 px-5 py-3 border-b border-gray-100 bg-gray-50/50 w-full text-left hover:bg-gray-50 transition"
                    >
                      <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform shrink-0 ${pitfallsOpen ? "" : "-rotate-90"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center">
                        <IconShield className="w-3.5 h-3.5 text-red-600" />
                      </div>
                      <h4 className="text-sm font-bold text-gray-800">チェックポイント</h4>
                      <span className="text-[11px] text-gray-400">よくある失敗・見落とし</span>
                      <span className="ml-auto text-[11px] font-bold text-gray-400">{pitfalls.length}件</span>
                    </button>
                    {pitfallsOpen && (
                      <div className="divide-y divide-gray-50">
                        {pitfalls.map((p, i) => {
                          const sev = SEVERITY_STYLE[p.severity] ?? SEVERITY_STYLE.warning;
                          return (
                            <div key={i} className="flex items-start gap-3 px-5 py-3.5">
                              <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${sev.dot}`} />
                              <div className="flex-1 min-w-0">
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${sev.text}`}>{sev.label}</span>
                                <p className="text-sm text-gray-700 leading-relaxed mt-0.5">{p.text}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                )}

                {/* 3. 判断ガイド（デフォルト閉） */}
                {criteria.length > 0 && (
                  <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <button
                      onClick={() => setCriteriaOpen(v => !v)}
                      className="flex items-center gap-2.5 px-5 py-3 border-b border-gray-100 bg-gray-50/50 w-full text-left hover:bg-gray-50 transition"
                    >
                      <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform shrink-0 ${criteriaOpen ? "" : "-rotate-90"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
                        <IconScale className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <h4 className="text-sm font-bold text-gray-800">判断ガイド</h4>
                      <span className="text-[11px] text-gray-400">迷ったときの判断基準</span>
                      <span className="ml-auto text-[11px] font-bold text-gray-400">{criteria.length}件</span>
                    </button>
                    {criteriaOpen && (
                      <div className="p-4">
                        <div className={`grid gap-3 ${criteria.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                          {criteria.map((c, i) => (
                            <div key={i} className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                              <p className="text-sm font-semibold text-blue-600 mb-1.5">Q. {c.q}</p>
                              {c.a && <p className="text-sm text-gray-600 leading-relaxed">{c.a}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {/* 4. ひとことポイント（デフォルト閉） */}
                {task.playbook_tip && (
                  <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <button
                      onClick={() => setTipOpen(v => !v)}
                      className="flex items-center gap-2.5 px-5 py-3 border-b border-gray-100 bg-gray-50/50 w-full text-left hover:bg-gray-50 transition"
                    >
                      <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform shrink-0 ${tipOpen ? "" : "-rotate-90"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
                        <IconLightBulb className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <h4 className="text-sm font-bold text-gray-800">ひとことポイント</h4>
                    </button>
                    {tipOpen && (
                      <div className="px-5 py-4">
                        <p className="text-sm text-gray-700 leading-relaxed">{task.playbook_tip}</p>
                      </div>
                    )}
                  </section>
                )}

                {/* 5. 内部マニュアル */}
                {manual ? (
                  <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <button
                      onClick={() => setManualOpen(v => !v)}
                      className="flex items-center justify-between w-full px-5 py-3.5 hover:bg-gray-50 transition group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center">
                          <IconBook className="w-3.5 h-3.5 text-gray-500" />
                        </div>
                        <div className="text-left">
                          <span className="text-sm font-semibold text-gray-700">内部マニュアル</span>
                          <span className="text-[11px] text-blue-600 ml-2">{manual.title}</span>
                        </div>
                      </div>
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${manualOpen ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {manualOpen && (
                      <div className="border-t border-gray-100 px-5 py-4">
                        <div
                          className="space-y-1"
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(manual.content) }}
                        />
                        <div className="mt-4 pt-3 border-t border-gray-100">
                          <Link href="/manuals" className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-medium">
                            マニュアル一覧を見る
                            <svg className="w-3 h-3 inline ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                          </Link>
                        </div>
                      </div>
                    )}
                  </section>
                ) : (
                  <Link
                    href="/manuals"
                    className="flex items-center justify-between w-full bg-white hover:bg-gray-50 border border-gray-200 rounded-xl px-5 py-3.5 transition group shadow-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center">
                        <IconBook className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                      <span className="text-sm font-semibold text-gray-700">内部マニュアルを見る</span>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
              </div>
            ) : (
              <div className="text-center py-20 text-gray-400">
                <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <IconBook className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-500 mb-1">業務ガイド未登録</p>
                <p className="text-xs text-gray-400">このタスクのガイドはまだ登録されていません</p>
                <Link
                  href="/manuals"
                  className="inline-flex items-center gap-1 mt-4 text-blue-600 text-xs font-medium hover:text-blue-700 hover:underline"
                >
                  マニュアル一覧を見る
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
