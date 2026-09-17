/* =============================================================================
   DegenBot — Telegram Mini App bridge
   -----------------------------------------------------------------------------
   This file is the ONLY Telegram-specific layer. app.js, data.js and styles.css
   stay untouched, so the showcase still runs as a plain website.

   It is intentionally defensive: every Telegram API call is feature-detected and
   wrapped, so an older client (or a desktop browser with no Telegram at all)
   degrades quietly instead of breaking the page.
   ========================================================================== */
(() => {
  'use strict';

  const wa = window.Telegram && window.Telegram.WebApp;

  /* ---------------------------------------------------------------- helpers */
  const call = (fn, ...args) => {
    try {
      if (typeof fn === 'function') return fn.apply(wa, args);
    } catch (err) {
      /* A main-thread Telegram client may reject an unsupported call.
         Never let that surface as a broken showcase. */
    }
    return undefined;
  };

  const min = wa && wa.viewportStableHeight
    ? (wa.viewportStableHeight < wa.viewportHeight ? wa.viewportStableHeight : wa.viewportHeight)
    : 0;

  /* Pin colour scheme to the product's own dark palette so the Telegram chrome
     always blends with the showcase, whichever theme the user runs. */
  const CHROME = {
    header: '#111412',
    background: '#111412',
    bottomBar: '#161c17'
  };

  const root = document.documentElement;
  const body = document.body;

  /* ------------------------------------------------------------ viewport px */
  /* Telegram's web view reports its own height, which is more accurate than
     100vh (it excludes the browser chrome Telegram injects). Kept in sync on
     every viewport_changed event, which also fires for the on-screen keyboard. */
  function applyViewport() {
    if (!wa) return;
    const height = wa.viewportStableHeight || wa.viewportHeight;
    if (height) root.style.setProperty('--tg-viewport-height', height + 'px');
    const insetTop = (wa.contentSafeAreaInset && wa.contentSafeAreaInset.top) || 0;
    const insetBottom = (wa.contentSafeAreaInset && wa.contentSafeAreaInset.bottom) || 0;
    root.style.setProperty('--tg-safe-top', insetTop + 'px');
    root.style.setProperty('--tg-safe-bottom', insetBottom + 'px');
  }

  /* --------------------------------------------------------------- theme/chrome */
  function syncChrome() {
    if (!wa) return;
    call(wa.setHeaderColor, CHROME.header);
    call(wa.setBackgroundColor, CHROME.background);
    call(wa.setBottomBarColor, CHROME.bottomBar);
  }

  /* -------------------------------------------------------------- behaviours */
  /* Telegram drives a native back arrow in the header; wire it to the app's own
     hash router so the two histories stay in step. */
  function wireBackButton() {
    const bb = wa && wa.BackButton;
    if (!bb) return;

    let visible = false;

    /* Top-level destinations are hash routes with no id segment, so the native
       back arrow appears only on drill-down pages (#game/x, #platform/x, ...)
       and never while a dialog is open (the dialog has its own close button). */
    const TOP_LEVEL = ['discover', 'games', 'platforms', 'community', 'collections',
      'saved', 'search', 'compare', 'profile'];

    const sync = () => {
      const hash = (location.hash || '#discover').replace(/^#/, '');
      const parts = hash.split('/').filter(Boolean);
      const dialogOpen = !!document.getElementById('modal')?.open;
      const onTopLevel = parts.length === 0 || (parts.length === 1 && TOP_LEVEL.includes(parts[0]));
      const shouldShow = !dialogOpen && !onTopLevel;
      if (shouldShow === visible) return;
      visible = shouldShow;
      call(shouldShow ? bb.show.bind(bb) : bb.hide.bind(bb));
    };

    const onBack = () => {
      if (document.getElementById('modal')?.open) {
        document.querySelector('[data-action="close-modal"]')?.click();
        return;
      }
      if (history.length > 1) history.back();
      else location.hash = '#discover';
    };

    /* Canonical registration on Bot API 6.1+, with a legacy property fallback. */
    if (typeof bb.setParams === 'function') {
      try {
        bb.setParams({ is_visible: false });
        bb.onClick(onBack);
      } catch (err) {
        try { bb.onClick(onBack); } catch (err2) { /* unsupported client */ }
      }
    } else {
      try { bb.onClick(onBack); } catch (err) {
        try { bb.onclick = onBack; } catch (err2) { /* unsupported client */ }
      }
    }

    window.addEventListener('hashchange', sync);
    /* Dialogs open and close from app.js's delegated handler, so re-check on the
       next frame after any click rather than reaching into app.js internals. */
    document.addEventListener('click', () => setTimeout(sync, 0));
    sync();
  }

  /* Vertical swipes on the page would otherwise collapse the Mini App. */
  function wireSwipeGuard() {
    if (!wa || typeof wa.disableVerticalSwipes !== 'function') return;
    call(wa.disableVerticalSwipes);
    try {
      wa.onEvent('fullscreen_changed', () => {
        if (wa.isFullscreen) call(wa.disableVerticalSwipes);
        else call(wa.enableVerticalSwipes);
      });
    } catch (err) { /* optional */ }
  }

  /* Real Telegram sharing for the existing "Good taste travels." panel, instead
     of the demo's copy-to-clipboard fallback. */
  function wireShare() {
    if (!wa || typeof wa.shareURL !== 'function') return;

    document.addEventListener('click', (event) => {
      const button = event.target.closest('[data-action="copy-share"]');
      if (!button) return;
      const field = document.getElementById('share-text');
      if (!field) return;

      event.preventDefault();
      event.stopPropagation();

      const payload = (field.value || '').split('\n')[0].split(' — ')[0].trim();
      const url = location.origin + location.pathname + (location.hash || '#discover');

      call(wa.shareURL, url, payload ? 'DegenBot · ' + payload : 'DegenBot');
      call(wa.HapticFeedback && wa.HapticFeedback.notificationOccurred, 'success');
    }, true); /* capture: run before the demo's own clipboard handler */
  }

  /* ---------------------------------------------------------------- startup */
  applyViewport();
  syncChrome();

  if (body) body.classList.add(wa ? 'tg-app' : 'web-app');
  if (body && wa && wa.colorScheme) body.dataset.tgScheme = wa.colorScheme;

  try {
    document.documentElement.style.setProperty('--tg-viewport-height', (min || window.innerHeight) + 'px');
  } catch (err) { /* ignore */ }

  if (wa) {
    /* Full screen is the client's decision, not the app's. Two calls used to
       make this app fight the BotFather setting:

         requestFullscreen()  - asked for true full screen outright (removed).
         expand()             - grows the web view to the *maximum height the
                                current mode allows*, which fills the half-height
                                window that "Compact" mode is supposed to give.

       Both are gone, so the app now renders inside whatever window Telegram
       opens: half height in Compact, the full height in Fullsize/Fullscreen.
       The layout stays fluid either way - `--tg-viewport-height` below tracks
       the real height and the frame falls back to the browser viewport size. */
    call(wa.ready);

    try {
      wa.onEvent('viewport_changed', applyViewport);
      wa.onEvent('fullscreen_changed', () => { applyViewport(); syncChrome(); });
    } catch (err) { /* ignore */ }

    wireBackButton();
    wireSwipeGuard();
    wireShare();
  }

  /* Handy for manual testing from a desktop browser console. */
  window.DegenBotTelegram = { active: !!wa, webApp: wa || null, version: (wa && wa.version) || null };
})();
