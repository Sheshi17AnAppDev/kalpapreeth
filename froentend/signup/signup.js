// DOM Elements
const signupForm = document.getElementById("signupForm");
const fullnameInput = document.getElementById("fullname");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirm-password");
const otpInput = document.getElementById("otp");
const togglePwBtns = document.querySelectorAll(".toggle-pw");
const sendOtpBtn = document.getElementById("sendOtpBtn");
const verifyOtpBtn = document.getElementById("verifyOtpBtn");
const resendOtpBtn = document.getElementById("resendOtpBtn");
const strengthFill = document.getElementById("strengthFill");
const strengthText = document.getElementById("strengthText");
const step1 = document.getElementById("step1");
const step2 = document.getElementById("step2");
const verifyEmailSpan = document.getElementById("verifyEmail");
const timerSpan = document.getElementById("timer");

// Role elements
const roleSelect = document.getElementById("role");
const talentSpecs = document.getElementById("talent-specs");
const clientSpecs = document.getElementById("client-specs");

// Role selection logic
roleSelect.addEventListener("change", function () {
  const role = this.value;
  talentSpecs.style.display = role === "talent" ? "block" : "none";
  clientSpecs.style.display = role === "client" ? "block" : "none";
});

let otpTimer = null;
let otpTimeRemaining = 600; // 10 minutes

// Toggle password visibility for both password fields
togglePwBtns.forEach((btn, index) => {
  btn.addEventListener("click", function () {
    const targetId = index === 0 ? "password" : "confirm-password";
    const targetInput = document.getElementById(targetId);
    const type =
      targetInput.getAttribute("type") === "password" ? "text" : "password";
    targetInput.setAttribute("type", type);

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
});

// Password strength checker
passwordInput.addEventListener("input", function () {
  const password = this.value;
  const strength = calculatePasswordStrength(password);
  updateStrengthIndicator(strength);
});

function calculatePasswordStrength(password) {
  let score = 0;

  // Length check
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;

  // Character variety checks
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  if (score <= 2) return "weak";
  if (score <= 4) return "medium";
  return "strong";
}

function updateStrengthIndicator(strength) {
  strengthFill.className = "strength-fill " + strength;
  strengthText.className = "strength-text " + strength;

  switch (strength) {
    case "weak":
      strengthText.textContent = "Weak password";
      break;
    case "medium":
      strengthText.textContent = "Medium strength";
      break;
    case "strong":
      strengthText.textContent = "Strong password";
      break;
  }
}

// Real-time password match validation
confirmPasswordInput.addEventListener("input", function () {
  const password = passwordInput.value;
  const confirmPassword = this.value;

  if (confirmPassword && password !== confirmPassword) {
    this.style.borderColor = "var(--error)";
    this.parentElement.querySelector(".input-icon").style.color =
      "var(--error)";
  } else {
    this.style.borderColor = "var(--input-border)";
    this.parentElement.querySelector(".input-icon").style.color =
      "var(--text-muted)";
  }
});

// Step 1: Send OTP
sendOtpBtn.addEventListener("click", async function (e) {
  e.preventDefault();

  const fullname = fullnameInput.value;
  const email = emailInput.value;
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;
  const terms = document.getElementById("terms").checked;

  // Enhanced validation
  if (!fullname) {
    showNotification("Please enter your full name", "error");
    return;
  }

  if (!email) {
    showNotification("Please enter your email", "error");
    return;
  }

  if (!terms) {
    showNotification(
      "Please agree to the Terms of Service and Privacy Policy",
      "error",
    );
    return;
  }

  if (password !== confirmPassword) {
    showNotification("Passwords do not match", "error");
    confirmPasswordInput.focus();
    return;
  }

  const passwordStrength = calculatePasswordStrength(password);
  if (passwordStrength === "weak") {
    const proceed = confirm(
      "Your password is weak. Are you sure you want to continue?",
    );
    if (!proceed) return;
  }

  // Role-specific data
  const role = roleSelect.value;
  const extraData = {};

  if (role === 'talent') {
    extraData.title = document.getElementById('talent-title').value;
    extraData.skills = document.getElementById('talent-skills').value;
    extraData.experience = document.getElementById('talent-experience').value;
  } else if (role === 'client') {
    extraData.company = document.getElementById('client-company').value;
  }

  // Show loading state
  sendOtpBtn.classList.add("loading");

  try {
    const response = await fetch("/api/auth/send-signup-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        name: fullname,
        role,
        ...extraData
      }),
    });

    const data = await response.json();

    if (response.ok) {
      // Move to step 2
      step1.style.display = "none";
      step2.style.display = "block";
      verifyEmailSpan.textContent = email;

      // Start OTP timer
      startOtpTimer();

      showNotification(
        "OTP sent to your email. Valid for 10 minutes.",
        "success",
      );
    } else {
      showNotification(data.error || "Failed to send OTP", "error");
      sendOtpBtn.classList.remove("loading");
    }
  } catch (error) {
    console.error("Send OTP error", error);
    showNotification("Network error. Please try again.", "error");
    sendOtpBtn.classList.remove("loading");
  }
});

// Resend OTP
resendOtpBtn.addEventListener("click", async function (e) {
  e.preventDefault();

  const email = emailInput.value;
  const password = passwordInput.value;
  const fullname = fullnameInput.value;

  resendOtpBtn.disabled = true;
  resendOtpBtn.textContent = "Sending...";

  try {
    const response = await fetch("/api/auth/send-signup-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, name: fullname }),
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

// Step 2: Verify OTP
signupForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const email = emailInput.value;
  const otp = otpInput.value;

  if (!otp || otp.length !== 6) {
    showNotification("Please enter a valid 6-digit OTP", "error");
    return;
  }

  // Show loading state
  verifyOtpBtn.classList.add("loading");

  try {
    const response = await fetch("/api/auth/verify-signup-otp", {
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
      showNotification(
        "Account created successfully! Redirecting...",
        "success",
      );

      // Clear OTP timer
      clearInterval(otpTimer);

      // Redirect after delay
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2000);
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

// Add shake animation to CSS
const style = document.createElement("style");
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-10px); }
    75% { transform: translateX(10px); }
  }
  
  .shake {
    animation: shake 0.5s ease-in-out;
  }
`;
document.head.appendChild(style);

// Enhanced input validation with real-time feedback
const inputs = document.querySelectorAll(
  'input[type="text"], input[type="email"], input[type="password"]',
);
inputs.forEach((input) => {
  input.addEventListener("blur", function () {
    if (this.value.trim() === "" && this.required) {
      this.style.borderColor = "#ff4d4d";
      if (this.parentElement.querySelector(".input-icon")) {
        this.parentElement.querySelector(".input-icon").style.color =
          "#ff4d4d";
      }
    } else {
      this.style.borderColor = "rgba(255,255,255,0.1)";
      if (this.parentElement.querySelector(".input-icon")) {
        this.parentElement.querySelector(".input-icon").style.color =
          "rgba(255,255,255,0.5)";
      }
    }
  });

  input.addEventListener("input", function () {
    this.style.borderColor = "rgba(255,255,255,0.1)";
    if (this.parentElement.querySelector(".input-icon")) {
      this.parentElement.querySelector(".input-icon").style.color =
        "rgba(255,255,255,0.5)";
    }
  });

  input.addEventListener("focus", function () {
    this.parentElement.style.transform = "scale(1.02)";
  });

  input.addEventListener("blur", function () {
    this.parentElement.style.transform = "scale(1)";
  });
});
