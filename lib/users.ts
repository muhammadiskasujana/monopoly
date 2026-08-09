import { db } from "@/lib/postgres";

export async function initUserTables() {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS app_users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      image TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      registered_at BIGINT NOT NULL,
      last_login_at BIGINT NOT NULL,
      last_seen_at BIGINT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS user_daily_visits (
      user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      visit_date DATE NOT NULL,
      visits INTEGER NOT NULL DEFAULT 1,
      first_visit_at BIGINT NOT NULL,
      last_visit_at BIGINT NOT NULL,
      PRIMARY KEY (user_id, visit_date)
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_users_last_seen ON app_users(last_seen_at DESC)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_visits_date ON user_daily_visits(visit_date DESC)"),
  ]);
}

export async function upsertGoogleUser(user: { id: string; email?: string | null; name?: string | null; image?: string | null }) {
  if (!user.email) return;
  await initUserTables();
  const now = Date.now();
  await db.prepare(`INSERT INTO app_users(id,email,name,image,registered_at,last_login_at,last_seen_at)
    VALUES(?,?,?,?,?,?,?) ON CONFLICT(email) DO UPDATE SET
    id=excluded.id,name=excluded.name,image=excluded.image,status='active',last_login_at=excluded.last_login_at,last_seen_at=excluded.last_seen_at`)
    .bind(user.id, user.email.toLowerCase(), user.name || user.email.split("@")[0], user.image || null, now, now, now).run();
}

export async function recordVisit(userId: string) {
  await initUserTables();
  const now = Date.now();
  await db.batch([
    db.prepare("UPDATE app_users SET last_seen_at=? WHERE id=?").bind(now, userId),
    db.prepare(`INSERT INTO user_daily_visits(user_id,visit_date,visits,first_visit_at,last_visit_at)
      VALUES(?,(NOW() AT TIME ZONE 'Asia/Makassar')::date,1,?,?)
      ON CONFLICT(user_id,visit_date) DO UPDATE SET visits=user_daily_visits.visits+1,last_visit_at=excluded.last_visit_at`)
      .bind(userId, now, now),
  ]);
}
