(function () {
  const NAV_URL = 'nav.html';
  const FOOTER_URL = 'footer.html';

  function isPlainLeftClick(event) {
    return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
  }

  function attachNavNavigationGuard() {
    document.addEventListener(
      'click',
      function (event) {
        if (!(event.target instanceof Element)) return;
        const link = event.target.closest('.site-nav[aria-label="Site navigation"] a[href]');
        if (!link || !isPlainLeftClick(event)) return;

        const href = link.getAttribute('href') || '';
        if (!href || href.charAt(0) === '#' || href.startsWith('mailto:') || href.startsWith('tel:')) return;

        event.preventDefault();
        event.stopImmediatePropagation();
        window.location.assign(link.href);
      },
      true
    );
  }

  function removeLegacyNavigation() {
    document
      .querySelectorAll(
        '[data-ui="site-header"], .site-header__spacer, .site-nav[data-ui="site-nav"], [data-ui="site-footer"], #page-2668, [data-ui="gdpr"], .site-loader, .site-transition'
      )
      .forEach(function (element) {
        element.remove();
      });
  }

  function setMenuState(btn, menu, isOpen) {
    btn.setAttribute('aria-expanded', String(isOpen));
    btn.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    menu.hidden = !isOpen;
  }

  function attachNavToggle() {
    const btn = document.querySelector('.site-nav__hamburger');
    const menu = document.getElementById('site-nav__mobile-menu');
    if (!btn || !menu) return;
    setMenuState(btn, menu, false);
    btn.addEventListener('click', function () {
      const open = btn.getAttribute('aria-expanded') === 'true';
      setMenuState(btn, menu, !open);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        setMenuState(btn, menu, false);
      }
    });
    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        setMenuState(btn, menu, false);
      });
    });
  }

  function markCurrentNavLink() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const links = document.querySelectorAll('.site-nav__link, .site-nav__mobile-link');
    links.forEach(function (link) {
      const href = (link.getAttribute('href') || '').split('#')[0] || 'index.html';
      const isCurrent =
        (currentPath === '' && href === 'index.html') ||
        href === currentPath ||
        (currentPath === 'index.html' && href === 'index.html');
      if (isCurrent) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  async function mountNav() {
    removeLegacyNavigation();
    if (document.body && document.body.hasAttribute('data-disable-shared-nav')) return;
    if (document.querySelector('.site-nav[aria-label="Site navigation"]')) {
      markCurrentNavLink();
      attachNavToggle();
      return;
    }
    try {
      const response = await fetch(NAV_URL);
      if (!response.ok) throw new Error('Failed to load nav');
      const html = await response.text();
      const template = document.createElement('template');
      template.innerHTML = html.trim();
      const fragment = template.content;
      const firstChild = document.body.firstElementChild;
      if (firstChild) {
        document.body.insertBefore(fragment, firstChild);
      } else {
        document.body.appendChild(fragment);
      }
      markCurrentNavLink();
      attachNavToggle();
    } catch (error) {
      console.error('nav-loader:', error);
    }
  }

  async function mountFooter() {
    const sharedFooter = document.querySelector('.site-footer:not([data-ui="site-footer"])');
    if (sharedFooter) return;
    try {
      const response = await fetch(FOOTER_URL);
      if (!response.ok) throw new Error('Failed to load footer');
      const html = await response.text();
      const template = document.createElement('template');
      template.innerHTML = html.trim();
      const fragment = template.content;
      const footerStyle = fragment.querySelector('style');
      if (footerStyle && document.head) {
        document.head.appendChild(footerStyle);
      }
      const main = document.querySelector('main');
      const footer = fragment.querySelector('.site-footer');
      if (!footer) throw new Error('Footer markup missing');
      if (main && main.parentNode) {
        main.insertAdjacentElement('afterend', footer);
      } else {
        document.body.appendChild(footer);
      }

      const year = document.querySelector('[data-footer-year]');
      if (year) {
        year.textContent = String(new Date().getFullYear());
      }
    } catch (error) {
      console.error('footer-loader:', error);
    }
  }

  if (document.readyState === 'loading') {
    attachNavNavigationGuard();
    document.addEventListener('DOMContentLoaded', mountNav);
    document.addEventListener('DOMContentLoaded', mountFooter);
  } else {
    attachNavNavigationGuard();
    mountNav();
    mountFooter();
  }
})();
