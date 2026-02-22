/**
 * Kalpa Preeth Admin Dashboard Logic
 * Modern & Stunning Implementation
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Auth Check
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/login";
    return;
  }

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (!user.isAdmin) {
    window.location.href = "/dashboard";
    return;
  }

  // Initialize UI
  document.getElementById('adminName').textContent = user.name || 'Admin';

  // Initial Load
  loadOverviewData();

  // Auto-refresh stats every 5 minutes
  setInterval(loadOverviewData, 300000);
});

async function loadOverviewData() {
  const token = localStorage.getItem("token");
  try {
    const response = await fetch("/api/admin/stats", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();

    if (!response.ok) throw new Error(data.error || "Failed to load stats");

    const { stats, recent } = data;

    // Populate Stats
    document.getElementById("count-projects").textContent = stats.projects || 0;
    document.getElementById("count-applications").textContent = stats.hires || 0;
    document.getElementById("count-talents").textContent = stats.talents || 0;
    document.getElementById("count-messages").textContent = stats.contacts || 0;

    // Populate Recent Hire Requests
    const recentHires = recent.recentHires || [];
    const hiresList = document.getElementById("recent-hires-list");

    if (recentHires.length === 0) {
      hiresList.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">No recent requests</p>';
    } else {
      hiresList.innerHTML = recentHires.map(h => `
                <div class="recent-item">
                    <div class="item-avatar">${(h.talentName || 'T').charAt(0)}</div>
                    <div class="item-text">
                        <h4>${h.talentName}</h4>
                        <p>${h.clientEmail} • ${new Date(h.timestamp).toLocaleDateString()}</p>
                    </div>
                    <span class="badge badge-success">New</span>
                </div>
            `).join('');
    }

  } catch (error) {
    console.error("Error loading overview data:", error);
  }
}

// Tab Switching & Section Loading
async function switchTab(tabId, el) {
  // Visual update
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  document.getElementById(tabId).classList.add('active');
  if (el) el.classList.add('active');

  document.getElementById('panelTitle').textContent = tabId.charAt(0).toUpperCase() + tabId.slice(1);

  // Data Loading
  if (tabId === 'projects') loadProjects();
  if (tabId === 'overview') loadOverviewData();
}

async function loadProjects() {
  const container = document.getElementById('projects-list-full');
  const token = localStorage.getItem("token");

  try {
    const response = await fetch("/api/projects", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const projects = await response.json();

    if (projects.length === 0) {
      container.innerHTML = '<div style="text-align:center; padding: 40px; color: var(--text-muted);">No projects found. Launch your first project!</div>';
      return;
    }

    container.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
                ${projects.map(p => `
                    <div class="card-panel" style="padding: 20px; transition: 0.3s; border: 1px solid var(--border);">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                            <h3 style="font-size: 1.1rem; font-weight: 700;">${p.title}</h3>
                            <span class="badge" style="background:#f1f5f9; color: var(--primary);">${p.category}</span>
                        </div>
                        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 15px; line-height: 1.5;">${(p.description || '').substring(0, 100)}...</p>
                        <div style="display: flex; gap: 8px; margin-top: auto;">
                            <button class="btn-action" style="flex: 1; padding: 8px; font-size: 0.8rem; background: #f8fafc; border: 1px solid var(--border);" onclick="editProject('${p._id}')">Edit</button>
                            <button class="btn-action" style="flex: 1; padding: 8px; font-size: 0.8rem; background: #fef2f2; color: #ef4444;" onclick="deleteProject('${p._id}')">Delete</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
  } catch (error) {
    container.innerHTML = '<p style="color: #ef4444;">Failed to load projects.</p>';
  }
}

// Modal Handlers
function showModal(type) {
  document.getElementById(`modal-${type}`).classList.add('active');
}

function closeModal() {
  document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
}

async function deleteProject(id) {
  if (!confirm("Are you sure you want to delete this project?")) return;
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`/api/projects/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      loadProjects();
      loadOverviewData();
    }
  } catch (e) { console.error(e); }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

// Global exposure for onclick attributes
window.switchTab = switchTab;
window.showModal = showModal;
window.closeModal = closeModal;
window.editProject = (id) => alert('Edit feature coming soon to this stunning UI!');
window.deleteProject = deleteProject;
window.logout = logout;
