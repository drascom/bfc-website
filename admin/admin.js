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
        viewBtn.className = "icon-btn ghost-btn";
        viewBtn.innerHTML = '<svg class="icon"><use href="#icon-eye"></use></svg>';
        viewBtn.title = "View details";
        viewBtn.setAttribute("aria-label", "View details");
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

    const applyFiltersNow = () => {
      currentPage = 1;
      loadRows().catch((err) => {
        alert(err.payload?.error || "Failed to load submissions.");
      });
    };

    let searchDebounceTimer = null;
    filtersForm.querySelectorAll("select, input[type=date]").forEach((field) => {
      field.addEventListener("change", applyFiltersNow);
    });

    const searchField = filtersForm.querySelector("input[name=q]");
    if (searchField) {
      searchField.addEventListener("input", () => {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(applyFiltersNow, 350);
      });
    }

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

  function createTextCell(text) {
    const td = document.createElement("td");
    td.textContent = text == null || text === "" ? "-" : String(text);
    return td;
  }

  async function initUsersPage() {
    const tbody = document.getElementById("users-tbody");
    if (!tbody) return;

    const usersMeta = document.getElementById("users-meta");
    const createForm = document.getElementById("user-create-form");
    const createMsg = document.getElementById("user-create-msg");
    const editOverlay = document.getElementById("user-edit-overlay");
    const editSidebar = document.getElementById("user-edit-sidebar");
    const editCloseBtn = document.getElementById("user-edit-close-btn");
    const editForm = document.getElementById("user-edit-form");
    const editMsg = document.getElementById("user-edit-msg");

    let editingId = null;
    let currentUserId = null;

    const openEdit = () => {
      editOverlay.hidden = false;
      editSidebar.classList.add("is-open");
      editSidebar.setAttribute("aria-hidden", "false");
    };

    const closeEdit = () => {
      editSidebar.classList.remove("is-open");
      editSidebar.setAttribute("aria-hidden", "true");
      editOverlay.hidden = true;
      editingId = null;
    };

    const loadUsers = async () => {
      const result = await api("/api/admin/users");
      tbody.innerHTML = "";

      result.rows.forEach((row) => {
        const tr = document.createElement("tr");
        tr.appendChild(createTextCell(row.email));
        tr.appendChild(createTextCell(formatDate(row.created_at)));
        tr.appendChild(createTextCell(formatDate(row.last_login_at)));

        const actionTd = document.createElement("td");

        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "icon-btn ghost-btn";
        editBtn.innerHTML = '<svg class="icon"><use href="#icon-edit"></use></svg>';
        editBtn.title = "Edit user";
        editBtn.setAttribute("aria-label", "Edit user");
        editBtn.addEventListener("click", () => {
          editingId = row.id;
          editForm.elements.email.value = row.email;
          editForm.elements.password.value = "";
          editMsg.textContent = "";
          openEdit();
        });
        actionTd.appendChild(editBtn);

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.innerHTML = '<svg class="icon"><use href="#icon-trash"></use></svg>';
        deleteBtn.className = "icon-btn ghost-btn";
        deleteBtn.style.marginLeft = "0.4rem";
        deleteBtn.title = "Delete user";
        deleteBtn.setAttribute("aria-label", "Delete user");
        if (row.id === currentUserId) {
          deleteBtn.disabled = true;
          deleteBtn.title = "You cannot delete your own account.";
          deleteBtn.setAttribute("aria-label", deleteBtn.title);
        }
        deleteBtn.addEventListener("click", async () => {
          if (!window.confirm(`Delete admin user ${row.email}?`)) return;
          try {
            await api(`/api/admin/users/${row.id}`, { method: "DELETE" });
            await loadUsers();
          } catch (err) {
            alert(err.payload?.error || "Failed to delete admin user.");
          }
        });
        actionTd.appendChild(deleteBtn);

        tr.appendChild(actionTd);
        tbody.appendChild(tr);
      });

      if (!result.rows.length) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 4;
        td.textContent = "No admin users found.";
        tr.appendChild(td);
        tbody.appendChild(tr);
      }

      usersMeta.textContent = `Total: ${result.rows.length}`;
    };

    createForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      createMsg.textContent = "";
      const fd = new FormData(createForm);
      const payload = Object.fromEntries(fd.entries());

      try {
        await api("/api/admin/users", { method: "POST", body: payload });
        createForm.reset();
        await loadUsers();
      } catch (err) {
        createMsg.textContent =
          err.payload?.errors?.email || err.payload?.errors?.password || err.payload?.errors?.form || "Failed to add user.";
      }
    });

    editForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!editingId) return;
      editMsg.textContent = "";

      const payload = { email: editForm.elements.email.value };
      if (editForm.elements.password.value) {
        payload.password = editForm.elements.password.value;
      }

      try {
        await api(`/api/admin/users/${editingId}`, { method: "PATCH", body: payload });
        closeEdit();
        await loadUsers();
      } catch (err) {
        editMsg.textContent =
          err.payload?.errors?.email || err.payload?.errors?.password || err.payload?.errors?.form || "Failed to save user.";
      }
    });

    editOverlay.addEventListener("click", closeEdit);
    editCloseBtn.addEventListener("click", closeEdit);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeEdit();
    });

    try {
      const session = await api("/api/admin/session");
      currentUserId = session.user?.id ?? null;
    } catch (_err) {
      // session handled elsewhere
    }

    await loadUsers();
  }

  function initTabs() {
    const tabs = document.querySelectorAll(".admin-tab");
    if (!tabs.length) return;

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const target = tab.dataset.tab;

        document.querySelectorAll(".admin-tab").forEach((btn) => {
          const isActive = btn === tab;
          btn.classList.toggle("is-active", isActive);
          btn.setAttribute("aria-selected", String(isActive));
        });

        document.querySelectorAll(".admin-tab-panel").forEach((panel) => {
          panel.classList.toggle("is-active", panel.id === `tab-${target}`);
        });
      });
    });
  }

  function initTheme() {
    const btn = document.getElementById("theme-toggle-btn");
    if (!btn) return;

    const iconUse = document.getElementById("theme-toggle-icon");

    const applyIcon = (theme) => {
      if (iconUse) iconUse.setAttribute("href", theme === "dark" ? "#icon-sun" : "#icon-moon");
      btn.title = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
      btn.setAttribute("aria-label", btn.title);
    };

    applyIcon(document.documentElement.getAttribute("data-theme") || "light");

    btn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("bfc-admin-theme", next);
      applyIcon(next);
    });
  }

  initLoginPage();
  initDashboardPage();
  initUsersPage();
  initTabs();
  initTheme();
})();
