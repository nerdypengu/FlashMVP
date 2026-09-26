// Stats data configuration
const STATS = [
  { target: 120, decimals: 0, suffix: 'ms', label: 'Inference Time' },
  { target: 99.99, decimals: 2, suffix: '%', label: 'Platform Uptime' },
  { target: 24, decimals: 0, suffix: '/7', label: 'Autonomous Runtime' },
  { target: 2.4, decimals: 1, suffix: 'M', label: 'Context Windows' },
];

// easeOutCubic helper
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// Animate a single counter
function animateCounter(element, target, decimals, duration, startOffset) {
  setTimeout(() => {
    const startTime = performance.now();

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      const current = eased * target;

      element.textContent = current.toFixed(decimals);

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.textContent = target.toFixed(decimals);
      }
    }

    requestAnimationFrame(update);
  }, startOffset);
}

// Setup stats counter with IntersectionObserver
function initStats() {
  const statValues = document.querySelectorAll('.stat-value');
  const statsSection = document.querySelector('.stats');

  if (!statsSection || statValues.length === 0) return;

  let animated = false;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !animated) {
          animated = true;
          statValues.forEach((el, i) => {
            const config = STATS[i];
            if (!config) return;
            const duration = 1500 + i * 80;
            const startOffset = 480 + i * 90;
            animateCounter(el, config.target, config.decimals, duration, startOffset);
          });
          observer.unobserve(statsSection);
        }
      });
    },
    { threshold: 0.25 }
  );

  observer.observe(statsSection);
}

// Mobile Menu Controller
function initMobileMenu() {
  const burgerBtn = document.querySelector('.burger-btn');
  const overlay = document.querySelector('.mobile-overlay');
  const sheet = document.querySelector('.mobile-menu-sheet');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');

  if (!burgerBtn || !overlay || !sheet) return;

  function openMenu() {
    burgerBtn.classList.add('open');
    burgerBtn.setAttribute('aria-expanded', 'true');
    overlay.hidden = false;
    sheet.hidden = false;
    document.body.classList.add('menu-open');
  }

  function closeMenu() {
    burgerBtn.classList.remove('open');
    burgerBtn.setAttribute('aria-expanded', 'false');
    overlay.hidden = true;
    sheet.hidden = true;
    document.body.classList.remove('menu-open');
  }

  function toggleMenu() {
    const isOpen = burgerBtn.classList.contains('open');
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  burgerBtn.addEventListener('click', toggleMenu);
  overlay.addEventListener('click', closeMenu);

  // Close on Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !sheet.hidden) {
      closeMenu();
    }
  });

  // Close on mobile link click
  mobileLinks.forEach((link) => {
    link.addEventListener('click', () => {
      mobileLinks.forEach((l) => l.classList.remove('active'));
      link.classList.add('active');
      closeMenu();
    });
  });

  // Close on desktop resize
  window.addEventListener('resize', () => {
    if (window.innerWidth > 720 && !sheet.hidden) {
      closeMenu();
    }
  });
}

// Desktop Nav Active State
function initNavLinks() {
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navLinks.forEach((l) => l.classList.remove('active'));
      link.classList.add('active');
    });
  });
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initStats();
  initMobileMenu();
  initNavLinks();
});
