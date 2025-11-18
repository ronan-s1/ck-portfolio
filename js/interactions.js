// =====================================================
// INTERACTIVE ANIMATIONS & EFFECTS
// =====================================================

// Custom Cursor
// =====================================================
const cursor = document.querySelector('.custom-cursor');
const cursorFollower = document.querySelector('.cursor-follower');

let mouseX = 0;
let mouseY = 0;
let cursorX = 0;
let cursorY = 0;
let followerX = 0;
let followerY = 0;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

function animateCursor() {
    // Smooth cursor movement
    const speed = 0.2;
    const followerSpeed = 0.1;
    
    cursorX += (mouseX - cursorX) * speed;
    cursorY += (mouseY - cursorY) * speed;
    
    followerX += (mouseX - followerX) * followerSpeed;
    followerY += (mouseY - followerY) * followerSpeed;
    
    if (cursor) {
        cursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
    }
    if (cursorFollower) {
        cursorFollower.style.transform = `translate(${followerX}px, ${followerY}px)`;
    }
    
    requestAnimationFrame(animateCursor);
}
animateCursor();

// Cursor hover effects
document.querySelectorAll('a, button, .grid-item, .masonry-item').forEach(el => {
    el.addEventListener('mouseenter', () => {
        cursor?.classList.add('cursor-hover');
        cursorFollower?.classList.add('cursor-hover');
    });
    
    el.addEventListener('mouseleave', () => {
        cursor?.classList.remove('cursor-hover');
        cursorFollower?.classList.remove('cursor-hover');
    });
});

// =====================================================
// Hero Parallax Effect
// =====================================================
const hero = document.getElementById('hero');
const heroImg = document.getElementById('hero-img');

if (hero && heroImg) {
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const heroHeight = hero.offsetHeight;
        
        if (scrolled < heroHeight) {
            // Parallax scroll effect only
            heroImg.style.transform = `translateY(${scrolled * 0.5}px) scale(1.1)`;
        }
    });
}

// =====================================================
// Mouse Movement Parallax on Hero
// =====================================================
if (hero) {
    hero.addEventListener('mousemove', (e) => {
        const { clientX, clientY } = e;
        const { offsetWidth, offsetHeight } = hero;
        
        const xPos = (clientX / offsetWidth - 0.5) * 30;
        const yPos = (clientY / offsetHeight - 0.5) * 30;
        
        if (heroImg) {
            heroImg.style.transform = `translate(${xPos}px, ${yPos}px) scale(1.1)`;
        }
    });
    
    hero.addEventListener('mouseleave', () => {
        if (heroImg) {
            heroImg.style.transform = 'translate(0, 0) scale(1.1)';
        }
    });
}

// =====================================================
// Grid Item Hover Effect (no tilt)
// =====================================================
document.querySelectorAll('.grid-item').forEach(item => {
    // Just the scale effect, no tilt
    item.addEventListener('mouseenter', () => {
        item.style.transform = 'translateY(-8px)';
    });
    
    item.addEventListener('mouseleave', () => {
        item.style.transform = 'translateY(0)';
    });
});

// =====================================================
// Reveal on Scroll Animations
// =====================================================
const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -100px 0px'
};

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            // Optionally unobserve after revealing
            revealObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.reveal-on-scroll').forEach(el => {
    revealObserver.observe(el);
});

// =====================================================
// Split Text Animation
// =====================================================
const splitTextElements = document.querySelectorAll('.split-text');

splitTextElements.forEach(element => {
    const text = element.textContent;
    element.innerHTML = '';
    
    text.split('').forEach((char, index) => {
        const span = document.createElement('span');
        span.textContent = char === ' ' ? '\u00A0' : char;
        span.style.animationDelay = `${index * 0.05}s`;
        span.classList.add('char');
        element.appendChild(span);
    });
});

// =====================================================
// Scroll Indicator Animation
// =====================================================
const scrollIndicator = document.querySelector('.scroll-indicator');
if (scrollIndicator) {
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 100) {
            scrollIndicator.style.opacity = '0';
            scrollIndicator.style.pointerEvents = 'none';
        } else {
            scrollIndicator.style.opacity = '1';
            scrollIndicator.style.pointerEvents = 'auto';
        }
    });
}

// =====================================================
// Smooth Scroll for Anchor Links
// =====================================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#' || href === '#!') return;
        
        e.preventDefault();
        const target = document.querySelector(href);
        
        if (target) {
            const offsetTop = target.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// =====================================================
// Image Lazy Load with Fade In
// =====================================================
const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            img.classList.add('loaded');
            imageObserver.unobserve(img);
        }
    });
});

document.querySelectorAll('img[loading="lazy"]').forEach(img => {
    imageObserver.observe(img);
});

// =====================================================
// Masonry Item Hover Effect (for work page)
// =====================================================
document.querySelectorAll('.masonry-item').forEach(item => {
    const img = item.querySelector('img');
    
    item.addEventListener('mouseenter', () => {
        if (img) {
            img.style.transform = 'scale(1.05)';
        }
    });
    
    item.addEventListener('mouseleave', () => {
        if (img) {
            img.style.transform = 'scale(1)';
        }
    });
});

// =====================================================
// Page Load Animation
// =====================================================
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

// =====================================================
// Disable custom cursor on touch devices
// =====================================================
if ('ontouchstart' in window) {
    cursor?.style.setProperty('display', 'none');
    cursorFollower?.style.setProperty('display', 'none');
}

// =====================================================
// FPS Counter (for debugging - remove in production)
// =====================================================
if (window.location.search.includes('debug')) {
    let lastTime = performance.now();
    let frames = 0;
    
    function showFPS() {
        frames++;
        const currentTime = performance.now();
        
        if (currentTime >= lastTime + 1000) {
            console.log(`FPS: ${frames}`);
            frames = 0;
            lastTime = currentTime;
        }
        
        requestAnimationFrame(showFPS);
    }
    showFPS();
}

