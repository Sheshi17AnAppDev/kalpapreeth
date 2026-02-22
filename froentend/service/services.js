// DOM Elements
const navbar = document.querySelector('.navbar');
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav-menu a');
const stats = document.querySelectorAll('.stat-number');
const serviceCards = document.querySelectorAll('.service-card');

// Mobile Navigation Toggle
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Navbar background on scroll
window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Animate stats counter
function animateStats() {
    stats.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-count'));
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

// Service card interactions
serviceCards.forEach(card => {
    card.addEventListener('click', function() {
        const service = this.getAttribute('data-service');
        trackServiceInteraction(service);
        
        // Add visual feedback
        this.style.transform = 'translateY(-5px) scale(1.02)';
        setTimeout(() => {
            this.style.transform = 'translateY(-10px)';
        }, 150);
    });
    
    card.addEventListener('mouseenter', function() {
        this.querySelector('.card-glow').style.opacity = '0.5';
    });
    
    card.addEventListener('mouseleave', function() {
        this.querySelector('.card-glow').style.opacity = '0.3';
    });
});

// Service action buttons
document.querySelectorAll('.service-actions .btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const card = this.closest('.service-card');
        const service = card.getAttribute('data-service');
        const action = this.textContent.trim();
        
        trackServiceAction(service, action);
        
        // Show loading state
        const originalText = this.innerHTML;
        this.innerHTML = '<div class="btn-loader"></div>';
        this.disabled = true;
        
        setTimeout(() => {
            this.innerHTML = originalText;
            this.disabled = false;
            showNotification(`${action} for ${service} service requested!`, 'success');
        }, 1500);
    });
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            if (entry.target.classList.contains('hero-stats')) {
                animateStats();
            }
            entry.target.classList.add('animate-in');
        }
    });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.service-card, .process-step, .hero-stats').forEach(el => {
    observer.observe(el);
});

// Backend Integration Hooks

// Track service interactions
function trackServiceInteraction(serviceName) {
    /*
    fetch('https://api.yoursite.com/analytics/service-interaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            service: serviceName,
            action: 'view',
            timestamp: new Date().toISOString()
        })
    });
    */
}

// Track service actions
function trackServiceAction(serviceName, action) {
    /*
    fetch('https://api.yoursite.com/analytics/service-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            service: serviceName,
            action: action,
            timestamp: new Date().toISOString()
        })
    });
    */
}

// Fetch services from API
async function loadServices() {
    try {
        /*
        const response = await fetch('https://api.yoursite.com/services');
        const servicesData = await response.json();
        
        const servicesGrid = document.querySelector('.services-grid');
        servicesGrid.innerHTML = '';
        
        servicesData.forEach(service => {
            const card = `
                <div class="service-card" data-service="${service.id}">
                    <div class="card-glow"></div>
                    <div class="service-icon">
                        <div class="icon-bg"></div>
                        ${service.icon_svg}
                    </div>
                    <h3>${service.title}</h3>
                    <p>${service.description}</p>
                    <div class="service-features">
                        ${service.features.map(feature => `<span class="feature">${feature}</span>`).join('')}
                    </div>
                    <div class="service-actions">
                        <button class="btn btn-primary btn-small">Learn More</button>
                        <button class="btn btn-secondary btn-small">Case Study</button>
                    </div>
                </div>
            `;
            servicesGrid.innerHTML += card;
        });
        */
    } catch (error) {
        console.log('Services data loading placeholder - using static data');
    }
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
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
        background: ${type === 'success' ? 'var(--success)' : 'var(--card-dark)'};
        color: ${type === 'success' ? 'var(--bg-dark)' : 'var(--text-primary)'};
        padding: 1rem 1.5rem;
        border-radius: 0.75rem;
        font-weight: 600;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        border: 1px solid var(--border-color);
        z-index: 10000;
        max-width: 300px;
        transform: translateX(400px);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Analytics tracking
function trackPageView() {
    // Replace with your analytics service
    /*
    gtag('config', 'GA_MEASUREMENT_ID', {
        page_title: 'Services',
        page_location: window.location.href
    });
    */
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    trackPageView();
    // loadServices(); // Uncomment when backend is ready
    
    // Add animation classes
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 100);
});

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    .service-card,
    .process-step,
    .hero-stats {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s ease;
    }
    
    .service-card.animate-in,
    .process-step.animate-in,
    .hero-stats.animate-in {
        opacity: 1;
        transform: translateY(0);
    }
    
    .service-card:nth-child(1) { transition-delay: 0.1s; }
    .service-card:nth-child(2) { transition-delay: 0.2s; }
    .service-card:nth-child(3) { transition-delay: 0.3s; }
    .service-card:nth-child(4) { transition-delay: 0.4s; }
    .service-card:nth-child(5) { transition-delay: 0.5s; }
    .service-card:nth-child(6) { transition-delay: 0.6s; }
    
    .process-step:nth-child(1) { transition-delay: 0.1s; }
    .process-step:nth-child(2) { transition-delay: 0.2s; }
    .process-step:nth-child(3) { transition-delay: 0.3s; }
    .process-step:nth-child(4) { transition-delay: 0.4s; }
    
    .btn-loader {
        width: 16px;
        height: 16px;
        border: 2px solid transparent;
        border-top: 2px solid currentColor;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
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