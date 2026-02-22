(() => {
  let csrfToken = "";

  async function api(url, options = {}) {
    const method = String(options.method || "GET").toUpperCase();
    const headers = Object.assign({}, options.headers || {});
    if (options.body && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
    if (["POST", "PATCH", "PUT", "DELETE"].includes(method) && csrfToken) {
      headers["x-csrf-token"] = csrfToken;
    }

    const res = await fetch(url, {
      credentials: "same-origin",
      ...options,
      headers,
      body: options.body && headers["Content-Type"] === "application/json" ? JSON.stringify(options.body) : options.body
    });

    const contentType = res.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await res.json() : await res.text();

    if (!res.ok) {
      const err = new Error((data && data.error) || "Request failed");
      err.payload = data;
      err.status = res.status;
      throw err;
    }

    return data;
  }

  function setText(selector, text) {
    const node = document.querySelector(selector);
    if (node) node.textContent = text;
  }

  async function initLoginPage() {
    const form = document.getElementById("admin-login-form");
    if (!form) return;

    try {
      const session = await api("/api/admin/session");
      if (session?.ok) {
        window.location.href = "/admin/";
        return;
      }
    } catch (_e) {
      // not logged in
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const fd = new FormData(form);
      const payload = Object.fromEntries(fd.entries());
      const errorEl = document.getElementById("login-error");
      if (errorEl) errorEl.textContent = "";

      try {
        const result = await api("/api/admin/login", { method: "POST", body: payload });
        csrfToken = result.csrfToken || "";
        window.location.href = "/admin/";
      } catch (err) {
        if (errorEl) errorEl.textContent = err.payload?.error || "Login failed.";
      }
    });
  }

  function formatDate(value) {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString();
  }

  function createCell(text) {
    const td = document.createElement("td");
    td.textContent = text == null || text === "" ? "-" : String(text);
    return td;
  }

  async function initDashboardPage() {
    const tbody = document.getElementById("submissions-tbody");
    if (!tbody) return;

    const filtersForm = document.getElementById("filters-form");
    const resetBtn = document.getElementById("filters-reset");
    const exportBtn = document.getElementById("export-csv-btn");
    const prevBtn = document.getElementById("prev-page");
    const nextBtn = document.getElementById("next-page");
    const pageLabel = document.getElementById("page-label");
    const tableMeta = document.getElementById("table-meta");
    const detailSidebar = document.getElementById("detail-sidebar");
    const detailOverlay = document.getElementById("detail-overlay");
    const detailCloseBtn = document.getElementById("detail-close-btn");
    const detailGrid = document.getElementById("detail-grid");
    const detailForm = document.getElementById("detail-update-form");
    const detailSaveMsg = document.getElementById("detail-save-msg");
    const logoutBtn = document.getElementById("admin-logout-btn");

    let currentPage = 1;
    const pageSize = 20;
    let totalPages = 1;
    let selectedId = null;

    const openDetailSidebar = () => {
      detailOverlay.hidden = false;
      detailSidebar.classList.add("is-open");
      detailSidebar.setAttribute("aria-hidden", "false");
    };

    const closeDetailSidebar = () => {
      detailSidebar.classList.remove("is-open");
      detailSidebar.setAttribute("aria-hidden", "true");
      detailOverlay.hidden = true;
    };

    const getFilterState = () => {
      const fd = new FormData(filtersForm);
      const state = Object.fromEntries(fd.entries());
      Object.keys(state).forEach((key) => {
        if (!state[key]) delete state[key];
      });
      return state;
    };

    const toQuery = (obj) => {
      const params = new URLSearchParams();
      Object.entries(obj).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
      });
      return params.toString();
    };

    const ensureSession = async () => {
      try {
        const session = await api("/api/admin/session");
        csrfToken = session.csrfToken || "";
        setText("#admin-session-email", session.user?.email || "");
      } catch (_err) {
        window.location.href = "/admin/login.html";
      }
    };

    const loadDetail = async (id) => {
      const result = await api(`/api/admin/submissions/${id}`);
      const row = result.row;
      selectedId = row.id;

      detailGrid.innerHTML = "";
      const fields = [
        ["Public ID", row.public_id],
        ["Source", row.source],
        ["Status", row.status],
        ["Name", row.name],
        ["Email", row.email],
        ["Phone", row.phone],
        ["From", row.route_from],
        ["To", row.route_to],
        ["Departure Date", row.departure_date],
        ["Return Date", row.return_date],
        ["Passengers", row.passengers],
        ["Notes", row.notes],
        ["Created", formatDate(row.created_at)],
        ["Updated", formatDate(row.updated_at)],
        ["Contacted At", formatDate(row.contacted_at)]
      ];

      fields.forEach(([k, v]) => {
        const dt = document.createElement("dt");
        dt.textContent = k;
        const dd = document.createElement("dd");
        dd.textContent = v == null || v === "" ? "-" : String(v);
        detailGrid.appendChild(dt);
        detailGrid.appendChild(dd);
      });

      detailForm.elements.status.value = row.status;
      detailForm.elements.admin_notes.value = row.admin_notes || "";
      detailSaveMsg.textContent = "";
      openDetailSidebar();
    };

    const loadRows = async () => {
      const filters = getFilterState();
      const query = toQuery({ page: currentPage, pageSize, ...filters });
      const result = await api(`/api/admin/submissions?${query}`);

      totalPages = result.totalPages || 1;
      tbody.innerHTML = "";

      result.rows.forEach((row) => {
        const tr = document.createElement("tr");
        tr.appendChild(createCell(row.public_id));
        tr.appendChild(createCell(row.source));
        tr.appendChild(createCell(row.status));
        tr.appendChild(createCell(row.name));
        tr.appendChild(createCell(row.email));
        tr.appendChild(createCell(row.phone));
        tr.appendChild(createCell(formatDate(row.created_at)));

        const actionTd = document.createElement("td");
        const viewBtn = document.createElement("button");
        viewBtn.type = "button";
        viewBtn.textContent = "View";
        viewBtn.addEventListener("click", () => {
          loadDetail(row.id).catch((err) => {
            alert(err.payload?.error || "Failed to load detail.");
          });
        });
        actionTd.appendChild(viewBtn);
        tr.appendChild(actionTd);

        tbody.appendChild(tr);
      });

      if (!result.rows.length) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 8;
        td.textContent = "No submissions found for current filters.";
        tr.appendChild(td);
        tbody.appendChild(tr);
      }

      pageLabel.textContent = `Page ${currentPage} / ${totalPages}`;
      tableMeta.textContent = `Total: ${result.total}`;
      prevBtn.disabled = currentPage <= 1;
      nextBtn.disabled = currentPage >= totalPages;
    };

    filtersForm.addEventListener("submit", (event) => {
      event.preventDefault();
      currentPage = 1;
      loadRows().catch((err) => {
        alert(err.payload?.error || "Failed to load submissions.");
      });
    });

    resetBtn.addEventListener("click", () => {
      filtersForm.reset();
      currentPage = 1;
      loadRows().catch((err) => {
        alert(err.payload?.error || "Failed to load submissions.");
      });
    });

    prevBtn.addEventListener("click", () => {
      if (currentPage <= 1) return;
      currentPage -= 1;
      loadRows().catch((err) => alert(err.payload?.error || "Failed to load submissions."));
    });

    nextBtn.addEventListener("click", () => {
      if (currentPage >= totalPages) return;
      currentPage += 1;
      loadRows().catch((err) => alert(err.payload?.error || "Failed to load submissions."));
    });

    exportBtn.addEventListener("click", () => {
      const query = toQuery(getFilterState());
      window.location.href = `/api/admin/submissions/export.csv?${query}`;
    });

    detailForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!selectedId) return;

      const payload = {
        status: detailForm.elements.status.value,
        admin_notes: detailForm.elements.admin_notes.value
      };

      try {
        await api(`/api/admin/submissions/${selectedId}`, { method: "PATCH", body: payload });
        detailSaveMsg.textContent = "Saved.";
        await loadRows();
        await loadDetail(selectedId);
      } catch (err) {
        detailSaveMsg.textContent = err.payload?.errors?.form || err.payload?.error || "Save failed.";
      }
    });

    detailOverlay.addEventListener("click", closeDetailSidebar);
    detailCloseBtn.addEventListener("click", closeDetailSidebar);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeDetailSidebar();
    });

    logoutBtn.addEventListener("click", async () => {
      try {
        await api("/api/admin/logout", { method: "POST" });
      } catch (_err) {
        // noop
      }
      window.location.href = "/admin/login.html";
    });

    await ensureSession();
    await loadRows();
  }

  initLoginPage();
  initDashboardPage();
})();
