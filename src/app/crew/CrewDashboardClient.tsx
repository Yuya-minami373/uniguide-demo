"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import type { User } from "@/lib/auth";

// ━━━ Types ━━━

interface LocationOverview {
  id: number;
  name: string;
  short_name: string;
  address: string;
  lat: number;
  lng: number;
  open_time: string;
  close_time: string;
  latest_report: {
    time_slot: string;
    voter_count: number;
    congestion_status: string;
    operation_status: string;
    note: string | null;
    reported_at: string;
  } | null;
  total_voters: number;
  incidents: {
    time_slot: string;
    operation_status: string;
    note: string | null;
  }[];
}

interface HourlyReport {
  id: number;
  crew_location_id: number;
  report_date: string;
  time_slot: string;
  voter_count: number;
  congestion_status: string;
  operation_status: string;
  note: string | null;
  note_tag: string | null;
}

interface DailyReport {
  id: number;
  crew_location_id: number;
  report_date: string;
  total_voters: number;
  summary: string | null;
  handover: string | null;
  uploaded_at: string;
  location_name: string;
  short_name: string;
}

interface Classification {
  id: number;
  category: string;
  title: string;
  description: string | null;
  sort_order: number;
}

// ━━━ Badge Components ━━━

const CONGESTION_CONFIG: Record<string, { label: string; className: string; dot: string }> = {
  "空いている": { label: "空いている", className: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500" },
  "やや混雑":   { label: "やや混雑",   className: "bg-yellow-50 text-yellow-700 border-yellow-200", dot: "bg-yellow-500" },
  "混雑":       { label: "混雑",       className: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
};

const OPERATION_CONFIG: Record<string, { label: string; className: string; dot: string }> = {
  "異常なし":     { label: "異常なし",     className: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500" },
  "対応事案あり": { label: "対応事案あり", className: "bg-yellow-50 text-yellow-700 border-yellow-200", dot: "bg-yellow-500" },
  "解決済":       { label: "解決済",       className: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
};

function CongestionBadge({ status }: { status: string }) {
  const config = CONGESTION_CONFIG[status] ?? { label: status, className: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border text-xs font-medium px-2.5 py-0.5 ${config.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

function OperationBadge({ status }: { status: string }) {
  const config = OPERATION_CONFIG[status] ?? { label: status, className: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border text-xs font-medium px-2.5 py-0.5 ${config.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

// ━━━ Classification category config ━━━

const CATEGORY_CONFIG: Record<string, { label: string; sublabel: string; color: string; bg: string; border: string }> = {
  A: { label: "選管判断", sublabel: "選管の指示・承認が必要", color: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
  B: { label: "報告対応", sublabel: "クルーが対応し1時間ごとに報告", color: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-200" },
  C: { label: "クルー対応", sublabel: "クルーが自律的に完結", color: "text-green-700", bg: "bg-green-50", border: "border-green-200" },
};

// ━━━ Main Component ━━━

interface Props {
  session: User;
  demoMode?: boolean;
}

export default function CrewDashboardClient({ session, demoMode = false }: Props) {
  const [activeTab, setActiveTab] = useState<"status" | "daily" | "classification">("status");
  const [date, setDate] = useState("2026-07-06"); // Demo default date
  const [overview, setOverview] = useState<LocationOverview[]>([]);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [hourlyDetail, setHourlyDetail] = useState<HourlyReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch overview data
  useEffect(() => {
    setLoading(true);
    fetch(`/api/crew/overview?date=${date}`)
      .then(r => r.json())
      .then(data => { setOverview(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [date]);

  // Fetch daily reports when tab switches
  useEffect(() => {
    if (activeTab === "daily") {
      fetch(`/api/crew/daily?date=${date}`)
        .then(r => r.json())
        .then(data => setDailyReports(Array.isArray(data) ? data : []));
    }
  }, [activeTab, date]);

  // Fetch classifications once
  useEffect(() => {
    if (activeTab === "classification" && classifications.length === 0) {
      fetch("/api/crew/classifications")
        .then(r => r.json())
        .then(data => setClassifications(data));
    }
  }, [activeTab, classifications.length]);

  // Fetch hourly detail when a location is selected
  useEffect(() => {
    if (selectedLocationId !== null) {
      fetch(`/api/crew/hourly?location_id=${selectedLocationId}&date=${date}`)
        .then(r => r.json())
        .then(data => setHourlyDetail(data));
    }
  }, [selectedLocationId, date]);

  // Summary stats
  const totalVoters = overview.reduce((sum, loc) => sum + loc.total_voters, 0);
  const activeLocations = overview.filter(loc => loc.latest_report).length;
  const totalIncidents = overview.reduce((sum, loc) => sum + loc.incidents.length, 0);

  const tabs = [
    { key: "status" as const, label: "投票所ステータス" },
    { key: "daily" as const, label: "日次レポート" },
    { key: "classification" as const, label: "業務分類" },
  ];

  return (
    <AppShell user={session} demoMode={demoMode}>
      <div className="flex-1 overflow-y-auto">
        {/* Header (sticky) */}
        <div className="sticky top-0 z-20 px-8 pt-6 pb-0 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">UniPollクルー</h1>
              <p className="text-sm text-gray-500 mt-0.5">期日前投票所の稼働状況・報告管理</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">日付</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === tab.key
                    ? "bg-white text-blue-600 border border-b-0 border-gray-200 -mb-px relative z-10"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-8 py-6">
          {activeTab === "status" && (
            <StatusTab
              overview={overview}
              loading={loading}
              totalVoters={totalVoters}
              activeLocations={activeLocations}
              totalIncidents={totalIncidents}
              selectedLocationId={selectedLocationId}
              onSelectLocation={setSelectedLocationId}
              hourlyDetail={hourlyDetail}
            />
          )}
          {activeTab === "daily" && (
            <DailyTab dailyReports={dailyReports} date={date} />
          )}
          {activeTab === "classification" && (
            <ClassificationTab classifications={classifications} />
          )}
        </div>
      </div>
    </AppShell>
  );
}

// ━━━ Tab 1: 投票所ステータス ━━━

function StatusTab({
  overview,
  loading,
  totalVoters,
  activeLocations,
  totalIncidents,
  selectedLocationId,
  onSelectLocation,
  hourlyDetail,
}: {
  overview: LocationOverview[];
  loading: boolean;
  totalVoters: number;
  activeLocations: number;
  totalIncidents: number;
  selectedLocationId: number | null;
  onSelectLocation: (id: number | null) => void;
  hourlyDetail: HourlyReport[];
}) {
  // All incidents across all locations for the right column
  const allIncidents = overview
    .flatMap(loc => loc.incidents.map(inc => ({ ...inc, locationName: loc.short_name })))
    .sort((a, b) => b.time_slot.localeCompare(a.time_slot));

  return (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <p className="text-[11px] text-gray-400 font-medium mb-1">稼働中投票所</p>
          <p className="text-2xl font-bold text-gray-900 tabular-nums">{activeLocations}<span className="text-sm text-gray-400 ml-1">/ {overview.length}</span></p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <p className="text-[11px] text-gray-400 font-medium mb-1">本日累計投票者数</p>
          <p className="text-2xl font-bold text-gray-900 tabular-nums">{totalVoters.toLocaleString()}<span className="text-sm text-gray-400 ml-1">名</span></p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
          <p className="text-[11px] text-gray-400 font-medium mb-1">対応事案</p>
          <p className="text-2xl font-bold text-gray-900 tabular-nums">{totalIncidents}<span className="text-sm text-gray-400 ml-1">件</span></p>
        </div>
      </div>

      {/* Two-column layout (equal width) */}
      <div className="grid grid-cols-2 gap-6" style={{ minHeight: "calc(100vh - 340px)" }}>
        {/* Left: Location Status List */}
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-gray-700 mb-3">投票所一覧</h2>
          {loading ? (
            <div className="text-sm text-gray-400 py-8 text-center">読み込み中...</div>
          ) : (
            overview.map(loc => {
              const latestCount = loc.latest_report?.voter_count ?? 0;
              return (
                <button
                  key={loc.id}
                  onClick={() => onSelectLocation(selectedLocationId === loc.id ? null : loc.id)}
                  className={`w-full text-left bg-white rounded-xl border px-4 py-3 transition-all ${
                    selectedLocationId === loc.id
                      ? "border-blue-300 ring-2 ring-blue-100"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {/* Row 1: Name + Badges */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-800">{loc.short_name}</span>
                      {loc.latest_report ? (
                        <>
                          <CongestionBadge status={loc.latest_report.congestion_status} />
                          <OperationBadge status={loc.latest_report.operation_status} />
                        </>
                      ) : (
                        <span className="text-[10px] text-gray-400">報告なし</span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400">{loc.open_time}〜{loc.close_time}</span>
                  </div>

                  {/* Row 2: Stats */}
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-3">
                      <div>
                        <span className="text-[10px] text-gray-400 mr-1">累計</span>
                        <span className="text-lg font-bold text-gray-900 tabular-nums">{loc.total_voters.toLocaleString()}</span>
                        <span className="text-[10px] text-gray-400 ml-0.5">名</span>
                      </div>
                      {loc.latest_report && (
                        <div>
                          <span className="text-[10px] text-gray-400 mr-1">直近</span>
                          <span className="text-sm font-semibold text-blue-600 tabular-nums">{latestCount}</span>
                          <span className="text-[10px] text-gray-400 ml-0.5">名</span>
                        </div>
                      )}
                    </div>
                    {loc.latest_report && (
                      <span className="text-[10px] text-gray-400">最終 {loc.latest_report.time_slot}</span>
                    )}
                  </div>

                  {/* Hourly detail expansion */}
                  {selectedLocationId === loc.id && hourlyDetail.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100" onClick={e => e.stopPropagation()}>
                      <p className="text-[11px] font-bold text-gray-500 mb-2">時間帯別詳細</p>
                      <div className="space-y-1">
                        {hourlyDetail.map(hr => (
                          <div key={hr.id} className="flex items-center gap-2 text-xs">
                            <span className="text-gray-500 tabular-nums w-20 shrink-0">{hr.time_slot}</span>
                            <span className="tabular-nums w-10 text-right font-medium text-gray-700">{hr.voter_count}名</span>
                            <CongestionBadge status={hr.congestion_status} />
                            <OperationBadge status={hr.operation_status} />
                            {hr.note && (
                              <span className="text-gray-400 truncate flex-1" title={hr.note}>{hr.note}</span>
                            )}
                          </div>
                        ))}
                      </div>
                      {/* Simple bar chart */}
                      <div className="mt-3">
                        <p className="text-[11px] font-bold text-gray-500 mb-2">投票者数推移</p>
                        <div className="flex items-end gap-1 h-16">
                          {hourlyDetail.map(hr => {
                            const max = Math.max(...hourlyDetail.map(h => h.voter_count), 1);
                            const heightPct = (hr.voter_count / max) * 100;
                            const barColor = hr.congestion_status === "混雑" ? "bg-red-400" : hr.congestion_status === "やや混雑" ? "bg-yellow-400" : "bg-blue-400";
                            return (
                              <div key={hr.id} className="flex-1 flex flex-col items-center gap-0.5">
                                <span className="text-[9px] text-gray-400 tabular-nums">{hr.voter_count}</span>
                                <div
                                  className={`w-full rounded-t ${barColor}`}
                                  style={{ height: `${heightPct}%`, minHeight: 2 }}
                                />
                                <span className="text-[8px] text-gray-400 tabular-nums whitespace-nowrap">{hr.time_slot.split("-")[0]}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Right: Incident History */}
        <div>
          <h2 className="text-sm font-bold text-gray-700 mb-3">対応履歴</h2>
          <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 h-full">
            {allIncidents.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">本日の対応事案はありません</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {allIncidents.map((inc, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-2 h-2 rounded-full mt-1.5 ${
                        inc.operation_status === "解決済" ? "bg-blue-500" : "bg-yellow-500"
                      }`} />
                      {i < allIncidents.length - 1 && <div className="w-px flex-1 bg-gray-100 mt-1" />}
                    </div>
                    <div className="flex-1 pb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-700">{inc.locationName}</span>
                        <span className="text-[10px] text-gray-400 tabular-nums">{inc.time_slot}</span>
                        <OperationBadge status={inc.operation_status} />
                      </div>
                      {inc.note && (
                        <p className="text-xs text-gray-500 leading-relaxed">{inc.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ━━━ Tab 2: 日次レポート ━━━

function DailyTab({ dailyReports, date }: { dailyReports: DailyReport[]; date: string }) {
  return (
    <div className="space-y-4">
      {dailyReports.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-12 text-center">
          <p className="text-sm text-gray-500">{date} の日次レポートはまだアップロードされていません</p>
        </div>
      ) : (
        dailyReports.map(report => (
          <div key={report.id} className="bg-white rounded-xl border border-gray-200 px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-800">{report.location_name}</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">{report.report_date}</p>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-gray-900 tabular-nums">{report.total_voters.toLocaleString()}</span>
                <span className="text-xs text-gray-400 ml-0.5">名</span>
              </div>
            </div>

            {report.summary && (
              <div className="mb-4">
                <p className="text-[11px] font-bold text-gray-500 mb-1.5">特記事項まとめ</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-lg px-4 py-3">{report.summary}</p>
              </div>
            )}

            {report.handover && (
              <div>
                <p className="text-[11px] font-bold text-gray-500 mb-1.5">翌日申し送り</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-blue-50 rounded-lg px-4 py-3">{report.handover}</p>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

// ━━━ Tab 3: 業務分類 ━━━

function ClassificationTab({ classifications }: { classifications: Classification[] }) {
  const grouped = {
    A: classifications.filter(c => c.category === "A"),
    B: classifications.filter(c => c.category === "B"),
    C: classifications.filter(c => c.category === "C"),
  };

  return (
    <div>
      <div className="mb-5">
        <h3 className="text-sm font-bold text-gray-800 mb-1">業務分類表</h3>
        <p className="text-xs text-gray-500 leading-relaxed">
          選管とユニポールの間で合意した業務分類です。各業務がどの区分に該当するかを明確にし、委託範囲の透明性を担保します。
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {(["A", "B", "C"] as const).map(cat => {
          const config = CATEGORY_CONFIG[cat];
          const items = grouped[cat];
          return (
            <div key={cat} className={`bg-white rounded-xl border ${config.border} overflow-hidden`}>
              <div className={`${config.bg} px-5 py-3 border-b ${config.border}`}>
                <p className={`text-sm font-bold ${config.color}`}>{config.label}</p>
                <p className={`text-[11px] ${config.color} opacity-75 mt-0.5`}>{config.sublabel}</p>
              </div>
              <div className="divide-y divide-gray-100">
                {items.map(item => (
                  <div key={item.id} className="px-5 py-3">
                    <p className="text-[13px] font-medium text-gray-800">{item.title}</p>
                    {item.description && (
                      <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{item.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
