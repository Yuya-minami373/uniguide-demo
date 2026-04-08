"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      if (data.role === "manager" || data.role === "unipoll") {
        router.push("/manager");
      } else {
        router.push("/dashboard");
      }
    } else {
      setError(data.error || "ログインに失敗しました");
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: "#f8fafc",
        fontFamily: "'Plus Jakarta Sans', 'Noto Sans JP', sans-serif",
      }}
    >
      {/* ── main card ── */}
      <div className="relative z-10 w-full max-w-[860px] mx-4 flex rounded-2xl overflow-hidden border border-gray-200/60"
        style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.06)", height: "580px" }}
      >

        {/* Left panel — brand */}
        <div
          className="hidden lg:flex lg:w-[44%] flex-col p-10 relative overflow-hidden"
          style={{ background: "linear-gradient(160deg, #1e40af 0%, #2563eb 100%)" }}
        >
          {/* Logo */}
          <div className="relative z-10 mb-auto">
            <div className="inline-flex">
              <div className="bg-white rounded-lg px-3 py-1.5">
                <Image src="/logo.png" alt="UniPoll" width={120} height={32} className="h-6 w-auto" />
              </div>
            </div>
          </div>

          {/* Catchcopy — center */}
          <div className="relative z-10 my-auto">
            <h1 className="text-white font-extrabold tracking-tight leading-tight mb-5" style={{ fontSize: "36px" }}>
              UniGuide
            </h1>
            <p className="text-white/90 text-[15px] font-bold leading-relaxed mb-3">
              答えは、UniGuideの中に。
            </p>
            <p className="text-blue-200/70 text-[13px] leading-relaxed">
              選管専用の、業務ガイドツール。
            </p>

            {/* 3 features — icon + one word */}
            <div className="flex gap-4 mt-8">
              {[
                { icon: "✓", label: "チェックポイント" },
                { icon: "◎", label: "判断基準" },
                { icon: "◉", label: "進捗管理" },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-1.5">
                  <span className="text-blue-200 text-xs">{f.icon}</span>
                  <span className="text-blue-100/80 text-[11px] font-medium">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Copyright — bottom */}
          <div className="relative z-10 mt-auto pt-10">
            <p className="text-blue-400/40 text-[10px]">&copy; 2026 UniPoll Inc.</p>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex-1 flex flex-col justify-center p-8 lg:p-12 bg-white overflow-y-auto">
          {/* Mobile logo & catchcopy */}
          <div className="lg:hidden mb-6">
            <div className="flex mb-3">
              <div className="bg-blue-600 rounded-lg px-3 py-1.5">
                <Image src="/logo.png" alt="UniPoll" width={100} height={28} className="h-5 w-auto brightness-0 invert" />
              </div>
            </div>
            <p className="text-blue-600 text-sm font-bold">答えは、UniGuideの中に。</p>
          </div>

          <div className="mb-8">
            <h2 className="text-gray-900 text-2xl font-bold tracking-tight">サインイン</h2>
            <p className="text-gray-400 text-sm mt-1">UniGuideへようこそ</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-500 text-xs font-semibold mb-1.5">
                氏名
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-300 border border-gray-200 bg-white transition focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                placeholder="職員A"
                required
              />
            </div>

            <div>
              <label className="block text-gray-500 text-xs font-semibold mb-1.5">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder-gray-300 border border-gray-200 bg-white transition focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="rounded-lg p-3 bg-red-50 border border-red-200">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full font-semibold py-2.5 rounded-lg text-sm text-white transition-all duration-200 mt-2 disabled:opacity-50 active:scale-[0.99] bg-blue-600 hover:bg-blue-700"
              style={{
                boxShadow: loading ? "none" : "0 1px 3px rgba(37,99,235,0.2)",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  ログイン中...
                </span>
              ) : "ログイン"}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8">
            <button
              type="button"
              onClick={() => setShowDemo(!showDemo)}
              className="w-full flex items-center justify-between text-xs text-gray-400 hover:text-gray-600 transition py-2"
            >
              <span className="font-semibold">デモアカウント</span>
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-200 ${showDemo ? "rotate-180" : ""}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showDemo && (
              <div className="mt-1 rounded-lg overflow-hidden border border-gray-100">
                {[
                  { role: "担当者（入場整理券）", name: "職員A", pass: "demo", tag: "担当" },
                  { role: "担当者（投票所管理）", name: "職員B", pass: "demo", tag: "担当" },
                  { role: "係長", name: "係長", pass: "manager", tag: "係長" },
                  { role: "UniPoll", name: "UniPoll", pass: "unipoll2026", tag: "UNI" },
                ].map((a, i, arr) => (
                  <button
                    key={a.name}
                    type="button"
                    onClick={() => { setName(a.name); setPassword(a.pass); setShowDemo(false); }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-xs transition-colors hover:bg-blue-50 ${i < arr.length - 1 ? "border-b border-gray-50" : ""}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                        {a.tag}
                      </span>
                      <span className="text-gray-600">{a.role}</span>
                    </div>
                    <span className="text-gray-400 font-mono text-[11px]">{a.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
