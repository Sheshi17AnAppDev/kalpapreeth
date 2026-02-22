// DOM Elements
const sidebarNav = document.querySelectorAll(".nav-item");
const tabContents = document.querySelectorAll(".tab-content");
const pageTitle = document.getElementById("pageTitle");
const logoutBtn = document.querySelector(".logout-btn");
const searchServices = document.getElementById("searchServices");
const categoryFilter = document.getElementById("categoryFilter");
const servicesGrid = document.getElementById("servicesGrid");
const activeHiresList = document.getElementById("activeHiresList");
const completedHiresList = document.getElementById("completedHiresList");
const profileForm = document.getElementById("profileForm");
const serviceModal = document.getElementById("serviceModal");
const modalClose = document.querySelector(".modal-close");
const hireServiceBtn = document.getElementById("hireServiceBtn");
const activityList = document.getElementById("activityList");

// State
let allServices = [];
let activeHires = [];
let completedHires = [];
let selectedService = null;
let currentUser = null;

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  checkAuthAndLoadPage();
});

// Check authentication
async function checkAuthAndLoadPage() {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  if (!token || !user) {
    window.location.href = "/login";
    return;
  }

  currentUser = JSON.parse(user);
  updateUserInfo();
  setupEventListeners();
  loadDashboardData();
}

// Update user info
function updateUserInfo() {
  const userName = document.getElementById("userName");
  const profileName = document.getElementById("profileName");
  const profileEmail = document.getElementById("profileEmail");

  if (currentUser) {
    userName.textContent = `Welcome, ${currentUser.name}`;
    profileName.value = currentUser.name || "";
    profileEmail.value = currentUser.email || "";
  }
}

// Setup event listeners
function setupEventListeners() {
  // Sidebar navigation
  sidebarNav.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const tabName = item.dataset.tab;
      switchTab(tabName);
    });
  });

  // Search and filter
  searchServices.addEventListener("input", filterServices);
  categoryFilter.addEventListener("change", filterServices);

  // Modal
  modalClose.addEventListener("click", closeModal);
  serviceModal.addEventListener("click", (e) => {
    if (e.target === serviceModal) closeModal();
  });

  // Hire button
  hireServiceBtn.addEventListener("click", handleHireService);

  // Profile form
  profileForm.addEventListener("submit", handleProfileUpdate);

  // Logout
  logoutBtn.addEventListener("click", handleLogout);
}

// Switch tabs
function switchTab(tabName) {
  // Remove active from all nav items and tab contents
  sidebarNav.forEach((item) => item.classList.remove("active"));
  tabContents.forEach((tab) => tab.classList.remove("active"));

  // Add active to clicked nav item and corresponding tab
  document.querySelector(`[data-tab="${tabName}"]`).classList.add("active");
  document.getElementById(tabName).classList.add("active");

  // Update page title
  const titles = {
    overview: "Overview",
    services: "Available Services",
    "active-hires": "Active Hires",
    completed: "Completed Hires",
    profile: "My Profile",
  };
  pageTitle.textContent = titles[tabName] || "Overview";
}

// Load dashboard data
async function loadDashboardData() {
  try {
    const token = localStorage.getItem("token");

    // Load services
    await loadServices(token);

    // Load hires
    await loadHires(token);

    // Update stats
    updateStats();

    // Load activity
    loadActivity();
  } catch (error) {
    console.error("Error loading dashboard data:", error);
    showNotification("Error loading dashboard data", "error");
  }
}

// Load services from API
async function loadServices(token) {
  try {
    const response = await fetch("/api/projects", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Failed to load services");

    const data = await response.json();
    allServices = Array.isArray(data) ? data : data.projects || [];
    renderServices(allServices);
  } catch (error) {
    console.error("Error loading services:", error);
    servicesGrid.innerHTML =
      '<p class="empty-state">Error loading services</p>';
  }
}

// Load hires from API
async function loadHires(token) {
  try {
    const response = await fetch("/api/hires", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Failed to load hires");

    const data = await response.json();
    const allHiresData = Array.isArray(data) ? data : data.hires || [];

    // Separate active and completed hires
    activeHires = allHiresData.filter((h) => h.status === "active");
    completedHires = allHiresData.filter((h) => h.status === "completed");

    renderActiveHires();
    renderCompletedHires();
  } catch (error) {
    console.error("Error loading hires:", error);
  }
}

// Render services
function renderServices(services) {
  if (!services || services.length === 0) {
    servicesGrid.innerHTML = '<p class="empty-state">No services available</p>';
    return;
  }

  servicesGrid.innerHTML = services
    .map(
      (service) => `
    <div class="service-card" data-id="${service._id}">
      <img 
        src="${service.image || "/assets/default-service.jpg"}" 
        alt="${service.title}" 
        class="service-image"
        onerror="this.src='/assets/kp2.1.png'"
      />
      <div class="service-info">
        <div class="service-category">${service.category || "Service"}</div>
        <div class="service-name">${service.title || "Untitled Service"}</div>
        <div class="service-description">${(service.description || "").substring(0, 80)}...</div>
        <div class="service-footer">
          <div class="service-price">$${service.price || "0"}</div>
          <div class="service-duration">${service.duration || "7 days"}</div>
        </div>
      </div>
    </div>
  `,
    )
    .join("");

  // Add click listeners to service cards
  document.querySelectorAll(".service-card").forEach((card) => {
    card.addEventListener("click", () => {
      const serviceId = card.dataset.id;
      const service = allServices.find((s) => s._id === serviceId);
      openServiceModal(service);
    });
  });
}

// Filter services
function filterServices() {
  const searchTerm = searchServices.value.toLowerCase();
  const category = categoryFilter.value;

  const filtered = allServices.filter((service) => {
    const matchesSearch =
      !searchTerm ||
      (service.title || "").toLowerCase().includes(searchTerm) ||
      (service.description || "").toLowerCase().includes(searchTerm);

    const matchesCategory = !category || service.category === category;

    return matchesSearch && matchesCategory;
  });

  renderServices(filtered);
}

// Open service modal
function openServiceModal(service) {
  if (!service) return;

  selectedService = service;

  document.getElementById("modalServiceImage").src =
    service.image || "/assets/default-service.jpg";
  document.getElementById("modalServiceTitle").textContent =
    service.title || "Service";
  document.getElementById("modalServiceDesc").textContent =
    service.description || "No description available";
  document.getElementById("modalServicePrice").textContent = `$${
    service.price || "0"
  }`;
  document.getElementById("modalServiceDuration").textContent =
    service.duration || "Not specified";
  document.getElementById("modalServiceCategory").textContent =
    service.category || "N/A";

  serviceModal.classList.add("active");
}

// Close modal
function closeModal() {
  serviceModal.classList.remove("active");
  selectedService = null;
}

// Handle hire service
async function handleHireService() {
  if (!selectedService) return;

  const token = localStorage.getItem("token");

  try {
    hireServiceBtn.disabled = true;
    hireServiceBtn.textContent = "Processing...";

    const response = await fetch("/api/hire", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: currentUser.name,
        email: currentUser.email,
        role: selectedService.title,
        budget: selectedService.price,
        message: `Interested in hiring: ${selectedService.title}`,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      showNotification("Service hire request submitted!", "success");
      closeModal();
      setTimeout(() => {
        loadHires(token);
      }, 1000);
    } else {
      throw new Error(data.error || "Failed to submit hire request");
    }
  } catch (error) {
    console.error("Error hiring service:", error);
    showNotification(error.message || "Error submitting hire request", "error");
  } finally {
    hireServiceBtn.disabled = false;
    hireServiceBtn.textContent = "Hire This Service";
  }
}

// Render active hires
function renderActiveHires() {
  if (!activeHires || activeHires.length === 0) {
    activeHiresList.innerHTML = '<p class="empty-state">No active hires</p>';
    return;
  }

  activeHiresList.innerHTML = activeHires
    .map(
      (hire) => `
    <div class="hire-item">
      <div class="hire-info">
        <div class="hire-title">${hire.role || "Hire Request"}</div>
        <div class="hire-meta">
          <div class="hire-meta-item">📧 ${hire.email}</div>
          <div class="hire-meta-item">💼 ${hire.name}</div>
          <div class="hire-meta-item">📅 ${formatDate(hire.createdAt)}</div>
        </div>
        <span class="hire-status active">Active</span>
      </div>
      <div class="hire-price">$${hire.budget || "0"}</div>
    </div>
  `,
    )
    .join("");
}

// Render completed hires
function renderCompletedHires() {
  if (!completedHires || completedHires.length === 0) {
    completedHiresList.innerHTML =
      '<p class="empty-state">No completed hires</p>';
    return;
  }

  completedHiresList.innerHTML = completedHires
    .map(
      (hire) => `
    <div class="hire-item">
      <div class="hire-info">
        <div class="hire-title">${hire.role || "Hire Request"}</div>
        <div class="hire-meta">
          <div class="hire-meta-item">📧 ${hire.email}</div>
          <div class="hire-meta-item">💼 ${hire.name}</div>
          <div class="hire-meta-item">✓ ${formatDate(hire.completedAt || hire.createdAt)}</div>
        </div>
        <span class="hire-status completed">Completed</span>
      </div>
      <div class="hire-price">$${hire.budget || "0"}</div>
    </div>
  `,
    )
    .join("");
}

// Update stats
function updateStats() {
  document.getElementById("activeCount").textContent = activeHires.length;
  document.getElementById("completedCount").textContent = completedHires.length;

  const totalSpent =
    activeHires.reduce((sum, h) => sum + (parseFloat(h.budget) || 0), 0) +
    completedHires.reduce((sum, h) => sum + (parseFloat(h.budget) || 0), 0);
  document.getElementById("totalSpent").textContent =
    `$${totalSpent.toFixed(2)}`;

  document.getElementById("servicesCount").textContent = allServices.length;
}

// Load activity
function loadActivity() {
  const activities = [];

  // Add recent hires to activity
  activeHires.slice(0, 3).forEach((hire) => {
    activities.push({
      description: `Hired for ${hire.role}`,
      date: formatDate(hire.createdAt),
      type: "hire",
    });
  });

  if (activities.length === 0) {
    activityList.innerHTML = '<p class="empty-state">No recent activity</p>';
    return;
  }

  activityList.innerHTML = activities
    .map(
      (activity) => `
    <div class="activity-item">
      <div class="activity-description">
        <strong>${activity.description}</strong>
        <small>${activity.date}</small>
      </div>
    </div>
  `,
    )
    .join("");
}

// Handle profile update
async function handleProfileUpdate(e) {
  e.preventDefault();

  const token = localStorage.getItem("token");
  const name = document.getElementById("profileName").value;
  const email = document.getElementById("profileEmail").value;
  const phone = document.getElementById("profilePhone").value;
  const company = document.getElementById("profileCompany").value;
  const bio = document.getElementById("profileBio").value;

  try {
    // Update local storage
    const updatedUser = { ...currentUser, name, email, phone, company, bio };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    currentUser = updatedUser;
    updateUserInfo();

    showNotification("Profile updated successfully!", "success");
  } catch (error) {
    console.error("Error updating profile:", error);
    showNotification("Error updating profile", "error");
  }
}

// Handle logout
function handleLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
}

// Utility functions
function formatDate(dateString) {
  if (!dateString) return "Just now";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;

  return date.toLocaleDateString();
}

function showNotification(message, type = "info") {
  const existing = document.querySelector(".notification");
  if (existing) existing.remove();

  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === "success" ? "var(--success)" : "var(--error)"};
    color: var(--bg-dark);
    padding: 1rem 1.5rem;
    border-radius: 12px;
    font-weight: 600;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    transform: translateX(400px);
    transition: transform 0.3s ease;
    z-index: 2000;
    max-width: 300px;
  `;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.transform = "translateX(0)";
  }, 100);

  setTimeout(() => {
    notification.style.transform = "translateX(400px)";
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}
