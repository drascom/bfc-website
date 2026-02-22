require("dotenv").config();
const path = require("path");
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const {
  insertSubmission,
  listSubmissions,
  getSubmissionById,
  updateSubmission,
  listSubmissionsForExport
} = require("./backend/db");
const {
  parseBookingSubmission,
  parseContactSubmission,
  parseAdminUpdate
} = require("./backend/validate");
const { notifyNewSubmission } = require("./backend/notify");
const {
  sessionMiddleware,
  requireAdmin,
  requireCsrf,
  login,
  logout,
  getSessionInfo
} = require("./backend/auth");

const app = express();
const rootDir = process.cwd();
const port = Number(process.env.PORT || 5173);
app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

app.use(express.json({ limit: "300kb" }));
app.use(express.urlencoded({ extended: false }));
app.use(sessionMiddleware());

const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false
});

function sendFile(res, relativePath) {
  return res.sendFile(path.join(rootDir, relativePath));
}

function requireAdminPage(req, res, next) {
  if (!req.session?.adminUserId) {
    return res.redirect("/admin/login.html");
  }
  return next();
}

app.use("/assets", express.static(path.join(rootDir, "assets")));
app.use("/js", express.static(path.join(rootDir, "js")));

app.get("/", (_req, res) => sendFile(res, "index.html"));
app.get(["/index.html", "/booking.html", "/fleet.html", "/contact.html", "/inspections.html"], (req, res) => {
  sendFile(res, req.path.slice(1));
});

app.get(["/logo.png", "/aircraft.jpg"], (req, res) => sendFile(res, req.path.slice(1)));
app.get("/admin/login.html", (_req, res) => sendFile(res, "admin/login.html"));
app.get("/admin/login", (_req, res) => sendFile(res, "admin/login.html"));
app.get("/admin/admin.js", (_req, res) => sendFile(res, "admin/admin.js"));
app.get("/admin/admin.css", (_req, res) => sendFile(res, "admin/admin.css"));

app.get(["/admin", "/admin/", "/admin/index.html"], requireAdminPage, (_req, res) =>
  sendFile(res, "admin/index.html")
);

app.post("/api/submissions/booking", submitLimiter, async (req, res) => {
  const parsed = parseBookingSubmission(req.body || {});
  if (!parsed.ok) {
    return res.status(400).json({ ok: false, errors: parsed.errors });
  }

  try {
    const inserted = insertSubmission(parsed.data);
    const submission = getSubmissionById(inserted.id);

    let notifyResult = { sent: false };
    try {
      notifyResult = await notifyNewSubmission(submission);
    } catch (notifyErr) {
      console.error("SMTP notification failed", notifyErr);
    }

    return res.json({
      ok: true,
      id: submission.public_id,
      message: "Booking request saved.",
      notification: notifyResult
    });
  } catch (err) {
    console.error("booking submission failed", err);
    return res.status(500).json({ ok: false, errors: { form: "Submission failed. Please try again." } });
  }
});

app.post("/api/submissions/contact", submitLimiter, async (req, res) => {
  const parsed = parseContactSubmission(req.body || {});
  if (!parsed.ok) {
    return res.status(400).json({ ok: false, errors: parsed.errors });
  }

  try {
    const inserted = insertSubmission(parsed.data);
    const submission = getSubmissionById(inserted.id);

    let notifyResult = { sent: false };
    try {
      notifyResult = await notifyNewSubmission(submission);
    } catch (notifyErr) {
      console.error("SMTP notification failed", notifyErr);
    }

    return res.json({
      ok: true,
      id: submission.public_id,
      message: "Contact request saved.",
      notification: notifyResult
    });
  } catch (err) {
    console.error("contact submission failed", err);
    return res.status(500).json({ ok: false, errors: { form: "Submission failed. Please try again." } });
  }
});

app.post("/api/admin/login", loginLimiter, async (req, res) => {
  try {
    return await login(req, res);
  } catch (err) {
    console.error("admin login failed", err);
    return res.status(500).json({ ok: false, error: "Login failed." });
  }
});

app.get("/api/admin/session", getSessionInfo);
app.post("/api/admin/logout", requireAdmin, requireCsrf, logout);

app.get("/api/admin/submissions", requireAdmin, (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize || 20)));

  const query = {
    page,
    pageSize,
    status: req.query.status ? String(req.query.status) : undefined,
    source: req.query.source ? String(req.query.source) : undefined,
    q: req.query.q ? String(req.query.q).trim() : undefined,
    dateFrom: req.query.dateFrom ? String(req.query.dateFrom) : undefined,
    dateTo: req.query.dateTo ? String(req.query.dateTo) : undefined,
    sort: req.query.sort ? String(req.query.sort) : undefined
  };

  const result = listSubmissions(query);
  return res.json({
    ok: true,
    rows: result.rows,
    page,
    pageSize,
    total: result.total,
    totalPages: Math.max(1, Math.ceil(result.total / pageSize))
  });
});

function csvCell(value) {
  if (value === null || value === undefined) return "";
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

app.get("/api/admin/submissions/export.csv", requireAdmin, (req, res) => {
  const filters = {
    status: req.query.status ? String(req.query.status) : undefined,
    source: req.query.source ? String(req.query.source) : undefined,
    q: req.query.q ? String(req.query.q).trim() : undefined,
    dateFrom: req.query.dateFrom ? String(req.query.dateFrom) : undefined,
    dateTo: req.query.dateTo ? String(req.query.dateTo) : undefined
  };

  const rows = listSubmissionsForExport(filters);
  const header = [
    "public_id",
    "source",
    "status",
    "name",
    "email",
    "phone",
    "route_from",
    "route_to",
    "departure_date",
    "return_date",
    "passengers",
    "notes",
    "admin_notes",
    "created_at",
    "updated_at",
    "contacted_at"
  ];

  const csv = [header.join(",")]
    .concat(
      rows.map((row) =>
        [
          row.public_id,
          row.source,
          row.status,
          row.name,
          row.email,
          row.phone,
          row.route_from,
          row.route_to,
          row.departure_date,
          row.return_date,
          row.passengers,
          row.notes,
          row.admin_notes,
          row.created_at,
          row.updated_at,
          row.contacted_at
        ]
          .map(csvCell)
          .join(",")
      )
    )
    .join("\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="bfc-submissions-${Date.now()}.csv"`);
  return res.send(csv);
});

app.get("/api/admin/submissions/:id", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ ok: false, error: "Invalid id." });
  }

  const row = getSubmissionById(id);
  if (!row) {
    return res.status(404).json({ ok: false, error: "Not found." });
  }

  return res.json({ ok: true, row });
});

app.patch("/api/admin/submissions/:id", requireAdmin, requireCsrf, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ ok: false, errors: { form: "Invalid id." } });
  }

  const parsed = parseAdminUpdate(req.body || {});
  if (!parsed.ok) {
    return res.status(400).json({ ok: false, errors: parsed.errors });
  }

  const updated = updateSubmission(id, parsed.data);
  if (!updated) {
    return res.status(404).json({ ok: false, errors: { form: "Submission not found." } });
  }

  return res.json({ ok: true, row: updated });
});

app.listen(port, () => {
  console.log(`BFC server listening on http://localhost:${port}`);
});
