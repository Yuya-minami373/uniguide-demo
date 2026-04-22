"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import type { User } from "@/lib/auth";

interface Manual {
  id: number;
  category: string;
  title: string;
  content: string;
}

interface Props {
  session: User;
  manuals: Manual[];
}

// Simple markdown renderer
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
      '<li class="text-slate-700 text-sm py-0.5 flex items-start gap-1.5"><span class="text-orange-400 mt-1 flex-shrink-0">•</span><span>$1</span></li>'
    )
    .replace(/^\|(.+)\|$/gm, (match) => {
      const cells = match.split("|").filter((_, i, a) => i > 0 && i < a.length - 1);
      const isHeader = cells.every((c) => c.trim().match(/^[-\s]+$/));
      if (isHeader)
        return (
          "<tr class=\"border-b border-slate-200\">" +
          cells
            .map((c) => `<td class="px-3 py-1.5 text-xs text-slate-400">${c.trim()}</td>`)
            .join("") +
          "</tr>"
        );
      return (
        "<tr class=\"border-b border-slate-100 hover:bg-slate-50\">" +
        cells
          .map(
            (c, i) =>
              `<td class="${i === 0 ? "font-medium text-slate-800" : "text-slate-600"} px-3 py-2 text-sm">${c.trim()}</td>`
          )
          .join("") +
        "</tr>"
      );
    })
    .replace(
      /(<tr.*<\/tr>\n?)+/g,
      (match) =>
        `<div class="overflow-x-auto my-3"><table class="w-full border-collapse border border-slate-200 rounded-xl overflow-hidden">${match}</table></div>`
    )
    .replace(/^---$/gm, '<hr class="border-slate-200 my-4">')
    .replace(/^(?!<)(.+)$/gm, '<p class="text-slate-700 text-sm leading-relaxed mb-2">$1</p>');
}

export default function ManualsClient({ session, manuals }: Props) {
  const [selectedManual, setSelectedManual] = useState<Manual | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const categories: Record<string, Manual[]> = {};
  manuals.forEach((m) => {
    if (!categories[m.category]) categories[m.category] = [];
    categories[m.category].push(m);
  });

  if (selectedManual) {
    return (
      <AppShell user={session}>
        <div className="flex-1 overflow-y-auto" style={{ backgroundColor: "#f0f5ff" }}>
          <div className="px-4 md:px-6 py-5 max-w-[800px]">
            <button
              onClick={() => setSelectedManual(null)}
              className="inline-flex items-center gap-1 text-gray-400 hover:text-gray-600 text-xs mb-4 transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              マニュアル一覧へ
            </button>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-5 py-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-orange-400 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                    {selectedManual.category}
                  </span>
                </div>
                <h1 className="text-white font-bold text-lg leading-snug">{selectedManual.title}</h1>
              </div>
              <div className="p-5">
                <div
                  className="prose-custom space-y-1"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedManual.content) }}
                />
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell user={session}>
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: "#f0f5ff" }}>
        <div className="px-6 py-5">
          <div className="mb-5">
            <h1 className="text-xl font-bold text-gray-900">内部マニュアル</h1>
            <p className="text-gray-500 text-sm mt-0.5">{manuals.length}件のマニュアル</p>
          </div>

          {Object.entries(categories).map(([category, categoryManuals]) => (
            <div
              key={category}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-4"
            >
              <button
                onClick={() =>
                  setExpandedCategory(expandedCategory === category ? null : category)
                }
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-800">{category}</p>
                    <p className="text-xs text-gray-500">{categoryManuals.length}件のマニュアル</p>
                  </div>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    expandedCategory === category ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expandedCategory === category && (
                <div className="border-t border-gray-100 divide-y divide-gray-50">
                  {categoryManuals.map((manual) => (
                    <button
                      key={manual.id}
                      onClick={() => setSelectedManual(manual)}
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-orange-50 transition text-left"
                      style={{ minHeight: 56 }}
                    >
                      <div className="flex items-center gap-3">
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <span className="font-medium text-gray-800 text-sm">{manual.title}</span>
                      </div>
                      <svg
                        className="w-4 h-4 text-orange-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {manuals.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <p>マニュアルはありません</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
