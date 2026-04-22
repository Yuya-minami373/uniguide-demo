"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import FlowOverview from "@/components/FlowChart/FlowOverview";
import FlowCategory from "@/components/FlowChart/FlowCategory";
import type { User } from "@/lib/auth";

interface Task {
  id: number;
  title: string;
  category: string;
  status: string;
  due_date: string;
}

interface Props {
  session: User;
  tasks: Task[];
  demoMode?: boolean;
}

export default function FlowPageClient({ session, tasks, demoMode = false }: Props) {
  const [flowView, setFlowView] = useState<"overview" | "category">("overview");
  const [flowCategory, setFlowCategory] = useState<string | null>(null);

  return (
    <AppShell user={session} demoMode={demoMode}>
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="px-4 md:px-8 pt-6 pb-4 border-b border-gray-100 bg-white">
          <h1 className="text-xl font-bold text-gray-900">業務フロー</h1>
          <p className="text-sm text-gray-500 mt-0.5">選挙業務の全体の流れとカテゴリ別の詳細フロー</p>
        </div>

        {/* Content */}
        <div className="px-4 md:px-8 py-6">
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
      </div>
    </AppShell>
  );
}
