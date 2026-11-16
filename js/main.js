// =====================================================
// Clarissa Kelly Portfolio - Main JavaScript
// =====================================================

// Set current year in footer
document.addEventListener('DOMContentLoaded', () => {
    const yearElement = document.getElementById('year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
    
    initNavState();
    initMobileMenu();
    initScrollAnimations();
    initGallery();
    initExhibitionCarousels();
    initLightbox();
    initContactForm();
});

// =====================================================
// Current page / section in the nav
// =====================================================
function initNavState() {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    const type = new URLSearchParams(window.location.search).get('type');

    document.querySelectorAll('.minimal-menu a, .offcanvas-body a').forEach(link => {
        const url = new URL(link.getAttribute('href'), window.location.href);
        const linkPage = url.pathname.split('/').pop() || 'index.html';
        if (linkPage !== page) return;
        if (page !== 'work.html') {
            link.setAttribute('aria-current', 'page');
        } else if (link.classList.contains('nav-dropdown-toggle')) {
            link.classList.add('is-current');
            if (!type) link.setAttribute('aria-current', 'page');
        } else if (type && url.searchParams.get('type') === type) {
            link.setAttribute('aria-current', 'page');
        }
    });

    if (page === 'work.html') {
        const worksToggle = document.querySelector('.offcanvas-body .nav-subgroup-title');
        worksToggle?.classList.add('is-current');
        if (type && worksToggle) {
            worksToggle.classList.remove('collapsed');
            worksToggle.setAttribute('aria-expanded', 'true');
            document.getElementById('worksSubnav')?.classList.add('show');
        }
    }
}

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
let activeFilteredData = [];
let activeYear = 'all';

async function initGallery() {
    const galleryGrid = document.getElementById('gallery-grid');
    const masonryGallery = document.getElementById('masonry-gallery');
    
    if (!galleryGrid && !masonryGallery) return;
    
    const showGalleryError = (detail) => {
        const target = galleryGrid || masonryGallery;
        if (!target) return;
        const fileHint =
            window.location.protocol === 'file:'
                ? `<p style="color: #a42f40; font-size: 1rem; margin-top: 1rem;">This page was opened as a file (file://). Start a local server in the project folder, e.g. <code>python3 -m http.server 8080</code>, then open <code>http://localhost:8080/work.html</code> so the browser can load <code>work-data.json</code>.</p>`
                : '';
        const safe = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        target.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; max-width: 36rem; margin: 0 auto;">
                    <p style="color: #666; font-size: 1.1rem;">
                        Could not load the gallery. Check that <code>work-data.json</code> is present, and every <code>filename</code> matches a file in <code>images/work/</code> (then run <code>npm run images</code>).
                    </p>
                    ${fileHint}
                    <p style="color: #999; font-size: 0.95rem; margin-top: 1rem;">${safe(detail)}</p>
                </div>
            `;
    };

    const workType = new URLSearchParams(window.location.search).get('type');
    if (masonryGallery) {
        const labels = { paintings: 'Paintings', paper: 'Works on Paper', exhibitions: 'Exhibitions' };
        if (!labels[workType]) {
            document.getElementById('work-landing')?.removeAttribute('hidden');
            document.getElementById('work-year-filter')?.setAttribute('hidden', '');
            return;
        }
        document.title = `${labels[workType]} | Clarissa Kelly`;
        const heading = document.getElementById('work-heading');
        if (heading) {
            heading.textContent = labels[workType];
            heading.removeAttribute('hidden');
        }
        if (workType === 'exhibitions') {
            document.getElementById('work-exhibitions')?.removeAttribute('hidden');
            document.getElementById('work-year-filter')?.setAttribute('hidden', '');
            masonryGallery.innerHTML = '';
            return;
        }
    }

    try {
        const response = await fetch('work-data.json');
        if (!response.ok) {
            throw new Error('work-data.json returned HTTP ' + response.status);
        }
        galleryData = await response.json();
        if (!Array.isArray(galleryData)) throw new Error('work-data.json is not a list');
        if (masonryGallery) {
            galleryData = galleryData.filter(item => item.category === (workType === 'paper' ? 'paper' : 'paintings'));
        }

        if (!Array.isArray(galleryData) || galleryData.length === 0) {
            showGalleryError('Gallery list is empty.');
            return;
        }

        if (galleryGrid) {
            renderGallery(galleryData);
        }

        if (masonryGallery) {
            renderYearFilter(galleryData);
            activeFilteredData = galleryData;
            renderMasonryGallery(galleryData);
        }
    } catch (error) {
        console.error('Error loading gallery data:', error);
        showGalleryError(error.message || '');
    }
}

function renderYearFilter(items) {
    const filterContainer = document.getElementById('work-year-filter');
    if (!filterContainer) return;

    const years = [...new Set(items.map(item => item.year))].sort((a, b) => b - a);

    const buttons = ['all', ...years].map(year => {
        const label = year === 'all' ? 'All' : year;
        const isActive = year === 'all' ? ' active' : '';
        return `<button class="year-filter-btn${isActive}" data-year="${year}">${label}</button>`;
    });

    filterContainer.innerHTML = buttons.join('');

    filterContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.year-filter-btn');
        if (!btn) return;

        const selectedYear = btn.dataset.year;
        if (selectedYear === activeYear) return;

        activeYear = selectedYear;

        filterContainer.querySelectorAll('.year-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filtered = selectedYear === 'all'
            ? galleryData
            : galleryData.filter(item => item.year === selectedYear);

        const masonryGallery = document.getElementById('masonry-gallery');
        if (!masonryGallery) return;

        masonryGallery.classList.add('gallery-fade-out');

        setTimeout(() => {
            activeFilteredData = filtered;
            renderMasonryGallery(filtered);
            masonryGallery.classList.remove('gallery-fade-out');
        }, 250);
    });
}

// =====================================================
// Exhibition carousels - click a photo to open that exhibition in the lightbox
// =====================================================
let exhibitionView = null;

function initExhibitionCarousels() {
    document.querySelectorAll('.exhibition-carousel').forEach(carousel => {
        const inner = carousel.querySelector('.carousel-inner');
        inner?.addEventListener('click', () => {
            const photos = [...inner.querySelectorAll('.carousel-item img')];
            const index = [...inner.querySelectorAll('.carousel-item')].findIndex(i => i.classList.contains('active'));
            const header = carousel.closest('.exhibition')?.querySelector('.exhibition-header');
            exhibitionView = {
                carousel,
                photos,
                index: Math.max(index, 0),
                title: header?.querySelector('.exhibition-title'),
                meta: header?.querySelector('.exhibition-meta')?.textContent || '',
            };
            openLightboxView(renderExhibitionPhoto);
        });
    });
}

function renderExhibitionPhoto() {
    const { photos, index, title, meta } = exhibitionView;
    const photo = photos[index];
    const lightboxImage = document.getElementById('lightbox-image');
    if (lightboxImage) {
        lightboxImage.onerror = null;
        lightboxImage.onload = null;
        lightboxImage.sizes = lightboxSizes({ width: +photo.getAttribute('width'), height: +photo.getAttribute('height') });
        lightboxImage.srcset = photo.srcset;
        lightboxImage.src = photo.getAttribute('src');
        lightboxImage.alt = photo.alt;
    }
    document.getElementById('lightbox-title')?.replaceChildren(...[...(title?.childNodes || [])].map(n => n.cloneNode(true)));
    document.getElementById('lightbox-medium').textContent = meta;
    document.getElementById('lightbox-dim-cm').textContent = '';
    document.getElementById('lightbox-dim-in').textContent = '';
    document.getElementById('lightbox-counter').textContent = photos.length > 1 ? `${index + 1} / ${photos.length}` : '';
}

function workItemDimensionsCm(item) {
    return item.dimensions_cm || item.dimensions || 'TBD';
}

function workItemDimensionsIn(item) {
    return item.dimensions_in || 'TBD';
}

function renderGallery(items) {
    const galleryGrid = document.getElementById('gallery-grid');
    
    if (!galleryGrid || items.length === 0) return;
    
    galleryGrid.innerHTML = items.map((item, index) => {
        const metaLine = [item.medium, workItemDimensionsCm(item)].filter(Boolean).join(' · ');
        return `
        <div class="gallery-item" data-index="${index}" data-aos="fade-up" data-aos-delay="${index * 50}">
            <div class="image-container">
                <img src="${workImageUrl(item.filename, 1200)}" 
                     alt="${item.title}" 
                     loading="lazy">
            </div>
            <div class="gallery-item-overlay">
                <h3 class="gallery-item-title"><em>${item.title}</em>${item.year ? ', ' + item.year : ''}</h3>
                <p class="gallery-item-info">${metaLine}</p>
            </div>
        </div>
    `;
    }).join('');
    
    // Re-initialize scroll animations for new elements
    initScrollAnimations();
}

function renderMasonryGallery(items) {
    const masonryGallery = document.getElementById('masonry-gallery');
    
    if (!masonryGallery || items.length === 0) return;
    
    masonryGallery.innerHTML = items.map((item, index) => {
        const globalIndex = galleryData.indexOf(item);
        const eager = index < GALLERY_EAGER_COUNT;
        return `
        <div class="masonry-item" role="button" tabindex="0" aria-label="${escapeAttr(item.title + (item.year ? ', ' + item.year : ''))}" data-index="${globalIndex}" data-filtered-index="${index}"${item.width && item.height ? ` style="--ar:${(item.width / item.height).toFixed(4)}"` : ''}>
            <div class="masonry-item-image-wrapper">
                <img src="${workImageUrl(item.filename, 600)}"
                     srcset="${workImageSrcset(item)}"
                     sizes="${gallerySizes(item)}"
                     ${item.width && item.height ? `width="${item.width}" height="${item.height}"` : ''}
                     alt="${escapeAttr(item.title)}"
                     loading="${eager ? 'eager' : 'lazy'}"
                     decoding="async"
                     data-original="${escapeAttr(item.filename)}"
                     onerror="useOriginalImage(this, this.dataset.original)">
            </div>
        </div>
    `;
    }).join('');
}

// =====================================================
// Responsive image helpers (variants made by `npm run images`)
// =====================================================
function workImageUrl(filename, width) {
    const base = filename.replace(/\.[^.]+$/, '');
    return `images/work/opt/${base}-${width}.webp`;
}

// Roughly one desktop row; later rows stay lazy.
const GALLERY_EAGER_COUNT = 4;

function aspectRatio(item) {
    return item.width && item.height ? item.width / item.height : 1;
}

// Mirrors .masonry-gallery: full width (minus 1.5rem padding) up to 640px, otherwise
// up to 1.1 × aspect ratio × --row-height (340px up to 968px, 440px above).
function gallerySizes(item) {
    const ar = aspectRatio(item);
    return `(max-width: 640px) calc(100vw - 3rem), (max-width: 968px) ${Math.round(ar * 374)}px, ${Math.round(ar * 484)}px`;
}

// Mirrors #lightbox-image: (viewport − arrows − caption column) × 85vh on desktop,
// content width × 55vh on mobile, letterboxed by aspect ratio.
function lightboxSizes(item) {
    const ar = aspectRatio(item);
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (window.matchMedia('(max-width: 968px)').matches) {
        return `${Math.round(Math.min(vw - 48, vh * 0.55 * ar))}px`;
    }
    const captionW = Math.min(Math.max(208, vw * 0.2), 320);
    return `${Math.round(Math.min(vw - 192 - captionW - 32, vh * 0.85 * ar))}px`;
}

// Variants are never upscaled, so a "-2000" file from a narrower original is only item.width wide.
function workImageSrcset(item) {
    return [600, 900, 1200, 2000]
        .map(w => `${workImageUrl(item.filename, w)} ${item.width ? Math.min(w, item.width) : w}w`)
        .join(', ');
}

function useOriginalImage(img, filename) {
    img.onerror = null;
    img.removeAttribute('srcset');
    img.src = `images/work/${filename}`;
}

function escapeAttr(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function preloadNeighbours(index) {
    if (navigator.connection?.saveData) return;
    const data = getActiveData();
    const pos = data.indexOf(galleryData[index]);
    if (pos < 0) return;
    [1, -1].forEach(step => {
        const n = data[(pos + step + data.length) % data.length];
        if (n && n !== galleryData[index]) {
            const img = new Image();
            img.fetchPriority = 'low';
            img.sizes = lightboxSizes(n);
            img.srcset = workImageSrcset(n);
            img.src = workImageUrl(n.filename, 1200);
        }
    });
}

// =====================================================
// Lightbox
// =====================================================
let currentImageIndex = 0;
let currentFilteredIndex = 0;

function getActiveData() {
    return activeFilteredData.length ? activeFilteredData : galleryData;
}

function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    
    if (!lightbox) return;
    
    document.addEventListener('click', (e) => {
        const galleryItem = e.target.closest('.gallery-item');
        const masonryItem = e.target.closest('.masonry-item');
        const gridItem = e.target.closest('.grid-item');
        
        const item = galleryItem || masonryItem || gridItem;
        
        if (item && item.dataset.index !== undefined) {
            currentImageIndex = parseInt(item.dataset.index);
            currentFilteredIndex = item.dataset.filteredIndex !== undefined
                ? parseInt(item.dataset.filteredIndex)
                : currentImageIndex;
            openLightbox(currentImageIndex);
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const item = e.target.closest?.('.masonry-item');
        if (!item) return;
        e.preventDefault();
        item.click();
    });

    document.querySelector('.lightbox-close')?.addEventListener('click', closeLightbox);
    
    document.querySelector('.lightbox-prev')?.addEventListener('click', () => stepLightbox(-1));
    document.querySelector('.lightbox-next')?.addEventListener('click', () => stepLightbox(1));
    
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        
        if (e.key === 'Tab') {
            lightbox.classList.remove('opened-by-pointer');
            const focusable = [...lightbox.querySelectorAll('button')].filter(b => b.offsetParent !== null);
            if (!focusable.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            } else if (!lightbox.contains(document.activeElement)) {
                e.preventDefault();
                first.focus();
            }
            return;
        }

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

let savedScrollY = 0;
let focusBeforeLightbox = null;

function stepLightbox(step) {
    if (exhibitionView) {
        const count = exhibitionView.photos.length;
        exhibitionView.index = (exhibitionView.index + step + count) % count;
        renderExhibitionPhoto();
        return;
    }
    const data = getActiveData();
    currentFilteredIndex = (currentFilteredIndex + step + data.length) % data.length;
    currentImageIndex = galleryData.indexOf(data[currentFilteredIndex]);
    updateLightboxImage(currentImageIndex);
}

// Opening with a mouse/touch hides the close button's focus ring; opening with the keyboard keeps it.
let lastInputWasKeyboard = false;
document.addEventListener('keydown', () => { lastInputWasKeyboard = true; }, true);
document.addEventListener('pointerdown', () => { lastInputWasKeyboard = false; }, true);
document.addEventListener('mousedown', () => { lastInputWasKeyboard = false; }, true);

function openLightbox(index) {
    if (!galleryData[index]) return;
    exhibitionView = null;
    openLightboxView(() => updateLightboxImage(index));
}

function openLightboxView(render) {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;
    
    savedScrollY = window.scrollY;
    focusBeforeLightbox = document.activeElement;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.width = '100%';
    render();
    lightbox.classList.toggle('opened-by-pointer', !lastInputWasKeyboard);
    lightbox.querySelector('.lightbox-close')?.focus({ preventScroll: true });
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;
    
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, savedScrollY);
    focusBeforeLightbox?.focus?.({ preventScroll: true });
    focusBeforeLightbox = null;
    if (exhibitionView && window.bootstrap) {
        bootstrap.Carousel.getOrCreateInstance(exhibitionView.carousel).to(exhibitionView.index);
    }
    exhibitionView = null;
}

function updateLightboxImage(index) {
    const item = galleryData[index];
    if (!item) return;
    
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxTitle = document.getElementById('lightbox-title');
    const lightboxMedium = document.getElementById('lightbox-medium');
    const lightboxDimCm = document.getElementById('lightbox-dim-cm');
    const lightboxDimIn = document.getElementById('lightbox-dim-in');
    
    if (lightboxImage) {
        lightboxImage.onerror = () => useOriginalImage(lightboxImage, item.filename);
        lightboxImage.onload = () => {
            lightboxImage.onload = null;
            preloadNeighbours(index);
        };
        lightboxImage.sizes = lightboxSizes(item);
        lightboxImage.srcset = workImageSrcset(item);
        lightboxImage.src = workImageUrl(item.filename, 1200);
        lightboxImage.alt = item.title;
    }
    
    if (lightboxTitle) {
        const em = document.createElement('em');
        em.textContent = item.title || '';
        lightboxTitle.replaceChildren(em, item.year ? `, ${item.year}` : '');
    }
    const counter = document.getElementById('lightbox-counter');
    if (counter) {
        const data = getActiveData();
        const pos = data.indexOf(item);
        counter.textContent = pos >= 0 && data.length > 1 ? `${pos + 1} / ${data.length}` : '';
    }
    if (lightboxMedium) lightboxMedium.textContent = item.medium || '';
    if (lightboxDimCm) lightboxDimCm.textContent = item.dimensions_cm || item.dimensions || '';
    if (lightboxDimIn) lightboxDimIn.textContent = item.dimensions_in || '';
}

// =====================================================
// Touch/Swipe Support for Lightbox (Instagram-style)
// =====================================================
let touchStartX = 0;
let touchStartY = 0;
let touchCurrentX = 0;
let isSwiping = false;
let swipeLocked = false; // locks axis once determined

function getLightboxContent() {
    return document.querySelector('.lightbox.active .lightbox-content');
}

document.addEventListener('touchstart', (e) => {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox?.classList.contains('active')) return;
    const content = getLightboxContent();
    if (!content) return;

    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchCurrentX = touchStartX;
    isSwiping = false;
    swipeLocked = false;
    content.style.transition = 'none';
}, { passive: true });

document.addEventListener('touchmove', (e) => {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox?.classList.contains('active')) return;
    const content = getLightboxContent();
    if (!content) return;

    const dx = e.touches[0].clientX - touchStartX;
    const dy = e.touches[0].clientY - touchStartY;

    if (!swipeLocked) {
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
            swipeLocked = true;
            isSwiping = Math.abs(dx) > Math.abs(dy);
        }
    }

    if (isSwiping) {
        e.preventDefault();
        touchCurrentX = e.touches[0].clientX;
        const offset = touchCurrentX - touchStartX;
        const dampened = offset * 0.6;
        content.style.transform = `translateX(${dampened}px)`;
        content.style.opacity = 1 - Math.min(Math.abs(offset) / 600, 0.4);
    }
}, { passive: false });

document.addEventListener('touchend', (e) => {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox?.classList.contains('active')) return;
    const content = getLightboxContent();
    if (!content) return;

    if (!isSwiping) {
        content.style.transition = '';
        content.style.transform = '';
        content.style.opacity = '';
        return;
    }

    const diff = touchCurrentX - touchStartX;
    const swipeThreshold = 60;

    if (Math.abs(diff) > swipeThreshold) {
        const direction = diff > 0 ? -1 : 1; // -1 = prev, 1 = next
        const flyOut = direction > 0 ? '-100%' : '100%';
        content.style.transition = 'transform 0.25s ease, opacity 0.25s ease';
        content.style.transform = `translateX(${flyOut})`;
        content.style.opacity = '0';

        setTimeout(() => {
            stepLightbox(direction);

            const flyIn = direction > 0 ? '100%' : '-100%';
            content.style.transition = 'none';
            content.style.transform = `translateX(${flyIn})`;
            content.style.opacity = '0';

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    content.style.transition = 'transform 0.25s ease, opacity 0.25s ease';
                    content.style.transform = 'translateX(0)';
                    content.style.opacity = '1';
                });
            });
        }, 250);
    } else {
        content.style.transition = 'transform 0.25s ease, opacity 0.25s ease';
        content.style.transform = 'translateX(0)';
        content.style.opacity = '1';
    }

    isSwiping = false;
    swipeLocked = false;
}, { passive: true });

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

