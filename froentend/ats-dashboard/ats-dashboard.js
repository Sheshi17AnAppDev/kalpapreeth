// Global state
let allApplications = [];
let allJobs = [];
let currentTab = "applications";

// Check authentication
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/login";
    return;
  }

  setupEventListeners();
  loadApplications();
  loadJobs();
  switchTab("applications");
});

// Setup event listeners
function setupEventListeners() {
  // Tab switching
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      const tab = e.currentTarget.getAttribute("data-tab");
      if (tab) switchTab(tab);
    });
  });

  // Logout
  document.getElementById("logoutBtn").addEventListener("click", logout);

  // Applications filters
  document
    .getElementById("searchApplications")
    .addEventListener("input", filterApplications);
  document
    .getElementById("statusFilter")
    .addEventListener("change", filterApplications);
  document
    .getElementById("jobFilter")
    .addEventListener("change", filterApplications);

  // Jobs search
  document.getElementById("searchJobs").addEventListener("input", filterJobs);

  // New job button
  document
    .getElementById("newJobBtn")
    .addEventListener("click", openNewJobModal);

  // Modal close buttons
  const appModalCloseBtn = document.querySelector(
    "#applicationModal .modal-close",
  );
  const jobModalCloseBtn = document.querySelector("#newJobModal .modal-close");
  if (appModalCloseBtn)
    appModalCloseBtn.addEventListener("click", closeAppModal);
  if (jobModalCloseBtn)
    jobModalCloseBtn.addEventListener("click", closeJobModal);

  // Modal submit buttons
  document
    .getElementById("updateStatusBtn")
    .addEventListener("click", updateApplicationStatus);
  document
    .getElementById("deleteApplicationBtn")
    .addEventListener("click", () => {
      if (confirm("Are you sure you want to delete this application?")) {
        deleteApplication();
      }
    });

  const jobForm = document.getElementById("newJobForm");
  if (jobForm) jobForm.addEventListener("submit", submitNewJob);

  // Click outside modal to close
  window.addEventListener("click", (e) => {
    if (e.target.id === "applicationModal") closeAppModal();
    if (e.target.id === "newJobModal") closeJobModal();
  });
}

// Switch between tabs
function switchTab(tab) {
  currentTab = tab;

  // Update nav items
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.remove("active");
    if (item.getAttribute("data-tab") === tab) {
      item.classList.add("active");
    }
  });

  // Update content
  document.querySelectorAll(".tab-content").forEach((content) => {
    content.classList.remove("active");
  });
  document.getElementById(tab + "Tab").classList.add("active");

  // Update title
  const titles = {
    applications: "Job Applications",
    jobs: "Job Postings",
  };
  document.querySelector(".topbar h2").textContent = titles[tab];
}

// Load applications
async function loadApplications() {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/job-applications", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Failed to load applications");

    allApplications = await response.json();
    updateApplicationsStats();
    renderApplications(allApplications);
  } catch (error) {
    console.error("Error loading applications:", error);
    showNotification("Failed to load applications", "error");
  }
}

// Load jobs
async function loadJobs() {
  try {
    const response = await fetch("/api/jobs");
    if (!response.ok) throw new Error("Failed to load jobs");

    allJobs = await response.json();
    updateJobFilter();
    renderJobs(allJobs);
  } catch (error) {
    console.error("Error loading jobs:", error);
    showNotification("Failed to load jobs", "error");
  }
}

// Render applications table
function renderApplications(applications) {
  const tbody = document.querySelector(".applications-table tbody");
  tbody.innerHTML = "";

  if (applications.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No applications found</td></tr>';
    return;
  }

  applications.forEach((app) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <div class="candidate-name">${app.candidateName}</div>
        <div class="candidate-email">${app.candidateEmail}</div>
      </td>
      <td>${app.jobTitle || "N/A"}</td>
      <td>${app.candidatePhone || "N/A"}</td>
      <td>
        <span class="status-badge status-${app.status}">${app.status}</span>
      </td>
      <td>${new Date(app.appliedAt).toLocaleDateString()}</td>
      <td class="action-btn-cell">
        <button class="view-btn" onclick="viewApplication('${app._id}')">View</button>
        <button class="delete-btn" onclick="deleteApplicationFromTable('${app._id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Filter applications
function filterApplications() {
  const search = document.getElementById("searchApps").value.toLowerCase();
  const status = document.getElementById("statusFilter").value;
  const job = document.getElementById("jobFilter").value;

  const filtered = allApplications.filter((app) => {
    const matchSearch =
      app.candidateName.toLowerCase().includes(search) ||
      app.candidateEmail.toLowerCase().includes(search);
    const matchStatus = !status || app.status === status;
    const matchJob = !job || app.jobId === job;

    return matchSearch && matchStatus && matchJob;
  });

  renderApplications(filtered);
}

// View application details
function viewApplication(appId) {
  const app = allApplications.find((a) => a._id === appId);
  if (!app) return;

  document.getElementById("modalCandidateName").textContent = app.candidateName;
  document.getElementById("modalJobTitle").textContent = app.jobTitle || "N/A";

  document.getElementById("detailName").textContent = app.candidateName;
  document.getElementById("detailEmail").textContent = app.candidateEmail;
  document.getElementById("detailPhone").textContent =
    app.candidatePhone || "N/A";

  if (app.portfolioLink) {
    document.getElementById("detailPortfolio").innerHTML =
      `<a href="${app.portfolioLink}" target="_blank">${app.portfolioLink}</a>`;
  } else {
    document.getElementById("detailPortfolio").textContent = "Not provided";
  }

  const coverLetterGroup = document.getElementById("coverLetterGroup");
  if (app.coverLetter) {
    coverLetterGroup.style.display = "block";
    document.getElementById("detailCoverLetter").textContent = app.coverLetter;
  } else {
    coverLetterGroup.style.display = "none";
  }

  const resumePath = app.resumePath || app.resume;
  const baseUrl = window.location.origin;
  const resumeUrl = baseUrl + "/" + resumePath;

  document.getElementById("downloadResumeBtn").href = resumeUrl;
  document.getElementById("downloadResumeBtn").download =
    app.resumeOriginalName || "resume.pdf";

  // Set up status update
  document.getElementById("statusSelect").value = app.status;

  // Store the appId for later use in updateApplicationStatus
  document.getElementById("applicationModal").dataset.appId = appId;

  document.getElementById("applicationModal").classList.add("active");
}

// Update application status
async function updateApplicationStatus() {
  try {
    const appId = document.getElementById("applicationModal").dataset.appId;
    const status = document.getElementById("statusSelect").value;
    const token = localStorage.getItem("token");

    const response = await fetch(`/api/job-applications/${appId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) throw new Error("Failed to update status");

    showNotification("Application status updated successfully", "success");
    closeAppModal();
    loadApplications();
  } catch (error) {
    console.error("Error updating status:", error);
    showNotification("Failed to update status", "error");
  }
}

// Delete application
async function deleteApplication() {
  try {
    const appId = document.getElementById("applicationModal").dataset.appId;
    const token = localStorage.getItem("token");

    const response = await fetch(`/api/job-applications/${appId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Failed to delete application");

    showNotification("Application deleted successfully", "success");
    closeAppModal();
    loadApplications();
  } catch (error) {
    console.error("Error deleting application:", error);
    showNotification("Failed to delete application", "error");
  }
}

// Delete application from table
function deleteApplicationFromTable(appId) {
  if (confirm("Are you sure you want to delete this application?")) {
    (async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(`/api/job-applications/${appId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to delete application");

        showNotification("Application deleted successfully", "success");
        loadApplications();
      } catch (error) {
        console.error("Error deleting application:", error);
        showNotification("Failed to delete application", "error");
      }
    })();
  }
}

// Delete application with confirmation (old function for backward compatibility - REMOVED)
function deleteApplicationConfirm(appId) {
  if (confirm("Are you sure you want to delete this application?")) {
    deleteApplicationFromTable(appId);
  }
}

// Update job filter dropdown
function updateJobFilter() {
  const jobFilter = document.getElementById("jobFilter");
  jobFilter.innerHTML = '<option value="">All Jobs</option>';

  allJobs.forEach((job) => {
    const option = document.createElement("option");
    option.value = job._id;
    option.textContent = job.title;
    jobFilter.appendChild(option);
  });
}

// Render jobs list
function renderJobs(jobs) {
  const jobsList = document.querySelector(".jobs-list");
  jobsList.innerHTML = "";

  if (jobs.length === 0) {
    jobsList.innerHTML =
      '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 2rem;">No jobs found</p>';
    return;
  }

  jobs.forEach((job) => {
    const card = document.createElement("div");
    card.className = "job-card";
    card.innerHTML = `
      <div class="job-title">${job.title}</div>
      <div class="job-meta">
        <span>📍 ${job.location}</span>
        <span>🏢 ${job.department}</span>
        <span>💼 ${job.jobType}</span>
        <span>⏳ ${job.experience}</span>
      </div>
      <div class="job-status">${job.status}</div>
      <div class="job-actions">
        <button onclick="editJob('${job._id}')">Edit</button>
        <button onclick="deleteJobConfirm('${job._id}')">Delete</button>
      </div>
    `;
    jobsList.appendChild(card);
  });
}

// Filter jobs
function filterJobs() {
  const search = document.getElementById("searchJobs").value.toLowerCase();

  const filtered = allJobs.filter((job) => {
    return (
      job.title.toLowerCase().includes(search) ||
      job.description.toLowerCase().includes(search) ||
      job.department.toLowerCase().includes(search)
    );
  });

  renderJobs(filtered);
}

// Open new job modal
function openNewJobModal() {
  document.getElementById("newJobForm").reset();
  const header = document.querySelector("#newJobModal .modal-header h2");
  if (header) header.textContent = "Create New Job";
  document.getElementById("newJobModal").classList.add("active");
}

// Submit new job
async function submitNewJob(e) {
  e.preventDefault();

  try {
    const token = localStorage.getItem("token");

    const jobData = {
      title: document.getElementById("jobTitle").value,
      department: document.getElementById("jobDepartment").value,
      location: document.getElementById("jobLocation").value,
      jobType: document.getElementById("jobType").value,
      experience: document.getElementById("jobExperience").value,
      salary: document.getElementById("jobSalary").value,
      description: document.getElementById("jobDescription").value,
      skills: document
        .getElementById("jobSkills")
        .value.split(",")
        .map((s) => s.trim())
        .filter((s) => s),
    };

    const response = await fetch("/api/jobs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(jobData),
    });

    if (!response.ok) throw new Error("Failed to create job");

    showNotification("Job posting created successfully", "success");
    closeJobModal();
    loadJobs();
  } catch (error) {
    console.error("Error creating job:", error);
    showNotification("Failed to create job", "error");
  }
}

// Delete job
async function deleteJobConfirm(jobId) {
  if (confirm("Are you sure you want to delete this job posting?")) {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to delete job");

      showNotification("Job posting deleted successfully", "success");
      loadJobs();
    } catch (error) {
      console.error("Error deleting job:", error);
      showNotification("Failed to delete job", "error");
    }
  }
}

// Edit job
function editJob(jobId) {
  const job = allJobs.find((j) => j._id === jobId);
  if (!job) return;

  document.getElementById("newJobForm").reset();
  const header = document.querySelector("#newJobModal .modal-header h2");
  if (header) header.textContent = "Edit Job";

  document.getElementById("jobTitle").value = job.title;
  document.getElementById("jobDepartment").value = job.department || "";
  document.getElementById("jobLocation").value = job.location || "";
  document.getElementById("jobType").value = job.jobType || "";
  document.getElementById("jobExperience").value = job.experience || "";
  document.getElementById("jobSalary").value = job.salary || "";
  document.getElementById("jobDescription").value = job.description || "";
  document.getElementById("jobSkills").value = (job.skills || []).join(", ");

  // Create a new form submission handler for edit
  const form = document.getElementById("newJobForm");
  form.onsubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");

      const jobData = {
        title: document.getElementById("jobTitle").value,
        department: document.getElementById("jobDepartment").value,
        location: document.getElementById("jobLocation").value,
        jobType: document.getElementById("jobType").value,
        experience: document.getElementById("jobExperience").value,
        salary: document.getElementById("jobSalary").value,
        description: document.getElementById("jobDescription").value,
        skills: document
          .getElementById("jobSkills")
          .value.split(",")
          .map((s) => s.trim())
          .filter((s) => s),
      };

      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(jobData),
      });

      if (!response.ok) throw new Error("Failed to update job");

      showNotification("Job posting updated successfully", "success");
      closeJobModal();
      loadJobs();
    } catch (error) {
      console.error("Error updating job:", error);
      showNotification("Failed to update job", "error");
    }
  };

  document.getElementById("newJobModal").classList.add("active");
}

// Update applications stats
function updateApplicationsStats() {
  if (allApplications.length === 0) {
    document.getElementById("totalApps").textContent = "0";
    document.getElementById("pendingApps").textContent = "0";
    document.getElementById("shortlistedApps").textContent = "0";
    return;
  }

  const total = allApplications.length;
  const pending = allApplications.filter((a) => a.status === "pending").length;
  const shortlisted = allApplications.filter(
    (a) => a.status === "shortlisted",
  ).length;

  document.getElementById("totalApps").textContent = total;
  document.getElementById("pendingApps").textContent = pending;
  document.getElementById("shortlistedApps").textContent = shortlisted;
}

// Close modals
function closeAppModal() {
  document.getElementById("applicationModal").classList.remove("active");
}

function closeJobModal() {
  document.getElementById("newJobModal").classList.remove("active");
}

// Notification system
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    padding: 1rem 1.5rem;
    background: ${type === "error" ? "var(--error)" : type === "success" ? "var(--success)" : "var(--primary-color)"};
    color: ${type === "error" ? "#fff" : "#000"};
    border-radius: 8px;
    z-index: 2000;
    animation: slideInRight 0.3s ease-out;
    font-weight: 600;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOutRight 0.3s ease-out forwards";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Logout
function logout() {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }
}

// Add animation keyframes
const style = document.createElement("style");
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
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
