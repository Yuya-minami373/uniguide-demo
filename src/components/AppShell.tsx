"use client";

import { useState, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { User } from "@/lib/auth";

type IconName = "grid" | "chart-bar" | "phone" | "book-open" | "map-pin" | "clipboard-doc" | "users" | "flow";

const NAV_ICON_PATHS: Record<IconName, string> = {
  "grid": "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
  "clipboard-doc": "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z",
  "chart-bar": "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  "phone": "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
  "book-open": "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  "map-pin": "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z",
  "users": "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
  "flow": "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z",
};

function NavIcon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg className={className ?? "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d={NAV_ICON_PATHS[name]} />
    </svg>
  );
}

const DEMO_VIEWS = [
  { key: "staff-1",    label: "職員A",       sub: "入場整理券",   href: "/dashboard?viewAs=1" },
  { key: "staff-2",    label: "職員B",       sub: "投票所管理",   href: "/dashboard?viewAs=2" },
  { key: "manager",    label: "係長",        sub: "管理者",       href: "/manager?viewAs=manager" },
  { key: "crew_lead",  label: "クルー責任者", sub: "時間帯報告",   href: "/crew/report?viewAs=crew_lead" },
  { key: "unipoll",    label: "UniPoll",     sub: "全機能",       href: "/manager" },
];

function DemoNavBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const viewAs = searchParams.get("viewAs");
  const [open, setOpen] = useState(false);

  function isActive(key: string) {
    if (key === "staff-1") return pathname === "/dashboard" && viewAs === "1";
    if (key === "staff-2") return pathname === "/dashboard" && viewAs === "2";
    if (key === "manager") return pathname.startsWith("/manager") && viewAs === "manager";
    if (key === "crew_lead") return pathname.startsWith("/crew") && viewAs === "crew_lead";
    if (key === "unipoll") return pathname.startsWith("/manager") && !viewAs;
    return false;
  }

  const currentView = DEMO_VIEWS.find(v => isActive(v.key));

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="flex flex-col gap-1 bg-white border border-gray-200 rounded-xl shadow-lg px-2 py-2">
          <span className="text-[10px] font-bold text-gray-400 px-2 pb-1 mb-0.5 border-b border-gray-100">デモ切替</span>
          {DEMO_VIEWS.map(view => (
            <Link
              key={view.key}
              href={view.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                isActive(view.key)
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span>{view.label}</span>
              <span className="text-[9px] font-normal opacity-60">{view.sub}</span>
            </Link>
          ))}
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 transition"
      >
        <span>デモ</span>
        {currentView && (
          <span className="text-blue-600">{currentView.label}</span>
        )}
        <svg className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </div>
  );
}

interface AppShellProps {
  user: User;
  children: React.ReactNode;
  demoMode?: boolean;
  electionName?: string;
  progressCompleted?: number;
  progressInProgress?: number;
  progressLabel?: string;
}

const NAV_ITEMS_STAFF: { id: string; icon: IconName; label: string; href: string }[] = [
  { id: "my-projects", icon: "grid",           label: "Myプロジェクト", href: "/dashboard" },
  { id: "calls",       icon: "phone",          label: "受電記録",       href: "/calls" },
  { id: "kian",        icon: "clipboard-doc",  label: "起案一覧",       href: "/kian" },
  { id: "manuals",     icon: "book-open",      label: "マニュアル",     href: "/manuals" },
  { id: "map",         icon: "map-pin",        label: "投票所・ポス掲マップ", href: "/map" },
  { id: "crew",        icon: "users",          label: "UniPollクルー",  href: "/crew" },
];

const NAV_ITEMS_MANAGER: { id: string; icon: IconName; label: string; href: string }[] = [
  { id: "manager",    icon: "grid",            label: "ダッシュボード", href: "/manager" },
  { id: "categories", icon: "chart-bar",       label: "業務別進捗",     href: "/manager/categories" },
  { id: "calls",      icon: "phone",           label: "受電記録",       href: "/calls" },
  { id: "kian",       icon: "clipboard-doc",   label: "起案一覧",       href: "/kian" },
  { id: "manuals",    icon: "book-open",       label: "マニュアル",     href: "/manuals" },
  { id: "map",        icon: "map-pin",         label: "投票所・ポス掲マップ", href: "/map" },
  { id: "crew",       icon: "users",           label: "UniPollクルー",  href: "/crew" },
];

const NAV_ITEMS_CREW_LEAD: { id: string; icon: IconName; label: string; href: string }[] = [
  { id: "crew-report", icon: "chart-bar", label: "時間帯報告", href: "/crew/report" },
];

export default function AppShell({
  user,
  children,
  demoMode = false,
  electionName = "令和8年 市議会議員選挙",
  progressCompleted = 24,
  progressInProgress = 18,
  progressLabel,
}: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = user.role === "crew_lead" ? NAV_ITEMS_CREW_LEAD : user.role === "manager" ? NAV_ITEMS_MANAGER : NAV_ITEMS_STAFF;

  function isActive(_href: string, id: string) {
    if (id === "categories" && pathname === "/manager/categories") return true;
    if (id === "manager" && pathname === "/manager") return true;
    if (id === "board" && pathname === "/manager") return true;
    if (id === "all-progress" && pathname === "/manager") return true;
    if (id === "by-category" && pathname === "/manager/categories") return true;
    if (id === "dashboard" && pathname === "/dashboard") return true;
    if (id === "my-projects" && (pathname === "/dashboard" || pathname.startsWith("/tasks"))) return true;
    if (id === "kian" && pathname === "/kian") return true;
    if (id === "calls" && pathname === "/calls") return true;
    if (id === "manuals" && pathname === "/manuals") return true;
    if (id === "map" && pathname === "/map") return true;
    if (id === "crew" && pathname.startsWith("/crew")) return true;
    if (id === "crew-report" && pathname === "/crew/report") return true;
    return false;
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const initials = user.name ? user.name.charAt(0) : "?";

  return (
    <div
      className="h-screen flex overflow-hidden"
      style={{ fontFamily: "'Inter', 'Hiragino Sans', 'Noto Sans JP', sans-serif", backgroundColor: "#f8fafc" }}
    >
      {/* ━━━ Sidebar ━━━ */}
      <aside
        className="flex flex-col shrink-0 border-r border-gray-200 bg-white transition-all duration-200"
        style={{ width: collapsed ? 56 : 220 }}
      >
        {/* Logo + collapse toggle */}
        <div className={`pt-4 pb-3 border-b border-gray-100 flex items-center ${collapsed ? "flex-col gap-2 px-2" : "px-4 justify-between"}`}>
          {collapsed ? (
            <>
              <div className="bg-blue-600 rounded-lg p-1 flex items-center justify-center" style={{ width: 36, height: 36 }}>
                <Image src="/logo-icon.png" alt="UniPoll" width={32} height={32} className="w-full h-full object-contain brightness-0 invert" />
              </div>
              <button
                onClick={() => setCollapsed(false)}
                className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                title="サイドバーを開く"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </>
          ) : (
            <>
              <div>
                <div className="inline-block">
                  <Image src="/logo.png" alt="UniPoll" width={160} height={40} className="h-5 w-auto" />
                </div>
                <p className="text-[15px] text-blue-600 mt-1 font-bold tracking-wide">UniGuide</p>
                <p className="text-[10px] text-gray-400 mt-0.5 tracking-wide whitespace-nowrap">選管専用の、業務ガイドツール</p>
              </div>
              <button
                onClick={() => setCollapsed(true)}
                className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition shrink-0"
                title="サイドバーを閉じる"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Election info — hidden when collapsed */}
        {!collapsed && (
          <div className="px-4 py-4 border-b border-gray-100">
            <p className="text-[13px] text-gray-800 font-bold mb-3">{electionName}</p>
            <div className="space-y-1.5 mb-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-gray-500">告示まで</p>
                <p className="text-lg font-bold text-orange-500 tabular-nums">
                  {Math.round((new Date("2026-05-04T00:00:00+09:00").getTime() - new Date(new Date().toISOString().slice(0,10) + "T00:00:00+09:00").getTime()) / 86400000)}<span className="text-xs text-gray-400 ml-0.5">日</span>
                </p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-gray-500">投票日まで</p>
                <p className="text-lg font-bold text-gray-800 tabular-nums">
                  {Math.round((new Date("2026-05-11T00:00:00+09:00").getTime() - new Date(new Date().toISOString().slice(0,10) + "T00:00:00+09:00").getTime()) / 86400000)}<span className="text-xs text-gray-400 ml-0.5">日</span>
                </p>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] text-gray-400 mb-1.5">
                <span>{progressLabel ?? (user.role === "manager" ? "全体進捗" : "自分の進捗")}</span>
                <span className="text-gray-600 font-semibold">{progressCompleted}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full flex">
                  <div className="bg-emerald-500 rounded-l-full" style={{ width: `${progressCompleted}%` }} />
                  <div className="bg-blue-300" style={{ width: `${progressInProgress}%` }} />
                </div>
              </div>
              <div className="flex gap-3 mt-1.5">
                <span className="flex items-center gap-1 text-[9px] text-gray-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />完了
                </span>
                <span className="flex items-center gap-1 text-[9px] text-gray-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-300 inline-block" />進行中
                </span>
                <span className="flex items-center gap-1 text-[9px] text-gray-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-200 inline-block" />未着手
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className={`py-3 space-y-0.5 flex-1 ${collapsed ? "px-1.5" : "px-3"}`}>
          {navItems.map((item) => {
            const active = isActive(item.href, item.id);
            return (
              <Link
                key={item.id}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 rounded-lg text-sm transition-colors ${
                  collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2"
                } ${
                  active
                    ? "bg-blue-50 text-blue-600 font-semibold"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <NavIcon name={item.icon} className={`w-4 h-4 shrink-0 ${active ? "text-blue-600" : "text-gray-400"}`} />
                {!collapsed && <span className="text-[13px] flex-1">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className={`py-3 border-t border-gray-100 ${collapsed ? "px-1.5" : "px-3"}`}>
          {collapsed ? (
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold" title={user.name}>
                {initials}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-default">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-gray-800 truncate">{user.name}</p>
                <p className="text-[11px] text-gray-400 truncate">{user.category || (user.role === "manager" ? "係長" : "担当者")}</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-300 hover:text-gray-500 transition"
                title="ログアウト"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ━━━ Content area ━━━ */}
      <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
        {children}
      </div>

      {/* ━━━ デモナビバー（UniPollアカウント専用）━━━ */}
      {demoMode && (
        <Suspense fallback={null}>
          <DemoNavBar />
        </Suspense>
      )}
    </div>
  );
}
