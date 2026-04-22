import Link from "next/link";
import { CATEGORY_ORDER, CATEGORY_COLORS, STATUS_NODE_COLORS, ANNOUNCEMENT_DATE, VOTE_DATE } from "./flowConstants";

interface Task {
  id: number;
  title: string;
  status: string;
  due_date: string;
  category: string;
}

function formatMMDD(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

interface Props {
  tasks: Task[];
  onCategoryClick: (category: string) => void;
}

export default function FlowOverview({ tasks, onCategoryClick }: Props) {
  return (
    <div>
      {/* Legend */}
      <div className="flex items-center gap-5 mb-5">
        <span className="text-[11px] text-gray-400 font-medium">ステータス:</span>
        {(["完了", "進行中", "確認待ち", "未着手"] as const).map(status => (
          <span key={status} className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <span className={`w-2.5 h-2.5 rounded-full ${STATUS_NODE_COLORS[status].bg}`} />
            {status}
          </span>
        ))}
      </div>

      {/* Category cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CATEGORY_ORDER.map(cat => {
          const catColor = CATEGORY_COLORS[cat];
          const catTasks = tasks
            .filter(t => t.category === cat)
            .sort((a, b) => a.due_date.localeCompare(b.due_date) || a.id - b.id);
          const completed = catTasks.filter(t => t.status === "完了").length;
          const pct = catTasks.length > 0 ? Math.round((completed / catTasks.length) * 100) : 0;

          // Group by date for preview (first 4 unique dates)
          const dateGroups: { date: string; tasks: Task[] }[] = [];
          for (const task of catTasks) {
            const existing = dateGroups.find(g => g.date === task.due_date);
            if (existing) existing.tasks.push(task);
            else dateGroups.push({ date: task.due_date, tasks: [task] });
          }

          return (
            <button
              key={cat}
              onClick={() => onCategoryClick(cat)}
              className="bg-white rounded-2xl border border-gray-200 p-5 text-left hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-3 h-3 rounded-full ${catColor?.bg ?? "bg-gray-400"}`} />
                  <span className="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition">{cat}</span>
                </div>
                <span className="text-xs text-gray-400">{catTasks.length}タスク</span>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-bold text-gray-600 tabular-nums">{pct}%</span>
              </div>

              {/* Preview: first few steps */}
              <div className="space-y-1">
                {dateGroups.slice(0, 3).map((group, i) => (
                  <div key={group.date} className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 tabular-nums w-8 shrink-0">{formatMMDD(group.date)}</span>
                    <div className="flex items-center gap-1 flex-1 overflow-hidden">
                      {group.tasks.map(task => {
                        const colors = STATUS_NODE_COLORS[task.status] ?? STATUS_NODE_COLORS["未着手"];
                        return (
                          <span key={task.id} className="flex items-center gap-1 shrink-0">
                            <span className={`w-1.5 h-1.5 rounded-full ${colors.bg}`} />
                            <span className="text-[11px] text-gray-600 truncate max-w-[120px]">{task.title}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {dateGroups.length > 3 && (
                  <span className="text-[10px] text-gray-400 ml-10">…他{dateGroups.length - 3}件</span>
                )}
              </div>

              {/* CTA */}
              <div className="flex items-center gap-1 mt-3 text-[11px] text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition">
                詳細フローを見る
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
