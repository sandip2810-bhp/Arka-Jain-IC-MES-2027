// IC-MES 2027 Interactive Controller (IIT Jodhpur ICEMD Design Edition)
document.addEventListener('DOMContentLoaded', () => {

  // Ensure clean standard theme without toggle
  try {
    localStorage.removeItem('icmes-theme');
  } catch (e) {}
  document.documentElement.removeAttribute('data-theme');

  // ==========================================================================
  // 2. Real-Time Countdown Timer (Target: June 1, 2027)
  // ==========================================================================
  const targetDate = new Date("June 1, 2027 09:00:00").getTime();

  function updateCountdown() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance < 0) {
      const daysEl = document.getElementById("days");
      if (daysEl) daysEl.textContent = "0";
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const dEl = document.getElementById("days");
    const hEl = document.getElementById("hours");
    const mEl = document.getElementById("minutes");
    const sEl = document.getElementById("seconds");

    if (dEl) dEl.textContent = days.toString().padStart(2, '0');
    if (hEl) hEl.textContent = hours.toString().padStart(2, '0');
    if (mEl) mEl.textContent = minutes.toString().padStart(2, '0');
    if (sEl) sEl.textContent = seconds.toString().padStart(2, '0');
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  // ==========================================================================
  // 3. Tab Navigation (About Section & Publication Section)
  // ==========================================================================
  document.querySelectorAll('[data-tab-target]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute('data-tab-target');
      if (!targetId) return;

      const container = btn.closest('.card') || btn.closest('section');
      if (container) {
        container.querySelectorAll('[data-tab-target]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        container.querySelectorAll('.tab-pane, .pub-tab-pane').forEach(pane => {
          pane.classList.remove('show', 'active');
        });

        const activePane = container.querySelector('#' + targetId) || document.getElementById(targetId);
        if (activePane) {
          activePane.classList.add('show', 'active');
        }
      }
    });
  });



  // ==========================================================================
  // 6. Header Scroll & Back-to-Top Button
  // ==========================================================================
  const navbar = document.querySelector('.navbar');
  const topBtn = document.getElementById('topBtn');

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    if (navbar) navbar.classList.toggle('scrolled', scrollY > 40);
    if (topBtn) topBtn.classList.toggle('show', scrollY > 200);
  }, { passive: true });

  if (topBtn) {
    topBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Mobile menu toggle
  const navToggle = document.getElementById('navToggle');
  const navCollapse = document.getElementById('nav');
  if (navToggle && navCollapse) {
    navToggle.addEventListener('click', () => {
      navCollapse.classList.toggle('show');
    });

    navCollapse.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navCollapse.classList.remove('show');
      });
    });
  }

  // ==========================================================================
  // 7. Interactive Theme Search & Filter
  // ==========================================================================
  const searchInput = document.getElementById('theme-search-input');
  const pillButtons = document.querySelectorAll('.pill-btn');
  const themeCards = document.querySelectorAll('.theme-card');
  const countTag = document.getElementById('theme-count');

  if (themeCards.length > 0) {
    function filterThemes() {
      const query = (searchInput?.value || '').toLowerCase().trim();
      const activeFilter = document.querySelector('.pill-btn.active')?.dataset.filter || 'all';
      let visibleCount = 0;

      themeCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        let matchesCategory = true;

        if (activeFilter === 'ai') {
          matchesCategory = text.includes('artificial intelligence') || text.includes('data science') || text.includes('cybersecurity') || text.includes('quantum');
        } else if (activeFilter === 'robotics') {
          matchesCategory = text.includes('robotics') || text.includes('3d printing') || text.includes('mechanical') || text.includes('smart manufacturing') || text.includes('control systems');
        } else if (activeFilter === 'energy') {
          matchesCategory = text.includes('energy') || text.includes('aerospace') || text.includes('sustainable') || text.includes('ev');
        } else if (activeFilter === 'biomedical') {
          matchesCategory = text.includes('biomedical') || text.includes('biomaterials') || text.includes('healthcare');
        }

        const matchesSearch = query === '' || text.includes(query);

        if (matchesCategory && matchesSearch) {
          card.classList.remove('theme-hidden');
          visibleCount++;
        } else {
          card.classList.add('theme-hidden');
        }
      });

      if (countTag) {
        countTag.textContent = `Showing ${visibleCount} of ${themeCards.length} tracks`;
      }
    }

    if (searchInput) searchInput.addEventListener('input', filterThemes);

    pillButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        pillButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterThemes();
      });
    });
  }

  // ==========================================================================
  // 8. Active Nav Link on Scroll
  // ==========================================================================
  const sections = document.querySelectorAll('section[id], header[id], main[id]');
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link[href^="#"]');

  window.addEventListener('scroll', () => {
    let currentId = '';
    const scrollPos = window.scrollY + 120;

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        currentId = '#' + section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      if (link.getAttribute('href') === currentId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }, { passive: true });
});
