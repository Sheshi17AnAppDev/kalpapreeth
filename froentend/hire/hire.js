let talents = [];
let currentTalent = null;

// Load talents on page init
document.addEventListener("DOMContentLoaded", () => {
  loadTalents();
  setupSearch();
});

// Load all available talents
async function loadTalents() {
  try {
    const response = await fetch("/api/talents");
    talents = await response.json();
    renderTalents(talents);
  } catch (error) {
    console.error("Error loading talents:", error);
    showNotification("Failed to load talents", "error");
    document.getElementById("talentsGrid").innerHTML = '<p class="loading">No talents available yet</p>';
  }
}

// Render talents in grid
function renderTalents(talentsList) {
  const grid = document.getElementById("talentsGrid");
  
  if (talentsList.length === 0) {
    grid.innerHTML = '<p class="loading">No talents available yet</p>';
    return;
  }

  grid.innerHTML = talentsList.map((talent) => `
    <div class="talent-card">
      <div class="talent-avatar">${talent.name.charAt(0).toUpperCase()}</div>
      <div class="talent-info">
        <h3 class="talent-name">${escapeHtml(talent.name)}</h3>
        <p class="talent-title">${escapeHtml(talent.title || "Professional")}</p>
        
        <div class="talent-rating">
          <span class="stars">${renderStars(talent.rating)}</span>
          <span>${talent.rating || 0} (${talent.reviews || 0} reviews)</span>
        </div>

        <div class="talent-skills">
          ${(talent.skills || []).slice(0, 3).map(skill => 
            `<span class="skill-tag">${escapeHtml(skill)}</span>`
          ).join('')}
        </div>

        <div class="talent-rate">
          <span class="hourly">$${talent.hourlyRate || 'TBD'}/hr</span>
          <span class="availability">${talent.availability}</span>
        </div>

        <div class="talent-actions">
          <button class="btn-view" onclick="viewTalent('${talent._id}')">View Profile</button>
          <button class="btn-hire" onclick="openHireModal('${talent._id}', '${escapeHtml(talent.name)}', '${talent.email}')">Hire</button>
        </div>
      </div>
    </div>
  `).join("");
}

// Render star rating
function renderStars(rating) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  let stars = "★".repeat(fullStars);
  if (hasHalf) stars += "✨";
  return stars;
}

// Search functionality
function setupSearch() {
  const searchInput = document.getElementById("searchInput");
  searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = talents.filter(talent => 
      talent.name.toLowerCase().includes(searchTerm) ||
      talent.title.toLowerCase().includes(searchTerm) ||
      (talent.skills || []).some(skill => skill.toLowerCase().includes(searchTerm))
    );
    renderTalents(filtered);
  });
}

// View talent details
function viewTalent(talentId) {
  const talent = talents.find(t => t._id === talentId);
  if (!talent) return;

  currentTalent = talent;
  const detail = document.getElementById("talentDetailBody");
  
  detail.innerHTML = `
    <div class="talent-detail-header">
      <div class="talent-detail-avatar">${talent.name.charAt(0).toUpperCase()}</div>
      <h3 class="talent-detail-name">${escapeHtml(talent.name)}</h3>
      <p class="talent-detail-title">${escapeHtml(talent.title || "Professional")}</p>
    </div>
    
    <div class="talent-detail-content">
      <div class="detail-section">
        <h3>About</h3>
        <p>${escapeHtml(talent.bio || "Experienced professional")}</p>
      </div>

      <div class="detail-section">
        <h3>Skills</h3>
        <div class="detail-skills">
          ${(talent.skills || []).map(skill => 
            `<span class="skill-tag">${escapeHtml(skill)}</span>`
          ).join('')}
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-info">
          <div class="detail-item">
            <label>Hourly Rate</label>
            <p>$${talent.hourlyRate || 'TBD'}</p>
          </div>
          <div class="detail-item">
            <label>Availability</label>
            <p>${talent.availability}</p>
          </div>
          <div class="detail-item">
            <label>Experience</label>
            <p>${talent.experience || 'Not specified'}</p>
          </div>
          <div class="detail-item">
            <label>Projects Completed</label>
            <p>${talent.completedProjects || 0}</p>
          </div>
          <div class="detail-item">
            <label>Rating</label>
            <p>${renderStars(talent.rating)}</p>
          </div>
          <div class="detail-item">
            <label>Reviews</label>
            <p>${talent.reviews || 0}</p>
          </div>
        </div>
      </div>

      ${talent.portfolio ? `
        <div class="detail-section">
          <h3>Portfolio</h3>
          <p><a href="${escapeHtml(talent.portfolio)}" target="_blank" style="color: var(--primary-color); text-decoration: underline;">View Portfolio</a></p>
        </div>
      ` : ''}

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" onclick="closeTalentModal()">Close</button>
        <button type="button" class="btn btn-primary" onclick="openHireModal('${talent._id}', '${escapeHtml(talent.name)}', '${talent.email}')">Hire This Talent</button>
      </div>
    </div>
  `;

  document.getElementById("talentModal").classList.add("active");
}

// Open hire modal
function openHireModal(talentId, talentName, talentEmail) {
  currentTalent = talents.find(t => t._id === talentId);
  
  document.getElementById("talentIdInput").value = talentId;
  document.getElementById("talentNameInput").value = talentName;
  document.getElementById("talentEmailInput").value = talentEmail;
  document.getElementById("talentNameInModal").textContent = talentName;
  
  document.getElementById("projectName").value = "";
  document.getElementById("projectDescription").value = "";
  document.getElementById("role").value = "";
  document.getElementById("budget").value = "";
  document.getElementById("duration").value = "";
  document.getElementById("message").value = "";

  document.getElementById("hireModal").classList.add("active");
}

// Close hire modal
function closeHireModal() {
  document.getElementById("hireModal").classList.remove("active");
}

// Close talent modal
function closeTalentModal() {
  document.getElementById("talentModal").classList.remove("active");
}

// Submit hire request
document.getElementById("hireForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const token = localStorage.getItem("token");
  const hireData = {
    talentId: document.getElementById("talentIdInput").value,
    talentName: document.getElementById("talentNameInput").value,
    talentEmail: document.getElementById("talentEmailInput").value,
    projectName: document.getElementById("projectName").value,
    projectDescription: document.getElementById("projectDescription").value,
    role: document.getElementById("role").value,
    budget: document.getElementById("budget").value,
    duration: document.getElementById("duration").value,
    message: document.getElementById("message").value,
  };

  if (!hireData.projectName || !hireData.role) {
    showNotification("Project name and role are required", "error");
    return;
  }

  try {
    const response = await fetch("/api/hire", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: JSON.stringify(hireData),
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error || "Failed to send hire request");

    showNotification("Hire request sent successfully! The talent will review your request.", "success");
    closeHireModal();
  } catch (error) {
    console.error("Hire error:", error);
    showNotification(error.message || "Failed to send hire request", "error");
  }
});

// Utility functions
function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 2rem;
    right: 2rem;
    padding: 1rem 1.5rem;
    background: ${type === "error" ? "var(--error)" : type === "success" ? "var(--success)" : "var(--primary-color)"};
    color: var(--bg-dark);
    border-radius: 8px;
    z-index: 2000;
    animation: slideIn 0.3s ease-out;
    font-weight: 600;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease-out forwards";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add notification animations
const style = document.createElement("style");
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
    right: "20px",
    padding: "12px 16px",
    background: type === "success" ? "#16a34a" : "#ef4444",
    color: "#fff",
    borderRadius: "8px",
    zIndex: 9999,
  });
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 5000);
}
