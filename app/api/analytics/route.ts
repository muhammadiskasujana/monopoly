import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/postgres";
import { initUserTables, recordVisit } from "@/lib/users";

export async function GET() {
  await initUserTables();
  const [summary, daily] = await Promise.all([
    db.prepare(`SELECT
      COUNT(*)::int AS total_users,
      COUNT(*) FILTER (WHERE status='active')::int AS active_accounts,
      COUNT(*) FILTER (WHERE last_seen_at >= (EXTRACT(EPOCH FROM NOW())*1000 - 2592000000))::int AS active_30d,
      (SELECT COUNT(DISTINCT user_id)::int FROM user_daily_visits WHERE visit_date=(NOW() AT TIME ZONE 'Asia/Makassar')::date) AS active_today
      FROM app_users`).first<any>(),
    db.prepare(`WITH days AS (
      SELECT generate_series((NOW() AT TIME ZONE 'Asia/Makassar')::date - 6,(NOW() AT TIME ZONE 'Asia/Makassar')::date,'1 day')::date AS day
    ) SELECT to_char(days.day,'YYYY-MM-DD') AS date,
      COALESCE(SUM(v.visits),0)::int AS visits,
      COUNT(DISTINCT v.user_id)::int AS users
      FROM days LEFT JOIN user_daily_visits v ON v.visit_date=days.day
      GROUP BY days.day ORDER BY days.day`).all<any>(),
  ]);
  return NextResponse.json({ summary, daily: daily.results });
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Belum login" }, { status: 401 });
  await recordVisit(session.user.id);
  return NextResponse.json({ ok: true });
}
