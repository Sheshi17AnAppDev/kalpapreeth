// DOM Elements
const navbar = document.querySelector(".navbar");
const hamburger = document.getElementById("hamburger");
const navMenu = document.getElementById("navMenu");
const navLinks = document.querySelectorAll(".nav-menu a");
const contactForm = document.getElementById("contactForm");
const submitBtn = document.querySelector(".submit-btn");
const stats = document.querySelectorAll(".stat-number");
const faqItems = document.querySelectorAll(".faq-item");

// Mobile Navigation Toggle
hamburger.addEventListener("click", () => {
  hamburger.classList.toggle("active");
  navMenu.classList.toggle("active");
});

// Close mobile menu when clicking on a link
navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    hamburger.classList.remove("active");
    navMenu.classList.remove("active");
  });
});

// Navbar background on scroll
window.addEventListener("scroll", () => {
  if (window.scrollY > 100) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
});

// Animate stats counter
function animateStats() {
  stats.forEach((stat) => {
    const target = parseInt(stat.getAttribute("data-count"));
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      stat.textContent = Math.floor(current);
    }, 16);
  });
}

// FAQ Toggle functionality
faqItems.forEach((item) => {
  const question = item.querySelector(".faq-question");

  question.addEventListener("click", () => {
    // Close all other FAQ items
    faqItems.forEach((otherItem) => {
      if (otherItem !== item) {
        otherItem.classList.remove("active");
      }
    });

    // Toggle current item
    item.classList.toggle("active");
  });
});

// Form validation and submission
contactForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const formData = {
    fullname: document.getElementById("fullname").value,
    email: document.getElementById("email").value,
    phone: document.getElementById("phone").value,
    projectType: document.getElementById("projectType").value,
    message: document.getElementById("message").value,
  };

  // Validate form
  if (!validateForm(formData)) {
    return;
  }

  // Show loading state
  submitBtn.classList.add("loading");
  submitBtn.disabled = true;

  try {
    const result = await submitContactForm(formData);
    const ref = result?.enquiryNumber || "";
    showNotification(
      `Thank you for your inquiry. Reference: ${ref}. We have received your message and will respond within 24 hours.`,
      "success",
    );
    fetchEnquiriesToday(); // Update the enquiries count after successful submission
    contactForm.reset();
  } catch (error) {
    showNotification("Failed to send message. Please try again.", "error");
  } finally {
    submitBtn.classList.remove("loading");
    submitBtn.disabled = false;
  }
});

// Form validation
function validateForm(formData) {
  const { fullname, email, projectType, message } = formData;

  if (!fullname.trim()) {
    showNotification("Please enter your full name.", "error");
    return false;
  }

  if (!email.trim() || !isValidEmail(email)) {
    showNotification("Please enter a valid email address.", "error");
    return false;
  }

  if (!projectType) {
    showNotification("Please select a project type.", "error");
    return false;
  }

  if (!message.trim()) {
    showNotification("Please enter your message.", "error");
    return false;
  }

  return true;
}

// Email validation
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Form submission to backend
async function submitContactForm(formData) {
  const response = await fetch("/api/contact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: formData.fullname,
      email: formData.email,
      phone: formData.phone,
      projectType: formData.projectType,
      message: formData.message,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to send message");
  }

  return await response.json();
}

// Input field animations
document
  .querySelectorAll(".input-field input, .input-field textarea")
  .forEach((field) => {
    field.addEventListener("focus", function () {
      this.parentElement.classList.add("focused");
      trackFormInteraction(this.name);
    });

    field.addEventListener("blur", function () {
      if (!this.value) {
        this.parentElement.classList.remove("focused");
      }
    });
  });

// Intersection Observer for animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      if (entry.target.classList.contains("hero-stats")) {
        animateStats();
      }
      entry.target.classList.add("animate-in");
    }
  });
}, observerOptions);

// Observe elements for animation
document
  .querySelectorAll(".info-item, .faq-item, .hero-stats")
  .forEach((el) => {
    observer.observe(el);
  });

// Notification system
function showNotification(message, type = "info") {
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
        background: ${type === "success" ? "var(--success)" : "var(--error)"};
        color: var(--bg-dark);
        padding: 1rem 1.5rem;
        border-radius: 0.75rem;
        font-weight: 600;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        max-width: 300px;
        transform: translateX(400px);
        transition: transform 0.3s ease;
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

// Backend Integration Hooks

// Track form interactions
function trackFormInteraction(fieldName) {
  /*
    fetch('https://api.yoursite.com/analytics/form-interaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            field: fieldName,
            page: 'contact',
            timestamp: new Date().toISOString()
        })
    });
    */
}

// Analytics tracking
function trackPageView() {
  // Replace with your analytics service
  /*
    gtag('config', 'GA_MEASUREMENT_ID', {
        page_title: 'Contact',
        page_location: window.location.href
    });
    */
}

// Fetch and update enquiries count
async function fetchEnquiriesToday() {
  try {
    const response = await fetch("/api/enquiries/today");
    const data = await response.json();
    const enquiriesElement = document.getElementById("enquiriesToday");
    if (enquiriesElement) {
      enquiriesElement.setAttribute("data-count", data.count);
      enquiriesElement.textContent = data.count;
    }
  } catch (error) {
    console.error("Failed to fetch enquiries count:", error);
  }
}

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  trackPageView();
  fetchEnquiriesToday();

  // Add animation classes
  setTimeout(() => {
    document.body.classList.add("loaded");
  }, 100);
});

// Add CSS for additional animations
const style = document.createElement("style");
style.textContent = `
    .info-item,
    .faq-item,
    .hero-stats {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s ease;
    }
    
    .info-item.animate-in,
    .faq-item.animate-in,
    .hero-stats.animate-in {
        opacity: 1;
        transform: translateY(0);
    }
    
    .info-item:nth-child(1) { transition-delay: 0.1s; }
    .info-item:nth-child(2) { transition-delay: 0.2s; }
    .info-item:nth-child(3) { transition-delay: 0.3s; }
    
    .faq-item:nth-child(1) { transition-delay: 0.1s; }
    .faq-item:nth-child(2) { transition-delay: 0.2s; }
    .faq-item:nth-child(3) { transition-delay: 0.3s; }
    
    .input-field.focused label {
        top: 0.5rem !important;
        transform: translateY(0) !important;
        font-size: 0.8rem !important;
        color: var(--primary-cyan) !important;
    }
    
    body.loaded {
        opacity: 1;
    }
    
    body {
        opacity: 0;
        transition: opacity 0.5s ease;
    }
`;
document.head.appendChild(style);
