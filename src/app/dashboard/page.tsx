import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { initDb } from "@/lib/db";
import DashboardClient from "./DashboardClient";


interface TaskRow {
  id: number;
  title: string;
  category: string;
  status: string;
  start_date: string | null;
  due_date: string;
  assignee_id: number;
  assignee_name: string;
  playbook_conditions: string;
  playbook_criteria: string;
  playbook_pitfalls: string;
  playbook_tip: string;
  memo: string;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ viewAs?: string }>;
}) {
  initDb();
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "manager") redirect("/manager");

  const { viewAs } = await searchParams;

  // UniPollアカウントがviewAsで職員画面を閲覧する場合
  const targetUserId = session.role === "unipoll" && viewAs
    ? parseInt(viewAs)
    : session.id;

  const displayUser = session.role === "unipoll" && viewAs
    ? (queryOne<{ id: number; name: string; role: string; category: string | null }>(
        "SELECT id, name, role, category FROM users WHERE id = ?", [targetUserId]
      ) ?? session)
    : session;

  const tasks = query<TaskRow>(`
    SELECT t.*, u.name as assignee_name
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    WHERE t.assignee_id = ?
    ORDER BY t.due_date ASC
  `, [targetUserId]);

  const allTasks = query<TaskRow>(`
    SELECT t.*, u.name as assignee_name
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    ORDER BY t.due_date ASC
  `, []);

  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const todayTasks = tasks.filter(t => t.due_date === today && t.status !== "完了");
  const tomorrowTasks = tasks.filter(t => t.due_date === tomorrow && t.status !== "完了");

  return (
    <DashboardClient
      user={displayUser as import("@/lib/auth").User}
      tasks={tasks}
      allTasks={allTasks}
      todayTasks={todayTasks}
      tomorrowTasks={tomorrowTasks}
      today={today}
      tomorrow={tomorrow}
      demoMode={session.role === "unipoll"}
    />
  );
}
