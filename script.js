// Global state for completion animation
let hasTriggeredCompletion = false;

 
function setTheme(isDark) {
  document.body.classList.toggle('dark', isDark);
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = isDark ? '☀️' : '🌙';
  try { localStorage.setItem('theme', isDark ? 'dark' : 'light'); } catch {}
}

function initTheme() {
  let isDark = false;
  try {
    const saved = localStorage.getItem('theme');
    if (saved) {
      isDark = saved === 'dark';
    } else if (window.matchMedia) {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
  } catch {}
  setTheme(isDark);

  const btn = document.getElementById('themeToggle');
  if (btn) {
    btn.addEventListener('click', () => {
      const nowDark = !document.body.classList.contains('dark');
      setTheme(nowDark);
    });
  }
}

 
function initLanding() {
  const landing = document.getElementById('landing');
  const enterBtn = document.getElementById('enterBtn');
  const hasEntered = (() => { try { return localStorage.getItem('entered') === 'true'; } catch { return false; } })();

  if (!hasEntered) {
    document.body.classList.remove('entered');
    document.body.classList.add('lock-scroll');
  } else {
    document.body.classList.add('entered');
    document.body.classList.remove('lock-scroll');
    if (landing) landing.setAttribute('aria-hidden', 'true');
  }

  if (enterBtn) {
    enterBtn.addEventListener('click', () => {
      document.body.classList.add('entered');
      document.body.classList.remove('lock-scroll');
      if (landing) landing.setAttribute('aria-hidden', 'true');
      try { localStorage.setItem('entered', 'true'); } catch {}
    });
  }
}

 
function setupTOCAccordion() {
  document.querySelectorAll('.toc > li').forEach((li) => {
    const sub = li.querySelector(':scope > ul.subsection');
    if (sub) {
      li.classList.add('has-children');
      if (!li.classList.contains('collapsed')) li.classList.add('collapsed');

      let toggle = li.querySelector(':scope > button.toc-toggle');
      if (!toggle) {
        toggle = document.createElement('button');
        toggle.className = 'toc-toggle';
        toggle.type = 'button';
        toggle.setAttribute('aria-label', 'Toggle subsection');
        toggle.textContent = '▸';
        li.prepend(toggle);
      }

      toggle.setAttribute('aria-expanded', String(!li.classList.contains('collapsed')));
      toggle.addEventListener('click', () => {
        li.classList.toggle('collapsed');
        const expanded = !li.classList.contains('collapsed');
        toggle.textContent = expanded ? '▾' : '▸';
        toggle.setAttribute('aria-expanded', String(expanded));
      });
    }
  });
}

 
function setupTOCSearch() {
  const input = document.getElementById('tocSearch');
  if (!input) return;
  const allLis = Array.from(document.querySelectorAll('.toc li'));

  function matchAndFilter(query) {
    const q = query.trim().toLowerCase();
    if (!q) {
      allLis.forEach((li) => { li.style.display = ''; });
      document.querySelectorAll('.toc li.has-children').forEach((li) => li.classList.add('collapsed'));
      return;
    }

    allLis.forEach((li) => { li.style.display = 'none'; });
    document.querySelectorAll('.toc a').forEach((a) => {
      const text = a.textContent ? a.textContent.toLowerCase() : '';
      if (text.includes(q)) {
        let li = a.parentElement;
        while (li && li.tagName !== 'LI') li = li.parentElement;
        while (li) {
          li.style.display = '';
          if (li.classList && li.classList.contains('collapsed')) li.classList.remove('collapsed');
          li = li.parentElement ? li.parentElement.closest('li') : null;
        }
      }
    });
  }

  input.addEventListener('input', (e) => matchAndFilter(e.target.value));
}

// Copy to clipboard functionality
// Triggered by inline onclick on formula copy buttons
function copyToClipboard(button) {
  const formula = button.nextSibling && button.nextSibling.textContent ? button.nextSibling.textContent : '';
  if (!formula) return;
  navigator.clipboard.writeText(formula).then(() => {
    const originalText = button.textContent;
    button.textContent = 'Copied!';
    button.style.background = '#28a745';
    setTimeout(() => {
      button.textContent = originalText;
      button.style.background = '#4299e1';
    }, 2000);
  });
}

// Subtle completion animation
function triggerCompletion() {
  const progressCircle = document.getElementById('progressCircle');
  const progressText = document.getElementById('progressText');
  if (!progressCircle || !progressText) return;

  progressCircle.classList.add('progress-complete');
  progressText.style.color = '#ffd700';
  progressText.style.fontWeight = 'bold';

  setTimeout(() => {
    progressCircle.classList.remove('progress-complete');
    progressText.style.color = '';
    progressText.style.fontWeight = '';
  }, 2000);
}

// Keep active TOC item visible
function scrollTocToActive() {
  const tocContainer = document.getElementById('tocScroll') || document.getElementById('sidebar');
  const activeLink = document.querySelector('.toc a.active');
  if (!tocContainer || !activeLink) return;

  const containerRect = tocContainer.getBoundingClientRect();
  const linkRect = activeLink.getBoundingClientRect();
  const currentScroll = tocContainer.scrollTop;

  const linkRelativeTop = linkRect.top - containerRect.top;
  const linkRelativeBottom = linkRect.bottom - containerRect.top;

  if (linkRelativeTop < 0) {
    tocContainer.scrollTop = currentScroll + linkRelativeTop - 20;
  } else if (linkRelativeBottom > containerRect.height) {
    tocContainer.scrollTop = currentScroll + linkRelativeBottom - containerRect.height + 20;
  }
}

// Progress tracking and TOC highlighting
function updateProgress() {
  const sections = document.querySelectorAll('.section');
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollHeight = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const scrollProgress = Math.min(scrollTop / scrollHeight, 1);
  const percentage = Math.round(scrollProgress * 100);

  const scrollBar = document.getElementById('scrollProgress');
  if (scrollBar) {
    scrollBar.style.width = `${percentage}%`;
  }

  if (scrollTop <= 0) {
    const tocContainer = document.getElementById('tocScroll') || document.getElementById('sidebar');
    if (tocContainer) tocContainer.scrollTop = 0;
  }

  let activeSection = null;
  const offset = 100;
  sections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    if (rect.top <= offset) {
      activeSection = section;
    }
  });

  document.querySelectorAll('.toc a').forEach((a) => a.classList.remove('active'));
  if (activeSection) {
    const activeLink = document.querySelector(`a[href="#${activeSection.id}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
      
      let node = activeLink.parentElement;
      while (node) {
        if (node.classList && node.classList.contains('collapsed')) node.classList.remove('collapsed');
        node = node.parentElement ? node.parentElement.closest('li') : null;
      }
      scrollTocToActive();
    }
  }
}

// Back to top
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  const tocContainer = document.getElementById('tocScroll') || document.getElementById('sidebar');
  if (tocContainer) tocContainer.scrollTop = 0;
}

// Smooth scrolling for TOC links and initial setup
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.toc a').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').substring(1);
      const target = document.getElementById(targetId);
      if (target) {
        const targetTop = target.offsetTop - 20;
        window.scrollTo({ top: targetTop, behavior: 'smooth' });
      }
    });
  });
  setupTOCAccordion();
  initLanding();

  const toggleBtn = document.getElementById('tocPanelToggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('toc-collapsed');
    });
  }

  const showLandingBtn = document.getElementById('showLanding');
  if (showLandingBtn) {
    showLandingBtn.addEventListener('click', () => {
      const landing = document.getElementById('landing');
      if (landing) {
        document.body.classList.remove('entered');
        document.body.classList.add('lock-scroll');
        landing.removeAttribute('aria-hidden');
        try { localStorage.setItem('entered', 'false'); } catch {}
      }
    });
  }

  // Initialize and bind progress updates
  updateProgress();
  window.addEventListener('scroll', updateProgress, { passive: true });
});
