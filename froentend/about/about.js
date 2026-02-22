// DOM Elements
const navbar = document.querySelector('.navbar');
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav-menu a');
const stats = document.querySelectorAll('.stat-number');

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
document.querySelectorAll('.principle-card, .timeline-item, .team-card, .value-card, .hero-stats').forEach(el => {
    observer.observe(el);
});

// Backend Integration Hooks

// Fetch team data from API
async function loadTeamMembers() {
    try {
        /*
        const response = await fetch('https://api.yoursite.com/team');
        const teamData = await response.json();
        
        const teamGrid = document.querySelector('.team-grid');
        teamGrid.innerHTML = '';
        
        teamData.forEach(member => {
            const card = `
                <div class="team-card">
                    <div class="team-photo">
                        <img src="${member.photo}" alt="${member.name}" onerror="this.style.display='none'">
                        <div class="photo-placeholder">${member.initials}</div>
                        <div class="photo-overlay">
                            <div class="social-links">
                                ${member.linkedin ? `<a href="${member.linkedin}" class="social-link">in</a>` : ''}
                                ${member.twitter ? `<a href="${member.twitter}" class="social-link">tw</a>` : ''}
                                ${member.email ? `<a href="mailto:${member.email}" class="social-link">mail</a>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="team-info">
                        <h3>${member.name}</h3>
                        <div class="team-role">${member.role}</div>
                        <p>${member.bio}</p>
                        <div class="team-skills">
                            ${member.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                        </div>
                    </div>
                </div>
            `;
            teamGrid.innerHTML += card;
        });
        */
    } catch (error) {
        console.log('Team data loading placeholder - using static data');
    }
}

// Fetch company timeline from API
async function loadTimeline() {
    try {
        /*
        const response = await fetch('https://api.yoursite.com/timeline');
        const timelineData = await response.json();
        
        const timeline = document.querySelector('.timeline');
        timeline.innerHTML = '';
        
        timelineData.forEach((item, index) => {
            const timelineItem = `
                <div class="timeline-item ${index % 2 === 0 ? 'left' : 'right'}">
                    <div class="timeline-year">${item.year}</div>
                    <div class="timeline-content">
                        <div class="timeline-icon">${item.icon}</div>
                        <div class="timeline-details">
                            <h3>${item.title}</h3>
                            <p>${item.description}</p>
                        </div>
                    </div>
                </div>
            `;
            timeline.innerHTML += timelineItem;
        });
        */
    } catch (error) {
        console.log('Timeline data loading placeholder - using static data');
    }
}

// Analytics tracking
function trackPageView() {
    // Replace with your analytics service
    /*
    gtag('config', 'GA_MEASUREMENT_ID', {
        page_title: 'About Us',
        page_location: window.location.href
    });
    */
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    trackPageView();
    // loadTeamMembers(); // Uncomment when backend is ready
    // loadTimeline(); // Uncomment when backend is ready
    
    // Add animation classes
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 100);
});

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    .principle-card,
    .timeline-item,
    .team-card,
    .value-card,
    .hero-stats {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s ease;
    }
    
    .principle-card.animate-in,
    .timeline-item.animate-in,
    .team-card.animate-in,
    .value-card.animate-in,
    .hero-stats.animate-in {
        opacity: 1;
        transform: translateY(0);
    }
    
    .timeline-item:nth-child(1) { transition-delay: 0.1s; }
    .timeline-item:nth-child(2) { transition-delay: 0.2s; }
    .timeline-item:nth-child(3) { transition-delay: 0.3s; }
    .timeline-item:nth-child(4) { transition-delay: 0.4s; }
    
    .principle-card:nth-child(1) { transition-delay: 0.1s; }
    .principle-card:nth-child(2) { transition-delay: 0.2s; }
    
    .team-card:nth-child(1) { transition-delay: 0.1s; }
    .team-card:nth-child(2) { transition-delay: 0.2s; }
    .team-card:nth-child(3) { transition-delay: 0.3s; }
    
    .value-card:nth-child(1) { transition-delay: 0.1s; }
    .value-card:nth-child(2) { transition-delay: 0.2s; }
    .value-card:nth-child(3) { transition-delay: 0.3s; }
    .value-card:nth-child(4) { transition-delay: 0.4s; }
    
    body.loaded {
        opacity: 1;
    }
    
    body {
        opacity: 0;
        transition: opacity 0.5s ease;
    }
`;
document.head.appendChild(style);