const token = localStorage.getItem("token");
const overviewEl = document.getElementById("overview");
const contactsEl = null; // No contacts view for clients
const hiresEl = document.getElementById("hiresTable");
const projectsEl = document.getElementById("projectsGrid");
const projectForm = null;
const settingsEl = null;
const settingsForm = null;
const logoutBtn = document.getElementById("logoutBtn");
const refreshBtn = document.getElementById("refreshBtn");

if (!token) {
  alert("Not authenticated. Redirecting to login.");
  window.location.href = "/login";
}

async function fetchDashboard() {
  try {
    const res = await fetch("/api/dashboard-data", {
      headers: { Authorization: "Bearer " + token },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch");

    // data is now { success, user, hires, projects, isClientView }
    renderOverview(data);
    renderHires(data.hires || []);
    renderProjects(data.projects || []);

    // Hide admin-only sections if they exist in HTML
    if (contactsEl) contactsEl.style.display = "none";
    if (settingsEl) settingsEl.style.display = "none";

  } catch (err) {
    console.error(err);
    alert("Session expired. Please login again.");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }
}

function renderOverview(d) {
  overviewEl.innerHTML = "";
  const cards = [
    { label: "My Hire Requests", value: (d.hires || []).length },
    { label: "Active Projects", value: (d.projects || []).length },
    { label: "Profile Status", value: d.user ? "Verified" : "Pending" },
  ];

  cards.forEach((c) => {
    const el = document.createElement("div");
    el.className = "card";
    el.innerHTML = `<h3>${c.label}</h3><div style="font-size:24px;font-weight:700">${c.value}</div>`;
    overviewEl.appendChild(el);
  });
}

function renderProjects(list) {
  if (!projectsEl) return;
  if (!list.length) {
    projectsEl.innerHTML = "<p>No projects yet.</p>";
    return;
  }
  const ul = document.createElement("div");
  ul.style.display = "grid";
  ul.style.gridTemplateColumns = "repeat(auto-fit,minmax(220px,1fr))";
  ul.style.gap = "8px";
  list.forEach((p) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<h4>${escapeHtml(p.title)}</h4><div style="font-size:13px;color:#666">${escapeHtml(p.description || "")}</div><div style="margin-top:8px"><a href="${escapeHtml(p.liveUrl || "#")}" target="_blank">Live</a></div>`;
    ul.appendChild(card);
  });
  projectsEl.innerHTML = "";
  projectsEl.appendChild(ul);
}

function renderSettings(settings) {
  if (!settingsEl) return;
  settingsEl.innerHTML = `<div style="display:flex;gap:12px;flex-wrap:wrap"> <div>Clients: <strong>${settings.clients || 0}</strong></div><div>Years: <strong>${settings.years || 0}</strong></div><div>Team Members: <strong>${settings.team_members || 0}</strong></div></div>`;
}

function renderContacts(list) {
  if (!list.length) {
    contactsEl.innerHTML = "<p>No contacts yet.</p>";
    return;
  }
  const table = document.createElement("table");
  table.innerHTML =
    "<thead><tr><th>#</th><th>Name</th><th>Email</th><th>Project</th><th>When</th></tr></thead>";
  const tbody = document.createElement("tbody");
  list
    .slice()
    .reverse()
    .forEach((c, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${i + 1}</td><td>${escapeHtml(c.name)}</td><td>${escapeHtml(c.email)}</td><td>${escapeHtml(c.projectType)}</td><td>${new Date(c.timestamp).toLocaleString()}</td>`;
      tbody.appendChild(tr);
    });
  table.appendChild(tbody);
  contactsEl.innerHTML = "";
  contactsEl.appendChild(table);
}

function renderHires(list) {
  if (!list.length) {
    hiresEl.innerHTML = "<p>No hire requests yet.</p>";
    return;
  }
  const table = document.createElement("table");
  table.innerHTML =
    "<thead><tr><th>#</th><th>Name</th><th>Email</th><th>Role</th><th>When</th></tr></thead>";
  const tbody = document.createElement("tbody");
  list
    .slice()
    .reverse()
    .forEach((c, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${i + 1}</td><td>${escapeHtml(c.name)}</td><td>${escapeHtml(c.email)}</td><td>${escapeHtml(c.role)}</td><td>${new Date(c.timestamp).toLocaleString()}</td>`;
      tbody.appendChild(tr);
    });
  table.appendChild(tbody);
  hiresEl.innerHTML = "";
  hiresEl.appendChild(table);
}

function escapeHtml(s) {
  if (!s) return "";
  return String(s).replace(/[&<>"']/g, function (m) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[m];
  });
}

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
});

refreshBtn.addEventListener("click", () => fetchDashboard());

// Project create
if (projectForm) {
  projectForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      title: document.getElementById("p_title").value,
      description: document.getElementById("p_description").value,
      liveUrl: document.getElementById("p_liveUrl").value,
      image: document.getElementById("p_image").value,
    };
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      fetchDashboard();
      projectForm.reset();
      alert("Project created");
    } catch (err) {
      alert("Create project failed: " + err.message);
    }
  });
}

// Settings save
if (settingsForm) {
  settingsForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const clients = document.getElementById("s_clients").value;
    const years = document.getElementById("s_years").value;
    const team = document.getElementById("s_team").value;
    try {
      const entries = [
        ["clients", clients],
        ["years", years],
        ["team_members", team],
      ];
      for (const [k, v] of entries) {
        if (v === "") continue;
        await fetch("/api/settings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({ key: k, value: v }),
        });
      }
      alert("Settings saved");
      fetchDashboard();
    } catch (err) {
      alert("Failed saving settings: " + err.message);
    }
  });
}

fetchDashboard();
