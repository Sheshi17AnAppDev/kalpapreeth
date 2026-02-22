// DOM Elements
const jobsList = document.getElementById("jobsList");
const applicationModal = document.getElementById("applicationModal");
const modalClose = document.querySelector(".modal-close");
const applicationForm = document.getElementById("applicationForm");
const jobCountSpan = document.getElementById("jobCount");
const searchJobsInput = document.getElementById("searchJobs");
const departmentFilter = document.getElementById("departmentFilter");
const jobTypeFilters = document.querySelectorAll(".job-type-filter");
const resetFiltersBtn = document.getElementById("resetFilters");

// State
let allJobs = [];
let selectedJob = null;

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadJobs();
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  modalClose.addEventListener("click", closeModal);
  applicationModal.addEventListener("click", (e) => {
    if (e.target === applicationModal) closeModal();
  });

  applicationForm.addEventListener("submit", handleApplicationSubmit);

  // Filters
  searchJobsInput.addEventListener("input", filterJobs);
  departmentFilter.addEventListener("change", filterJobs);
  jobTypeFilters.forEach((checkbox) => {
    checkbox.addEventListener("change", filterJobs);
  });

  resetFiltersBtn.addEventListener("click", resetFilters);
}

// Load jobs from API
async function loadJobs() {
  try {
    const response = await fetch("/api/jobs");
    if (!response.ok) throw new Error("Failed to load jobs");

    allJobs = await response.json();
    renderJobs(allJobs);
  } catch (error) {
    console.error("Error loading jobs:", error);
    jobsList.innerHTML =
      '<p class="empty-state">Error loading jobs. Please try again later.</p>';
  }
}

// Render jobs
function renderJobs(jobs) {
  if (!jobs || jobs.length === 0) {
    jobsList.innerHTML =
      '<p class="empty-state">No jobs found matching your criteria.</p>';
    jobCountSpan.textContent = "0 jobs";
    return;
  }

  jobCountSpan.textContent = `${jobs.length} job${jobs.length !== 1 ? "s" : ""}`;

  jobsList.innerHTML = jobs
    .map(
      (job) => `
    <div class="job-card" data-job-id="${job._id}">
      <div class="job-info">
        <div class="job-title">${job.title}</div>
        <div class="job-meta">
          <div class="job-meta-item">📍 ${job.location || "Remote"}</div>
          <div class="job-meta-item">🏢 ${job.department || "N/A"}</div>
          <div class="job-meta-item">💼 ${job.experience || "Not specified"}</div>
        </div>
        <p class="job-description-preview">${(job.description || "").substring(0, 150)}...</p>
        <div class="job-tags">
          ${
            job.jobType
              ? `<span class="job-type-badge">${job.jobType}</span>`
              : ""
          }
          ${
            job.skills
              ? job.skills
                  .slice(0, 3)
                  .map((skill) => `<span class="job-tag">${skill}</span>`)
                  .join("")
              : ""
          }
        </div>
      </div>
      <div class="job-action">
        ${job.salary ? `<div style="color: var(--text-muted); font-size: 0.9rem;">💰 ${job.salary}</div>` : ""}
        <button class="apply-btn apply-job-btn" data-job-id="${job._id}">Apply Now</button>
      </div>
    </div>
  `,
    )
    .join("");

  // Add click listeners to apply buttons
  document.querySelectorAll(".apply-job-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const jobId = btn.dataset.jobId;
      const job = allJobs.find((j) => j._id === jobId);
      openApplicationModal(job);
    });
  });

  // Add click listeners to job cards
  document.querySelectorAll(".job-card").forEach((card) => {
    card.addEventListener("click", () => {
      const jobId = card.dataset.jobId;
      const job = allJobs.find((j) => j._id === jobId);
      openApplicationModal(job);
    });
  });
}

// Open application modal
function openApplicationModal(job) {
  if (!job) return;

  selectedJob = job;

  // Populate modal
  document.getElementById("modalJobTitle").textContent = job.title;
  document.getElementById("modalJobType").textContent = job.jobType || "N/A";
  document.getElementById("modalJobLocation").textContent =
    job.location || "Remote";
  document.getElementById("modalJobDepartment").textContent =
    job.department || "N/A";
  document.getElementById("modalJobExperience").textContent =
    job.experience || "Not specified";
  document.getElementById("modalJobSalary").textContent =
    job.salary || "Competitive";

  const skillsContainer = document.getElementById("modalJobSkills");
  if (job.skills && job.skills.length > 0) {
    skillsContainer.innerHTML = job.skills
      .map((skill) => `<span class="skill-tag">${skill}</span>`)
      .join("");
  } else {
    skillsContainer.innerHTML = "<span>Not specified</span>";
  }

  document.getElementById("modalJobDescription").textContent =
    job.description || "No description available";

  applicationModal.classList.add("active");
}

// Close modal
function closeModal() {
  applicationModal.classList.remove("active");
  selectedJob = null;
  applicationForm.reset();
}

// Filter jobs
function filterJobs() {
  const searchTerm = searchJobsInput.value.toLowerCase();
  const department = departmentFilter.value;
  const selectedJobTypes = Array.from(jobTypeFilters)
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => checkbox.value);

  const filtered = allJobs.filter((job) => {
    // Search filter
    const matchesSearch =
      !searchTerm ||
      job.title.toLowerCase().includes(searchTerm) ||
      (job.description || "").toLowerCase().includes(searchTerm) ||
      (job.location || "").toLowerCase().includes(searchTerm);

    // Department filter
    const matchesDepartment = !department || job.department === department;

    // Job type filter
    const matchesJobType =
      selectedJobTypes.length === 0 || selectedJobTypes.includes(job.jobType);

    return matchesSearch && matchesDepartment && matchesJobType;
  });

  renderJobs(filtered);
}

// Reset filters
function resetFilters() {
  searchJobsInput.value = "";
  departmentFilter.value = "";
  jobTypeFilters.forEach((checkbox) => (checkbox.checked = false));
  renderJobs(allJobs);
}

// Handle application submission
async function handleApplicationSubmit(e) {
  e.preventDefault();

  if (!selectedJob) {
    showNotification("Error: No job selected", "error");
    return;
  }

  const candidateName = document.getElementById("candidateName").value;
  const candidateEmail = document.getElementById("candidateEmail").value;
  const candidatePhone = document.getElementById("candidatePhone").value;
  const portfolioLink = document.getElementById("portfolioLink").value;
  const coverLetter = document.getElementById("coverLetter").value;
  const resumeFile = document.getElementById("resume").files[0];

  if (!candidateName || !candidateEmail || !resumeFile) {
    showNotification("Please fill in all required fields", "error");
    return;
  }

  // Validate resume is PDF
  if (resumeFile.type !== "application/pdf") {
    showNotification("Resume must be in PDF format", "error");
    return;
  }

  // Validate file size (10MB max)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (resumeFile.size > maxSize) {
    showNotification("Resume file size must be less than 10MB", "error");
    return;
  }

  // Create FormData for file upload
  const formData = new FormData();
  formData.append("jobId", selectedJob._id);
  formData.append("candidateName", candidateName);
  formData.append("candidateEmail", candidateEmail);
  formData.append("candidatePhone", candidatePhone);
  formData.append("portfolioLink", portfolioLink);
  formData.append("coverLetter", coverLetter);
  formData.append("resume", resumeFile);

  const submitBtn = applicationForm.querySelector(".submit-btn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";

  try {
    const response = await fetch("/api/job-applications", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (response.ok) {
      const ref = data?.application?.enquiryNumber || data?.enquiryNumber || "";
      showNotification(
        `Application submitted successfully${ref ? ` (Ref: ${ref})` : ""}. Check your email for confirmation.`,
        "success",
      );
      closeModal();
    } else {
      showNotification(data.error || "Failed to submit application", "error");
    }
  } catch (error) {
    console.error("Error submitting application:", error);
    showNotification(
      "Error submitting application. Please try again.",
      "error",
    );
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Application";
  }
}

// Notification system
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
