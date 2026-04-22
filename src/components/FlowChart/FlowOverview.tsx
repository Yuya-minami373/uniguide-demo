import { CATEGORY_ORDER, CATEGORY_COLORS } from "./flowConstants";

interface Task {
  id: number;
  title: string;
  status: string;
  due_date: string;
  category: string;
}

interface Props {
  tasks: Task[];
  onCategoryClick: (category: string) => void;
}

export default function FlowOverview({ tasks, onCategoryClick }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {CATEGORY_ORDER.map(cat => {
        const catColor = CATEGORY_COLORS[cat];
        const catTasks = tasks.filter(t => t.category === cat);
        const completed = catTasks.filter(t => t.status === "完了").length;
        const pct = catTasks.length > 0 ? Math.round((completed / catTasks.length) * 100) : 0;

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
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs font-bold text-gray-600 tabular-nums">{pct}%</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
