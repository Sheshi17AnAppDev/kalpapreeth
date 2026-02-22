// DOM Elements
const navbar = document.querySelector('.navbar');
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav-menu a');
const filterBtns = document.querySelectorAll('.filter-btn');
const blogCards = document.querySelectorAll('.blog-card');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.querySelector('.search-btn');
const pageBtns = document.querySelectorAll('.page-number');
const prevBtn = document.querySelector('.page-btn.prev');
const nextBtn = document.querySelector('.page-btn.next');
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

// Category filtering
filterBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        // Remove active class from all buttons
        filterBtns.forEach(b => b.classList.remove('active'));
        // Add active class to clicked button
        this.classList.add('active');
        
        const category = this.getAttribute('data-category');
        filterBlogPosts(category);
    });
});

// Filter blog posts by category
function filterBlogPosts(category) {
    blogCards.forEach(card => {
        if (category === 'all' || card.getAttribute('data-category') === category) {
            card.style.display = 'block';
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 100);
        } else {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
                card.style.display = 'none';
            }, 300);
        }
    });
    
    // Track filter interaction
    trackFilterInteraction(category);
}

// Search functionality
searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        performSearch();
    }
});

function performSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm) {
        blogCards.forEach(card => {
            const title = card.querySelector('h3').textContent.toLowerCase();
            const content = card.querySelector('p').textContent.toLowerCase();
            const category = card.getAttribute('data-category');
            
            if (title.includes(searchTerm) || content.includes(searchTerm) || category.includes(searchTerm)) {
                card.style.display = 'block';
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 100);
            } else {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    card.style.display = 'none';
                }, 300);
            }
        });
        
        trackSearchInteraction(searchTerm);
    }
}

// Pagination
pageBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        pageBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        const page = parseInt(this.textContent);
        loadBlogPage(page);
    });
});

prevBtn.addEventListener('click', () => {
    if (!prevBtn.disabled) {
        const currentPage = parseInt(document.querySelector('.page-number.active').textContent);
        loadBlogPage(currentPage - 1);
    }
});

nextBtn.addEventListener('click', () => {
    if (!nextBtn.disabled) {
        const currentPage = parseInt(document.querySelector('.page-number.active').textContent);
        loadBlogPage(currentPage + 1);
    }
});

// Blog card interactions
blogCards.forEach(card => {
    card.addEventListener('click', function() {
        const title = this.querySelector('h3').textContent;
        const category = this.getAttribute('data-category');
        
        // Add click animation
        this.style.transform = 'translateY(-5px) scale(1.02)';
        setTimeout(() => {
            this.style.transform = 'translateY(-10px)';
        }, 150);
        
        trackBlogCardClick(title, category);
        
        // Navigate to blog post (simulated)
        setTimeout(() => {
            // window.location.href = `/blog/${slugify(title)}`;
            showNotification(`Redirecting to: ${title}`, 'info');
        }, 500);
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
document.querySelectorAll('.blog-card, .featured-card, .hero-stats').forEach(el => {
    observer.observe(el);
});

// Backend Integration Hooks

// Load blog posts from API
async function loadBlogPage(page) {
    try {
        /*
        const response = await fetch(`https://api.yoursite.com/blog?page=${page}&limit=6`);
        const data = await response.json();
        
        const blogGrid = document.getElementById('blogGrid');
        blogGrid.innerHTML = '';
        
        data.posts.forEach(post => {
            const card = createBlogCard(post);
            blogGrid.appendChild(card);
        });
        
        updatePagination(data.totalPages, page);
        */
    } catch (error) {
        console.log('Blog loading placeholder - using static data');
    }
}

// Create blog card element
function createBlogCard(post) {
    const card = document.createElement('article');
    card.className = 'blog-card';
    card.setAttribute('data-category', post.category);
    
    card.innerHTML = `
        <div class="card-glow"></div>
        <div class="blog-image">
            <img src="${post.image}" alt="${post.title}">
            <div class="category-tag">${post.category}</div>
            <div class="read-time">${post.readTime} min read</div>
        </div>
        <div class="blog-content">
            <h3>${post.title}</h3>
            <p>${post.excerpt}</p>
            <div class="blog-meta">
                <div class="author-mini">
                    <div class="author-avatar-small">${post.authorInitials}</div>
                    <span>${post.author}</span>
                </div>
                <div class="post-date">${post.date}</div>
            </div>
        </div>
    `;
    
    return card;
}

// Update pagination controls
function updatePagination(totalPages, currentPage) {
    // Implementation for dynamic pagination
}

// Tracking functions
function trackFilterInteraction(category) {
    /*
    fetch('https://api.yoursite.com/analytics/filter-interaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            category: category,
            timestamp: new Date().toISOString()
        })
    });
    */
}

function trackSearchInteraction(searchTerm) {
    /*
    fetch('https://api.yoursite.com/analytics/search-interaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            search_term: searchTerm,
            timestamp: new Date().toISOString()
        })
    });
    */
}

function trackBlogCardClick(title, category) {
    /*
    fetch('https://api.yoursite.com/analytics/blog-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            post_title: title,
            category: category,
            timestamp: new Date().toISOString()
        })
    });
    */
}

// Utility function to create slugs
function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
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
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Analytics tracking
function trackPageView() {
    /*
    gtag('config', 'GA_MEASUREMENT_ID', {
        page_title: 'Blog',
        page_location: window.location.href
    });
    */
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    trackPageView();
    
    // Add animation classes
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 100);
});

// Add CSS for additional animations
const style = document.createElement('style');
style.textContent = `
    .blog-card,
    .featured-card,
    .hero-stats {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s ease;
    }
    
    .blog-card.animate-in,
    .featured-card.animate-in,
    .hero-stats.animate-in {
        opacity: 1;
        transform: translateY(0);
    }
    
    .blog-card:nth-child(1) { transition-delay: 0.1s; }
    .blog-card:nth-child(2) { transition-delay: 0.2s; }
    .blog-card:nth-child(3) { transition-delay: 0.3s; }
    .blog-card:nth-child(4) { transition-delay: 0.4s; }
    .blog-card:nth-child(5) { transition-delay: 0.5s; }
    .blog-card:nth-child(6) { transition-delay: 0.6s; }
    
    body.loaded {
        opacity: 1;
    }
    
    body {
        opacity: 0;
        transition: opacity 0.5s ease;
    }
`;
document.head.appendChild(style);