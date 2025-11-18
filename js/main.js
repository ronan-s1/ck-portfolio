// =====================================================
// Clarissa Kelly Portfolio - Main JavaScript
// =====================================================

// Set current year in footer
document.addEventListener('DOMContentLoaded', () => {
    const yearElement = document.getElementById('year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
    
    initMobileMenu();
    initScrollAnimations();
    initGallery();
    initLightbox();
    initContactForm();
});

// =====================================================
// Mobile Navigation
// =====================================================
function initMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', () => {
            mobileToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
        
        // Close menu when clicking a link
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                mobileToggle.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!mobileToggle.contains(e.target) && !navLinks.contains(e.target)) {
                mobileToggle.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    }
}

// =====================================================
// Scroll Animations (Simple AOS alternative)
// =====================================================
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('aos-animate');
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('[data-aos]').forEach(el => {
        observer.observe(el);
    });
}

// =====================================================
// Gallery - Load images from JSON
// =====================================================
let galleryData = [];

async function initGallery() {
    const galleryGrid = document.getElementById('gallery-grid');
    const masonryGallery = document.getElementById('masonry-gallery');
    
    if (!galleryGrid && !masonryGallery) return;
    
    try {
        const response = await fetch('work-data.json');
        galleryData = await response.json();
        
        if (galleryGrid) {
            renderGallery(galleryData);
        }
        
        if (masonryGallery) {
            renderMasonryGallery(galleryData);
        }
    } catch (error) {
        console.error('Error loading gallery data:', error);
        // Show placeholder message if JSON fails to load
        const target = galleryGrid || masonryGallery;
        if (target) {
            target.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                    <p style="color: #666; font-size: 1.1rem;">
                        Gallery images will appear here once you add them to the <code>images/work/</code> 
                        folder and update <code>work-data.json</code>.
                    </p>
                    <p style="color: #999; font-size: 0.95rem; margin-top: 1rem;">
                        See the README file for instructions on adding images.
                    </p>
                </div>
            `;
        }
    }
}

function renderGallery(items) {
    const galleryGrid = document.getElementById('gallery-grid');
    
    if (!galleryGrid || items.length === 0) return;
    
    galleryGrid.innerHTML = items.map((item, index) => `
        <div class="gallery-item" data-index="${index}" data-aos="fade-up" data-aos-delay="${index * 50}">
            <div class="image-container">
                <img src="images/work/${item.filename}" 
                     alt="${item.title}" 
                     loading="lazy"
                     onerror="this.src='images/work/placeholder.jpg'">
            </div>
            <div class="gallery-item-overlay">
                <h3 class="gallery-item-title">${item.title}</h3>
                <p class="gallery-item-info">${item.medium} - ${item.dimensions}</p>
            </div>
        </div>
    `).join('');
    
    // Re-initialize scroll animations for new elements
    initScrollAnimations();
}

function renderMasonryGallery(items) {
    const masonryGallery = document.getElementById('masonry-gallery');
    
    if (!masonryGallery || items.length === 0) return;
    
    masonryGallery.innerHTML = items.map((item, index) => `
        <div class="masonry-item" data-index="${index}">
            <div class="masonry-item-image-wrapper" style="background-color: ${item.colour || '#f0f0f0'};">
                <img src="images/work/${item.filename}" 
                     alt="${item.title}" 
                     loading="lazy"
                     onerror="this.src='images/work/placeholder.jpg'">
            </div>
            <div class="masonry-item-overlay">
                <h3>${item.title}</h3>
                <p>${item.medium} - ${item.dimensions}</p>
            </div>
        </div>
    `).join('');
}

// =====================================================
// Lightbox
// =====================================================
let currentImageIndex = 0;

function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    
    if (!lightbox) return;
    
    // Open lightbox when clicking gallery item
    document.addEventListener('click', (e) => {
        const galleryItem = e.target.closest('.gallery-item');
        const masonryItem = e.target.closest('.masonry-item');
        const gridItem = e.target.closest('.grid-item');
        
        const item = galleryItem || masonryItem || gridItem;
        
        if (item && item.dataset.index !== undefined) {
            currentImageIndex = parseInt(item.dataset.index);
            openLightbox(currentImageIndex);
        }
    });
    
    // Close lightbox
    document.querySelector('.lightbox-close')?.addEventListener('click', closeLightbox);
    
    // Previous/Next navigation
    document.querySelector('.lightbox-prev')?.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex - 1 + galleryData.length) % galleryData.length;
        updateLightboxImage(currentImageIndex);
    });
    
    document.querySelector('.lightbox-next')?.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex + 1) % galleryData.length;
        updateLightboxImage(currentImageIndex);
    });
    
    // Close on background click
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        
        switch(e.key) {
            case 'Escape':
                closeLightbox();
                break;
            case 'ArrowLeft':
                document.querySelector('.lightbox-prev')?.click();
                break;
            case 'ArrowRight':
                document.querySelector('.lightbox-next')?.click();
                break;
        }
    });
}

function openLightbox(index) {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox || !galleryData[index]) return;
    
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
    updateLightboxImage(index);
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;
    
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
}

function updateLightboxImage(index) {
    const item = galleryData[index];
    if (!item) return;
    
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxTitle = document.getElementById('lightbox-title');
    const lightboxInfo = document.getElementById('lightbox-info');
    const lightboxDescription = document.getElementById('lightbox-description');
    
    if (lightboxImage) {
        lightboxImage.src = `images/work/${item.filename}`;
        lightboxImage.alt = item.title;
        
        // Handle image load error
        lightboxImage.onerror = () => {
            lightboxImage.src = 'images/work/placeholder.jpg';
        };
    }
    
    if (lightboxTitle) lightboxTitle.textContent = item.title;
    if (lightboxInfo) lightboxInfo.textContent = `${item.medium} - ${item.dimensions}`;
    if (lightboxDescription) lightboxDescription.textContent = item.description;
}

// =====================================================
// Touch/Swipe Support for Lightbox
// =====================================================
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', (e) => {
    const lightbox = document.getElementById('lightbox');
    if (lightbox?.classList.contains('active')) {
        touchStartX = e.changedTouches[0].screenX;
    }
});

document.addEventListener('touchend', (e) => {
    const lightbox = document.getElementById('lightbox');
    if (lightbox?.classList.contains('active')) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }
});

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            // Swipe left - next image
            document.querySelector('.lightbox-next')?.click();
        } else {
            // Swipe right - previous image
            document.querySelector('.lightbox-prev')?.click();
        }
    }
}

// =====================================================
// Contact Form
// =====================================================
function initContactForm() {
    const contactForm = document.getElementById('contact-form');
    
    if (!contactForm) return;
    
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData);
        
        console.log('Form submitted:', data);
        
        // Show success message
        alert('Thank you for your message! This is a demo form. To make it functional, please integrate it with a form service like Formspree, Netlify Forms, or Basin. See the README for instructions.');
        
        // Reset form
        contactForm.reset();
        
        // In a real implementation, you would send the data to a backend or form service
        // Example with Formspree:
        // fetch('https://formspree.io/f/YOUR_FORM_ID', {
        //     method: 'POST',
        //     body: formData,
        //     headers: {
        //         'Accept': 'application/json'
        //     }
        // })
        // .then(response => {
        //     if (response.ok) {
        //         alert('Message sent successfully!');
        //         contactForm.reset();
        //     } else {
        //         alert('There was a problem sending your message.');
        //     }
        // })
        // .catch(error => {
        //     alert('There was a problem sending your message.');
        // });
    });
}

// =====================================================
// Smooth scroll for anchor links
// =====================================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        
        e.preventDefault();
        const target = document.querySelector(href);
        
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// =====================================================
// Navbar scroll effect (optional enhancement)
// =====================================================
let lastScrollTop = 0;
const nav = document.querySelector('.main-nav') || document.querySelector('.minimal-nav');

window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Add scrolled class when scrolled
    if (scrollTop > 50) {
        nav?.classList.add('scrolled');
    } else {
        nav?.classList.remove('scrolled');
    }
    
    lastScrollTop = scrollTop;
});

