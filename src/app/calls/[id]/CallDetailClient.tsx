"use client";

import { useState } from "react";
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
  category: CallCategory;
}

const DURATION_OPTIONS = [
  { label: "5分以内", value: "5分以内", icon: "⚡" },
  { label: "15分以内", value: "15分以内", icon: "🕐" },
  { label: "30分以内", value: "30分以内", icon: "🕕" },
  { label: "1時間以上", value: "1時間以上", icon: "⏳" },
];

const SUB_CATEGORIES = [
  "期日前投票", "投票所管理", "選挙公報", "開票", "ポスター掲示場", "入場整理券", "その他",
];

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="text-slate-800 font-semibold">{part.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim().startsWith("|") && lines[i + 1]?.trim().startsWith("|---")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      const headers = tableLines[0].split("|").filter(c => c.trim() !== "");
      const rows = tableLines.slice(2).map(row => row.split("|").filter(c => c.trim() !== ""));
      elements.push(
        <div key={`table-${i}`} className="overflow-x-auto my-3">
          <table className="w-full text-sm border-collapse rounded-xl overflow-hidden shadow-sm">
            <thead>
              <tr className="bg-blue-600">
                {headers.map((h, idx) => (
                  <th key={idx} className="px-3 py-2 text-left text-white font-semibold text-xs whitespace-nowrap">
                    {h.trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ridx) => (
                <tr key={ridx} className={ridx % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                  {row.map((cell, cidx) => (
                    <td key={cidx} className="border-b border-slate-100 px-3 py-2 text-slate-700 text-sm">
                      {cell.trim()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    if (line.startsWith("## ")) {
      elements.push(<h2 key={`h2-${i}`} className="text-sm font-bold text-slate-800 mt-5 mb-2 pb-1 border-b border-slate-200">{line.slice(3)}</h2>);
      i++; continue;
    }
    if (line.startsWith("### ")) {
      elements.push(<h3 key={`h3-${i}`} className="text-xs font-bold text-slate-700 mt-3 mb-1">{line.slice(4)}</h3>);
      i++; continue;
    }
    if (line.startsWith("**") && line.endsWith("**") && line.length > 4) {
      elements.push(<p key={`bold-${i}`} className="text-sm font-bold text-slate-800 mt-4 mb-1">{line.slice(2, -2)}</p>);
      i++; continue;
    }
    if (line.trim().startsWith("- ")) {
      elements.push(
        <div key={`li-${i}`} className="flex gap-2 text-sm text-slate-700 py-0.5">
          <span className="text-blue-400 mt-1 shrink-0">•</span>
          <span>{renderInline(line.trim().slice(2))}</span>
        </div>
      );
      i++; continue;
    }
    if (/^[①②③④⑤↓├└]/.test(line.trim()) || line.trim().startsWith("↓")) {
      elements.push(<p key={`flow-${i}`} className="text-sm text-slate-700 font-mono py-0.5 pl-2">{line}</p>);
      i++; continue;
    }
    if (line.trim() === "") {
      elements.push(<div key={`br-${i}`} className="h-2" />);
      i++; continue;
    }
    elements.push(<p key={`p-${i}`} className="text-sm text-slate-700 py-0.5">{renderInline(line)}</p>);
    i++;
  }

  return <>{elements}</>;
}

export default function CallDetailClient({ user, category }: Props) {
  const router = useRouter();
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [showSubCategory, setShowSubCategory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const isOther = category.name === "その他";

  async function handleDurationSelect(duration: string) {
    if (submitting) return;

    if (isOther && !selectedSubCategory && !showSubCategory) {
      setShowSubCategory(true);
      return;
    }

    setSubmitting(true);
    try {
      await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_id: category.id,
          sub_category: selectedSubCategory ?? undefined,
          duration,
        }),
      });
      setDone(true);
      setTimeout(() => router.push("/calls"), 1500);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <AppShell user={user} demoMode={false}>
        <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: "#f0f5ff" }}>
          <div className="text-center">
            <div className="text-5xl mb-4">✅</div>
            <p className="text-lg font-bold text-slate-800">記録しました</p>
            <p className="text-sm text-slate-500 mt-1">受電記録一覧に戻ります</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell user={user} demoMode={false}>
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: "#f0f5ff" }}>

        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => router.push("/calls")}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition"
          >
            ← 戻る
          </button>
          <span className="text-slate-300">|</span>
          <h1 className="text-base font-bold text-slate-800">{category.name}</h1>
        </div>

        <div className="px-4 py-4 flex flex-col lg:flex-row gap-4 h-full">

          {/* Left: Manual */}
          <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-5 overflow-y-auto">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">一次対応マニュアル</h2>
            {category.manual ? (
              <div>{renderMarkdown(category.manual)}</div>
            ) : (
              <p className="text-sm text-slate-400">マニュアルなし</p>
            )}
          </div>

          {/* Right: Sub category + Duration */}
          <div className="w-full lg:w-72 shrink-0 flex flex-col gap-4">

          {/* Sub category（その他のみ） */}
          {isOther && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">関連業務カテゴリ</h2>
              <div className="grid grid-cols-2 gap-2">
                {SUB_CATEGORIES.map(sub => (
                  <button
                    key={sub}
                    onClick={() => setSelectedSubCategory(sub === selectedSubCategory ? null : sub)}
                    className={`flex items-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium border-2 transition-all ${
                      selectedSubCategory === sub
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-white border-slate-200 text-slate-700 hover:border-blue-300"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${selectedSubCategory === sub ? "bg-white" : "bg-blue-400"}`} />
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Duration */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">対応時間を記録する</h2>
            {isOther && !selectedSubCategory && (
              <p className="text-xs text-amber-600 mb-3">※ 関連業務カテゴリを選択するとより詳細に記録できます</p>
            )}
            <div className="grid grid-cols-2 gap-2">
              {DURATION_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => void handleDurationSelect(opt.value)}
                  disabled={submitting}
                  className="flex flex-col items-center justify-center gap-2 bg-slate-50 hover:bg-blue-600 hover:text-white border-2 border-slate-200 hover:border-blue-600 disabled:opacity-50 text-slate-700 font-bold py-4 rounded-xl text-sm transition-all hover:scale-[1.02] active:scale-[0.97]"
                >
                  <span className="text-2xl">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          </div>{/* end right column */}
        </div>
      </div>
    </AppShell>
  );
}
