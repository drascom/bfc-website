require("dotenv").config();
const argon2 = require("argon2");
const { db } = require("./db");

async function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      last_login_at TEXT
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      public_id TEXT UNIQUE,
      source TEXT NOT NULL CHECK(source IN ('booking','contact')),
      status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','contacted','qualified','closed','spam')),
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      route_from TEXT,
      route_to TEXT,
      departure_date TEXT,
      return_date TEXT,
      passengers INTEGER,
      notes TEXT,
      payload_json TEXT NOT NULL,
      admin_notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      contacted_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at);
    CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
    CREATE INDEX IF NOT EXISTS idx_submissions_source ON submissions(source);
    CREATE INDEX IF NOT EXISTS idx_submissions_email ON submissions(email);
    CREATE INDEX IF NOT EXISTS idx_submissions_name ON submissions(name);
  `);

  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const plainPassword = process.env.ADMIN_PASSWORD || "";
  const hashFromEnv = process.env.ADMIN_PASSWORD_HASH || "";

  if (!email) {
    console.log("Migration complete (no admin seeded; ADMIN_EMAIL not set).");
    return;
  }

  const existing = db.prepare("SELECT id FROM admin_users WHERE email = ?").get(email);
  if (existing) {
    console.log(`Migration complete (admin already exists: ${email}).`);
    return;
  }

  let passwordHash = hashFromEnv;
  if (!passwordHash && plainPassword) {
    passwordHash = await argon2.hash(plainPassword);
  }

  if (!passwordHash) {
    console.log("Migration complete (admin not seeded; set ADMIN_PASSWORD or ADMIN_PASSWORD_HASH).");
    return;
  }

  db.prepare(
    "INSERT INTO admin_users(email, password_hash, created_at) VALUES (?, ?, ?)"
  ).run(email, passwordHash, new Date().toISOString());

  console.log(`Seeded admin user: ${email}`);
}

migrate()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("Migration failed", err);
    process.exit(1);
  });
