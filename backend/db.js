const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const dbPath = process.env.DB_PATH
  ? path.resolve(process.cwd(), process.env.DB_PATH)
  : path.join(process.cwd(), "data", "bfc.sqlite");

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("synchronous = NORMAL");

const nowIso = () => new Date().toISOString();

const serializePayload = (payload) => JSON.stringify(payload || {});

function insertSubmission(input) {
  const createdAt = nowIso();
  const insert = db.prepare(`
    INSERT INTO submissions (
      source,
      status,
      name,
      email,
      phone,
      route_from,
      route_to,
      departure_date,
      return_date,
      passengers,
      notes,
      payload_json,
      admin_notes,
      created_at,
      updated_at
    ) VALUES (
      @source,
      'new',
      @name,
      @email,
      @phone,
      @route_from,
      @route_to,
      @departure_date,
      @return_date,
      @passengers,
      @notes,
      @payload_json,
      '',
      @created_at,
      @updated_at
    )
  `);

  const result = insert.run({
    source: input.source,
    name: input.name,
    email: input.email,
    phone: input.phone,
    route_from: input.route_from || null,
    route_to: input.route_to || null,
    departure_date: input.departure_date || null,
    return_date: input.return_date || null,
    passengers: Number.isInteger(input.passengers) ? input.passengers : null,
    notes: input.notes || null,
    payload_json: serializePayload(input.payload_json),
    created_at: createdAt,
    updated_at: createdAt
  });

  const id = Number(result.lastInsertRowid);
  const year = new Date().getUTCFullYear();
  const publicId = `BFC-${year}-${String(id).padStart(6, "0")}`;
  db.prepare("UPDATE submissions SET public_id = ? WHERE id = ?").run(publicId, id);

  return { id, public_id: publicId };
}

function getAdminByEmail(email) {
  return db.prepare("SELECT * FROM admin_users WHERE email = ?").get(email.toLowerCase());
}

function getAdminById(id) {
  return db.prepare("SELECT * FROM admin_users WHERE id = ?").get(id);
}

function updateAdminLastLogin(id) {
  db.prepare("UPDATE admin_users SET last_login_at = ? WHERE id = ?").run(nowIso(), id);
}

function buildSubmissionWhereClause(filters, params) {
  const where = [];

  if (filters.status) {
    where.push("status = @status");
    params.status = filters.status;
  }

  if (filters.source) {
    where.push("source = @source");
    params.source = filters.source;
  }

  if (filters.dateFrom) {
    where.push("created_at >= @dateFrom");
    params.dateFrom = `${filters.dateFrom}T00:00:00.000Z`;
  }

  if (filters.dateTo) {
    where.push("created_at <= @dateTo");
    params.dateTo = `${filters.dateTo}T23:59:59.999Z`;
  }

  if (filters.q) {
    where.push("(public_id LIKE @q OR name LIKE @q OR email LIKE @q OR phone LIKE @q OR notes LIKE @q)");
    params.q = `%${filters.q}%`;
  }

  return where.length ? `WHERE ${where.join(" AND ")}` : "";
}

function listSubmissions({
  page = 1,
  pageSize = 20,
  status,
  source,
  q,
  dateFrom,
  dateTo,
  sort = "created_desc"
}) {
  const allowedSort = {
    created_desc: "created_at DESC",
    created_asc: "created_at ASC",
    updated_desc: "updated_at DESC",
    updated_asc: "updated_at ASC"
  };
  const sortSql = allowedSort[sort] || allowedSort.created_desc;

  const offset = (page - 1) * pageSize;
  const params = { pageSize, offset };
  const whereSql = buildSubmissionWhereClause({ status, source, q, dateFrom, dateTo }, params);

  const rows = db
    .prepare(
      `SELECT
        id,
        public_id,
        source,
        status,
        name,
        email,
        phone,
        route_from,
        route_to,
        departure_date,
        return_date,
        passengers,
        notes,
        admin_notes,
        created_at,
        updated_at,
        contacted_at
      FROM submissions
      ${whereSql}
      ORDER BY ${sortSql}
      LIMIT @pageSize OFFSET @offset`
    )
    .all(params);

  const totalRow = db
    .prepare(`SELECT COUNT(*) AS total FROM submissions ${whereSql}`)
    .get(params);

  return { rows, total: totalRow.total || 0 };
}

function getSubmissionById(id) {
  const row = db.prepare("SELECT * FROM submissions WHERE id = ?").get(id);
  if (!row) return null;

  return {
    ...row,
    payload_json: row.payload_json ? JSON.parse(row.payload_json) : {}
  };
}

function updateSubmission(id, patch) {
  const allowedStatuses = new Set(["new", "contacted", "qualified", "closed", "spam"]);
  const updates = [];
  const params = { id, updated_at: nowIso() };

  if (typeof patch.admin_notes === "string") {
    updates.push("admin_notes = @admin_notes");
    params.admin_notes = patch.admin_notes;
  }

  if (typeof patch.status === "string" && allowedStatuses.has(patch.status)) {
    updates.push("status = @status");
    params.status = patch.status;

    if (patch.status === "contacted") {
      updates.push("contacted_at = COALESCE(contacted_at, @contacted_at)");
      params.contacted_at = nowIso();
    }
  }

  updates.push("updated_at = @updated_at");

  if (!updates.length) return getSubmissionById(id);

  db.prepare(`UPDATE submissions SET ${updates.join(", ")} WHERE id = @id`).run(params);
  return getSubmissionById(id);
}

function listSubmissionsForExport(filters) {
  const params = {};
  const whereSql = buildSubmissionWhereClause(filters, params);

  return db
    .prepare(
      `SELECT
        public_id,
        source,
        status,
        name,
        email,
        phone,
        route_from,
        route_to,
        departure_date,
        return_date,
        passengers,
        notes,
        admin_notes,
        created_at,
        updated_at,
        contacted_at
      FROM submissions
      ${whereSql}
      ORDER BY created_at DESC`
    )
    .all(params);
}

module.exports = {
  db,
  insertSubmission,
  getAdminByEmail,
  getAdminById,
  updateAdminLastLogin,
  listSubmissions,
  getSubmissionById,
  updateSubmission,
  listSubmissionsForExport
};
