// Nav scroll effect
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 50);
});

// Hamburger menu
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
hamburger?.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

// Close menu on link click
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// Fade-in on scroll
const observer = new IntersectionObserver(
  entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
  { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
);
document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// Animated counters
function animateCounter(el, target, suffix = '') {
  const duration = 2000;
  const step = target / (duration / 16);
  let current = 0;
  const interval = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = Math.floor(current) + suffix;
    if (current >= target) clearInterval(interval);
  }, 16);
}

const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseInt(el.dataset.target, 10);
      const suffix = el.dataset.suffix || '';
      animateCounter(el, target, suffix);
      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-number[data-target]').forEach(el => counterObserver.observe(el));

// Smooth active nav highlight
const sections = document.querySelectorAll('section[id]');
const navItems = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(s => {
    if (window.scrollY >= s.offsetTop - 120) current = s.id;
  });
  navItems.forEach(a => {
    a.style.color = a.getAttribute('href') === `#${current}` ? 'var(--accent)' : '';
  });
});

// Init Lucide icons — run after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (typeof lucide !== 'undefined') lucide.createIcons();
});

// ── Lightbox (gallery-capable) ──
let galleryImages = [];
let galleryIndex  = 0;

function renderGalleryImage() {
  const lb  = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img');
  const ph  = document.getElementById('lightbox-placeholder');
  const src = galleryImages[galleryIndex];

  img.style.display = 'none';
  ph.style.display  = 'flex';

  if (src) {
    img.onload  = () => { img.style.display = 'block'; ph.style.display = 'none'; };
    img.onerror = () => { img.style.display = 'none';  ph.style.display = 'flex'; };
    img.src = src;
  }

  // Gallery mode (multiple images) toggles nav + counter
  lb.classList.toggle('gallery', galleryImages.length > 1);
  document.getElementById('lightbox-counter').textContent =
    galleryImages.length > 1 ? `${galleryIndex + 1} / ${galleryImages.length}` : '';
}

function openLightbox(images, startIndex, title, sub) {
  galleryImages = Array.isArray(images) ? images : [images];
  galleryIndex  = startIndex || 0;
  document.getElementById('lightbox-title').textContent = title || '';
  document.getElementById('lightbox-sub').textContent   = sub   || '';
  renderGalleryImage();

  const lb = document.getElementById('lightbox');
  lb.classList.add('active');
  lb.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function galleryNav(dir) {
  if (galleryImages.length < 2) return;
  galleryIndex = (galleryIndex + dir + galleryImages.length) % galleryImages.length;
  renderGalleryImage();
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  lb.classList.remove('active');
  lb.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  setTimeout(() => { document.getElementById('lightbox-img').src = ''; }, 300);
}

document.addEventListener('DOMContentLoaded', () => {
  // ── Custom Carousel: zone clicks (sides flip, center opens lightbox) ──
  document.querySelectorAll('.custom-carousel').forEach(carousel => {
    const slides = carousel.querySelectorAll('.cc-slide');
    const dots   = carousel.querySelectorAll('.cc-dot');
    const imgs   = [...slides].map(s => s.querySelector('img').getAttribute('src'));
    const area   = carousel.closest('.project-img-area');
    const title  = area?.dataset.title || '';
    let current  = 0;

    function goTo(index) {
      slides[current].classList.remove('active');
      dots[current]?.classList.remove('active');
      current = (index + slides.length) % slides.length;
      slides[current].classList.add('active');
      dots[current]?.classList.add('active');
    }

    // Explicit controls
    carousel.querySelector('.cc-prev')?.addEventListener('click', e => { e.stopPropagation(); goTo(current - 1); });
    carousel.querySelector('.cc-next')?.addEventListener('click', e => { e.stopPropagation(); goTo(current + 1); });
    dots.forEach((dot, i) => dot.addEventListener('click', e => { e.stopPropagation(); goTo(i); }));

    // Zone click: left 30% = prev, right 30% = next, center = open lightbox at current slide
    carousel.addEventListener('click', e => {
      const rect = carousel.getBoundingClientRect();
      const x = e.clientX - rect.left;
      if (x < rect.width * 0.3)      goTo(current - 1);
      else if (x > rect.width * 0.7) goTo(current + 1);
      else                           openLightbox(imgs, current, title, '');
    });

    // Auto-play every 20s
    setInterval(() => goTo(current + 1), 20000);
  });

  // ── Lightbox: cert cards (single image) ──
  document.querySelectorAll('.cert-item[data-img]').forEach(item => {
    item.addEventListener('click', () =>
      openLightbox([item.dataset.img], 0, item.dataset.title, item.dataset.issuer)
    );
  });

  // ── Lightbox: single-image project areas ──
  document.querySelectorAll('.project-img-area[data-img]').forEach(area => {
    area.addEventListener('click', () =>
      openLightbox([area.dataset.img], 0, area.dataset.title, '')
    );
  });

  // ── Lightbox gallery navigation ──
  document.querySelector('.lightbox-prev')?.addEventListener('click', e => { e.stopPropagation(); galleryNav(-1); });
  document.querySelector('.lightbox-next')?.addEventListener('click', e => { e.stopPropagation(); galleryNav(1); });

  // Click left/right half of the image to switch (when in gallery mode)
  const imgWrap = document.querySelector('.lightbox-img-wrap');
  imgWrap?.addEventListener('click', e => {
    if (e.target.closest('.lightbox-nav') || galleryImages.length < 2) return;
    const rect = imgWrap.getBoundingClientRect();
    galleryNav((e.clientX - rect.left) < rect.width / 2 ? -1 : 1);
  });

  // Swipe support (touch)
  let touchStartX = 0;
  imgWrap?.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
  imgWrap?.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) galleryNav(dx < 0 ? 1 : -1);
  });

  // Close on backdrop or button
  document.querySelector('.lightbox-backdrop')?.addEventListener('click', closeLightbox);
  document.querySelector('.lightbox-close')?.addEventListener('click', closeLightbox);

  // Keyboard: Esc closes, arrows navigate
  document.addEventListener('keydown', e => {
    if (!document.getElementById('lightbox').classList.contains('active')) return;
    if      (e.key === 'Escape')     closeLightbox();
    else if (e.key === 'ArrowLeft')  galleryNav(-1);
    else if (e.key === 'ArrowRight') galleryNav(1);
  });
});
