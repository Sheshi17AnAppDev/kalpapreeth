// DOM Elements
const header = document.getElementById('header');
const themeToggle = document.getElementById('themeToggle');
const mobileThemeToggle = document.getElementById('mobileThemeToggle');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenuClose = document.getElementById('mobileMenuClose');
const mobileMenu = document.getElementById('mobileMenu');
const overlay = document.getElementById('overlay');
const contactForm = document.getElementById('contactForm');
const newsletterForm = document.getElementById('newsletterForm');
const faqItems = document.querySelectorAll('.faq-item');

// Scroll Event for Header
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Theme Toggle
function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    // Update icon
    const themeIcons = document.querySelectorAll('.theme-toggle i');
    themeIcons.forEach(icon => {
        icon.className = newTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    });

    // Update mobile theme toggle text
    if (mobileThemeToggle) {
        mobileThemeToggle.innerHTML = `<i class="fas fa-${newTheme === 'dark' ? 'moon' : 'sun'}"></i> ${newTheme === 'dark' ? 'Dark' : 'Light'} Mode`;
    }
}

themeToggle.addEventListener('click', toggleTheme);
if (mobileThemeToggle) {
    mobileThemeToggle.addEventListener('click', toggleTheme);
}

// Load saved theme
const savedTheme = localStorage.getItem('theme') || 'dark';
document.body.setAttribute('data-theme', savedTheme);

// Update icons based on saved theme
const themeIcons = document.querySelectorAll('.theme-toggle i');
themeIcons.forEach(icon => {
    icon.className = savedTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
});

// Mobile Menu Toggle
function openMobileMenu() {
    mobileMenu.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
    mobileMenu.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
}

mobileMenuBtn.addEventListener('click', openMobileMenu);
mobileMenuClose.addEventListener('click', closeMobileMenu);
overlay.addEventListener('click', closeMobileMenu);

// Close mobile menu when clicking on a link
const mobileNavLinks = document.querySelectorAll('.mobile-nav-links a');
mobileNavLinks.forEach(link => {
    link.addEventListener('click', closeMobileMenu);
});

// FAQ Accordion
faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');

    question.addEventListener('click', () => {
        // Close all other items
        faqItems.forEach(otherItem => {
            if (otherItem !== item) {
                otherItem.classList.remove('active');
            }
        });

        // Toggle current item
        item.classList.toggle('active');
    });
});

// Form Submission
contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Basic form validation
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const projectType = document.getElementById('projectType').value;
    const message = document.getElementById('message').value;

    if (!name || !email || !projectType || !message) {
        alert('Please fill in all required fields.');
        return;
    }

    // Show loading state
    const submitBtn = contactForm.querySelector('.form-submit');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    try {
        const response = await fetch('/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                email,
                phone,
                projectType,
                message
            })
        });

        const result = await response.json();

        if (response.ok) {
            // Show success popup
            showSuccessPopup(result.message || "Thank you for your inquiry!");
            contactForm.reset();
        } else {
            alert('Error: ' + (result.error || result.message || 'Something went wrong'));
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        alert('Failed to submit form. Please check your connection.');
    } finally {
        // Reset button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

newsletterForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const emailInput = newsletterForm.querySelector('input[type="email"]');
    const email = emailInput.value;

    if (!email) {
        alert('Please enter your email address.');
        return;
    }

    // Show loading state
    const submitBtn = newsletterForm.querySelector('.newsletter-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '...';
    submitBtn.disabled = true;

    try {
        const response = await fetch('/api/newsletter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const result = await response.json();

        if (response.ok) {
            // Show success popup
            showSuccessPopup(result.message || "Subscribed successfully!");
            emailInput.value = '';
        } else {
            alert('Error: ' + (result.error || result.message || 'Already subscribed or invalid email'));
        }
    } catch (error) {
        console.error('Error subscribing to newsletter:', error);
        alert('Failed to subscribe. Please try again later.');
    } finally {
        // Reset button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// Scroll Animations
const fadeElements = document.querySelectorAll('.fade-in');

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

fadeElements.forEach(element => {
    observer.observe(element);
});

// Success Popup Functions
function showSuccessPopup(message) {
    const popup = document.getElementById('successPopup');
    const popupMessage = popup.querySelector('.popup-body p');
    popupMessage.textContent = message;
    popup.classList.add('active');

    // Auto-close after 5 seconds
    setTimeout(() => {
        closeSuccessPopup();
    }, 5000);
}

function closeSuccessPopup() {
    const popup = document.getElementById('successPopup');
    popup.classList.remove('active');
}

// Close popup when clicking close button or outside
document.getElementById('popupClose').addEventListener('click', closeSuccessPopup);
document.getElementById('successPopup').addEventListener('click', (e) => {
    if (e.target === document.getElementById('successPopup')) {
        closeSuccessPopup();
    }
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            const headerHeight = header.offsetHeight;
            const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});
