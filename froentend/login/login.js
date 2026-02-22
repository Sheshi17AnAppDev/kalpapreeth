// DOM Elements
const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const otpInput = document.getElementById("otp");
const togglePwBtn = document.querySelector(".toggle-pw");
const sendOtpBtn = document.getElementById("sendOtpBtn");
const verifyOtpBtn = document.getElementById("verifyOtpBtn");
const resendOtpBtn = document.getElementById("resendOtpBtn");
const step1 = document.getElementById("step1");
const step2 = document.getElementById("step2");
const verifyEmailSpan = document.getElementById("verifyEmail");
const timerSpan = document.getElementById("timer");

let otpTimer = null;
let otpTimeRemaining = 600; // 10 minutes

// Toggle password visibility
togglePwBtn.addEventListener("click", function () {
  const type =
    passwordInput.getAttribute("type") === "password" ? "text" : "password";
  passwordInput.setAttribute("type", type);

  // Update icon
  const icon = this.querySelector("svg");
  if (type === "text") {
    icon.innerHTML = `
      <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" stroke-width="2"/>
      <path d="M4 4L20 20" stroke="currentColor" stroke-width="2"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
    `;
  } else {
    icon.innerHTML = `
      <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" stroke-width="2"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
    `;
  }
});

const loginBtn = document.getElementById("loginBtn");
const useOtpLink = document.getElementById("useOtpLink");

// Step 1: Direct Password Login (Primary)
loginForm.addEventListener("submit", async function (e) {
  e.preventDefault();
  if (step1.style.display === "none") return; // Let OTP form handle its own submit if visible

  const email = emailInput.value;
  const password = passwordInput.value;

  if (!email || !password) {
    showNotification("Email and password are required", "error");
    return;
  }

  loginBtn.classList.add("loading");

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      showNotification("Login successful! Redirecting...", "success");
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setTimeout(() => {
        window.location.href = data.user.isAdmin
          ? "/admin-dashboard/admin-dashboard.html"
          : "/dashboard";
      }, 1000);
    } else {
      showNotification(data.error || "Login failed", "error");
    }
  } catch (error) {
    console.error("Login error:", error);
    showNotification("Network error. Please try again.", "error");
  } finally {
    loginBtn.classList.remove("loading");
  }
});

// Step 1: Switch to OTP flow if clicked
useOtpLink?.addEventListener("click", async function (e) {
  e.preventDefault();
  const email = emailInput.value;
  const password = passwordInput.value;

  if (!email || !password) {
    showNotification("Enter email and password first", "error");
    return;
  }

  useOtpLink.textContent = "Sending OTP...";

  try {
    const response = await fetch("/api/auth/send-login-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      step1.style.display = "none";
      step2.style.display = "block";
      verifyEmailSpan.textContent = email;
      startOtpTimer();
      showNotification("OTP sent to your email", "success");
    } else {
      showNotification(data.error || "Failed to send OTP", "error");
    }
  } catch (err) {
    showNotification("Error sending OTP", "error");
  } finally {
    useOtpLink.textContent = "Login with OTP instead";
  }
});

// Resend OTP
resendOtpBtn.addEventListener("click", async function (e) {
  e.preventDefault();

  const email = emailInput.value;
  const password = passwordInput.value;

  resendOtpBtn.disabled = true;
  resendOtpBtn.textContent = "Sending...";

  try {
    const response = await fetch("/api/auth/send-login-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      startOtpTimer();
      showNotification("OTP resent to your email", "success");
    } else {
      showNotification(data.error || "Failed to resend OTP", "error");
    }
  } catch (error) {
    showNotification("Network error. Please try again.", "error");
  } finally {
    resendOtpBtn.disabled = false;
    resendOtpBtn.textContent = "Resend OTP";
  }
});

// Step 2: Verify OTP and Login
loginForm.addEventListener("submit", async function (e) {
  e.preventDefault();
  if (step2.style.display === "none") return;

  const email = emailInput.value;
  const otp = otpInput.value;

  if (!otp || otp.length !== 6) {
    showNotification("Please enter a valid 6-digit OTP", "error");
    return;
  }

  // Show loading state
  verifyOtpBtn.classList.add("loading");

  try {
    const response = await fetch("/api/auth/verify-login-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, otp }),
    });

    const data = await response.json();

    if (response.ok) {
      // Store token and user data
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      // Success handling
      showNotification("Login successful! Redirecting...", "success");

      // Clear OTP timer
      clearInterval(otpTimer);

      // Redirect after delay based on role
      setTimeout(() => {
        if (data.user && data.user.isAdmin) {
          window.location.href = "/admin-dashboard/admin-dashboard.html";
        } else {
          window.location.href = "/dashboard";
        }
      }, 1500);
    } else {
      showNotification(data.error || "OTP verification failed", "error");
      verifyOtpBtn.classList.remove("loading");
    }
  } catch (error) {
    console.error("Verify OTP error", error);
    showNotification("Network error. Please try again.", "error");
    verifyOtpBtn.classList.remove("loading");
  }
});

// OTP Timer function
function startOtpTimer() {
  otpTimeRemaining = 600; // 10 minutes
  resendOtpBtn.disabled = true;

  if (otpTimer) clearInterval(otpTimer);
  otpTimer = setInterval(() => {
    otpTimeRemaining--;

    const minutes = Math.floor(otpTimeRemaining / 60);
    const seconds = otpTimeRemaining % 60;
    timerSpan.textContent =
      String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");

    if (otpTimeRemaining <= 0) {
      clearInterval(otpTimer);
      otpInput.disabled = true;
      resendOtpBtn.disabled = false;
      showNotification("OTP expired. Please request a new one.", "error");
    }
  }, 1000);
}

// Notification system
function showNotification(message, type = "info") {
  // Remove existing notifications
  const existingNotification = document.querySelector(".notification");
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-message">${message}</span>
    </div>
  `;

  // Add styles for notification
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === "success" ? "#00ff9d" : "#ff4d4d"};
    color: #000;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    font-weight: 600;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    transform: translateX(400px);
    transition: transform 0.3s ease;
    z-index: 2000;
    max-width: 300px;
  `;

  document.body.appendChild(notification);

  // Animate in
  setTimeout(() => {
    notification.style.transform = "translateX(0)";
  }, 100);

  // Auto remove after 5 seconds
  setTimeout(() => {
    notification.style.transform = "translateX(400px)";
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

// Input validation with real-time feedback
const inputs = document.querySelectorAll(
  'input[type="text"], input[type="password"], input[type="email"]',
);
inputs.forEach((input) => {
  input.addEventListener("blur", function () {
    if (this.value.trim() === "") {
      this.style.borderColor = "#ff4d4d";
    } else {
      this.style.borderColor = "rgba(255,255,255,0.1)";
    }
  });

  input.addEventListener("input", function () {
    this.style.borderColor = "rgba(255,255,255,0.1)";
  });

  input.addEventListener("focus", function () {
    this.parentElement.style.transform = "scale(1.02)";
  });

  input.addEventListener("blur", function () {
    this.parentElement.style.transform = "scale(1)";
  });
});

// Logout Helper if needed elsewhere (though usually in dashboard)
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
}
