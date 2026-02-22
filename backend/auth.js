const path = require("path");
const session = require("express-session");
const connectSqlite3 = require("connect-sqlite3");
const crypto = require("crypto");
const argon2 = require("argon2");
const { getAdminByEmail, getAdminById, updateAdminLastLogin } = require("./db");

const SQLiteStore = connectSqlite3(session);

function sessionMiddleware() {
  const maxAgeMs = Number(process.env.SESSION_MAX_AGE_MS || 1000 * 60 * 60 * 8);
  const secureCookies = String(process.env.COOKIE_SECURE || "false") === "true";

  return session({
    store: new SQLiteStore({
      db: "sessions.sqlite",
      dir: path.resolve(process.cwd(), "data")
    }),
    name: "bfc_admin_session",
    secret: process.env.SESSION_SECRET || "change-me-in-production",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: secureCookies,
      sameSite: "lax",
      maxAge: maxAgeMs
    }
  });
}

function ensureCsrfToken(req) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(24).toString("hex");
  }
  return req.session.csrfToken;
}

function requireCsrf(req, res, next) {
  const incoming = req.header("x-csrf-token") || req.body.csrf_token;
  const current = req.session?.csrfToken;
  if (!current || !incoming || incoming !== current) {
    return res.status(403).json({ ok: false, error: "Invalid CSRF token." });
  }
  return next();
}

function requireAdmin(req, res, next) {
  if (!req.session?.adminUserId) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }
  const admin = getAdminById(req.session.adminUserId);
  if (!admin) {
    req.session.destroy(() => {});
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }
  req.admin = admin;
  return next();
}

async function login(req, res) {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  if (!email || !password) {
    return res.status(400).json({ ok: false, error: "Email and password are required." });
  }

  const admin = getAdminByEmail(email);
  if (!admin) {
    return res.status(401).json({ ok: false, error: "Invalid credentials." });
  }

  const valid = await argon2.verify(admin.password_hash, password).catch(() => false);
  if (!valid) {
    return res.status(401).json({ ok: false, error: "Invalid credentials." });
  }

  req.session.adminUserId = admin.id;
  ensureCsrfToken(req);
  updateAdminLastLogin(admin.id);

  return res.json({
    ok: true,
    user: { id: admin.id, email: admin.email },
    csrfToken: req.session.csrfToken
  });
}

function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ ok: false, error: "Failed to logout." });
    }
    res.clearCookie("bfc_admin_session");
    return res.json({ ok: true });
  });
}

function getSessionInfo(req, res) {
  if (!req.session?.adminUserId) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  const admin = getAdminById(req.session.adminUserId);
  if (!admin) {
    req.session.destroy(() => {});
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  ensureCsrfToken(req);
  return res.json({
    ok: true,
    user: { id: admin.id, email: admin.email },
    csrfToken: req.session.csrfToken
  });
}

module.exports = {
  sessionMiddleware,
  requireAdmin,
  requireCsrf,
  login,
  logout,
  getSessionInfo
};
