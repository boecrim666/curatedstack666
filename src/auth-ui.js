/**
 * CuratedStack — Auth/Profile/Submit/Admin UI module
 * Renders modals + navbar chip; wires everything to data layer.
 */
import {
  getState, onAuthChange, signOut,
  signInWithMagicLink, signInWithProvider,
} from './auth.js';
import { getMyProfile, updateMyProfile, uploadAvatar } from './profile.js';
import {
  isBookmarked, toggleBookmark, fetchBookmarkedApps, ensureLoaded as ensureBookmarksLoaded,
} from './bookmarks.js';
import { submitApp, fetchMySubmissions } from './submissions.js';
import {
  fetchSubmissions as adminFetchSubs,
  approveSubmission, rejectSubmission,
} from './admin.js';

// ----------------------------------------------------------------------
// Tiny DOM helpers
// ----------------------------------------------------------------------
const $  = (sel, root = document) => root.querySelector(sel);
const h  = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const esc = (s = '') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function openOverlay(el)  { el.classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeOverlay(el) { el.classList.remove('open'); document.body.style.overflow = ''; }

// ----------------------------------------------------------------------
// SVG icons
// ----------------------------------------------------------------------
const ICON = {
  google:  '<svg class="cs-oauth-icon" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.24 1.06-3.72 1.06-2.86 0-5.29-1.93-6.15-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.85 14.11A6.6 6.6 0 0 1 5.5 12c0-.74.13-1.45.35-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.67-2.84Z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.67 2.84C6.71 7.31 9.14 5.38 12 5.38Z"/></svg>',
  github:  '<svg class="cs-oauth-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.39 1.24-3.23-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.4 11.4 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.92 1.24 3.23 0 4.62-2.81 5.65-5.49 5.95.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 12 .5Z"/></svg>',
  twitter: '<svg class="cs-oauth-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z"/></svg>',
  apple:   '<svg class="cs-oauth-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M16.365 1.43c0 1.14-.42 2.21-1.13 3.04-.79.92-2.06 1.62-3.27 1.52-.14-1.13.42-2.32 1.1-3.05.78-.86 2.13-1.5 3.3-1.51ZM20.5 17.4c-.55 1.27-1.21 2.49-2.21 3.6-1.03 1.16-2.27 2.07-3.94 2.1-1.61.04-2.13-.95-3.97-.95-1.84 0-2.42.92-3.95.99-1.61.07-2.84-1.25-3.88-2.41-2.13-2.45-3.76-6.92-1.57-9.96 1.07-1.5 2.99-2.45 5.06-2.49 1.55-.03 3 1.04 3.97 1.04.96 0 2.7-1.29 4.55-1.1.78.03 2.96.31 4.36 2.36-3.66 1.99-3.06 7.18.58 8.82Z"/></svg>',
  bookmark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
  bookmarkFill: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
};

// ----------------------------------------------------------------------
// Mount once: build & insert all modals into <body>
// ----------------------------------------------------------------------
function mountOverlays() {
  document.body.appendChild(h(`
  <div class="cs-overlay" id="cs-login-overlay">
    <div class="cs-card">
      <button class="cs-close" data-close>✕</button>
      <h2>Sign in to CuratedStack</h2>
      <div class="cs-sub">Magic link to your inbox or one-tap with a provider.</div>

      <form id="cs-magic-form" autocomplete="on">
        <div class="cs-field">
          <label for="cs-email">E-mail</label>
          <input class="cs-input" type="email" id="cs-email" placeholder="you@example.com" required />
        </div>
        <label class="cs-consent">
          <input type="checkbox" id="cs-consent">
          <span>
            <strong>I agree</strong> to receive occasional updates from CuratedStack
            (new picks, product news). You can opt out any time. We never share your e-mail.
          </span>
        </label>
        <button class="cs-btn cs-primary" type="submit">Send magic link</button>
      </form>

      <div class="cs-divider">OR CONTINUE WITH</div>
      <div class="cs-oauth-grid">
        <button class="cs-btn" data-oauth="google">${ICON.google} Google</button>
        <button class="cs-btn" data-oauth="github">${ICON.github} GitHub</button>
        <button class="cs-btn" data-oauth="twitter">${ICON.twitter} X / Twitter</button>
        <button class="cs-btn" data-oauth="apple">${ICON.apple} Apple</button>
      </div>

      <div id="cs-login-msg"></div>
    </div>
  </div>`));

  document.body.appendChild(h(`
  <div class="cs-overlay cs-overlay-wide" id="cs-profile-overlay">
    <div class="cs-card">
      <button class="cs-close" data-close>✕</button>
      <h2>Your profile</h2>
      <div class="cs-sub">Manage your account, saved sites, and submissions.</div>

      <div class="cs-tabs" role="tablist">
        <button class="cs-tab active" data-tab="profile">Profile</button>
        <button class="cs-tab" data-tab="saved">Saved</button>
        <button class="cs-tab" data-tab="submissions">My submissions</button>
      </div>

      <div data-pane="profile">
        <div class="cs-avatar-edit">
          <div id="cs-avatar-slot"></div>
          <div>
            <input type="file" id="cs-avatar-input" accept="image/*" hidden>
            <button class="cs-btn cs-sm" id="cs-avatar-pick">Change avatar</button>
            <div class="cs-sub" style="margin-top:6px;">PNG/JPG, up to 2 MB.</div>
          </div>
        </div>

        <form id="cs-profile-form">
          <div class="cs-field"><label>Display name</label>
            <input class="cs-input" name="display_name" maxlength="60"></div>
          <div class="cs-field"><label>Username (unique handle)</label>
            <input class="cs-input" name="username" maxlength="30" pattern="^[a-z0-9_]+$" placeholder="lowercase, digits, underscores"></div>
          <div class="cs-field"><label>Bio</label>
            <textarea class="cs-textarea" name="bio" maxlength="280"></textarea></div>
          <div class="cs-field"><label>Website URL</label>
            <input class="cs-input" name="website_url" type="url" placeholder="https://"></div>
          <div class="cs-field"><label>Twitter / X</label>
            <input class="cs-input" name="twitter_url" type="url" placeholder="https://x.com/handle"></div>
          <div class="cs-field"><label>GitHub</label>
            <input class="cs-input" name="github_url" type="url" placeholder="https://github.com/handle"></div>
          <label class="cs-consent">
            <input type="checkbox" name="marketing_consent">
            <span><strong>Marketing e-mails</strong> — occasional updates from CuratedStack.</span>
          </label>
          <button class="cs-btn cs-primary" type="submit" style="margin-top:14px;">Save changes</button>
          <div id="cs-profile-msg"></div>
        </form>
      </div>

      <div data-pane="saved" hidden>
        <div id="cs-saved-list" class="cs-sub-list"></div>
      </div>

      <div data-pane="submissions" hidden>
        <button class="cs-btn cs-primary cs-sm" id="cs-open-submit" style="margin-bottom:10px;">+ Submit a new app</button>
        <div id="cs-mysubs-list" class="cs-sub-list"></div>
      </div>
    </div>
  </div>`));

  document.body.appendChild(h(`
  <div class="cs-overlay" id="cs-submit-overlay">
    <div class="cs-card">
      <button class="cs-close" data-close>✕</button>
      <h2>Submit a site</h2>
      <div class="cs-sub">It will be reviewed by an admin before going live.</div>

      <form id="cs-submit-form">
        <div class="cs-field"><label>Name *</label><input class="cs-input" name="name" required maxlength="80"></div>
        <div class="cs-field"><label>URL *</label><input class="cs-input" name="url" type="url" placeholder="https://" required></div>
        <div class="cs-field"><label>Short description</label><textarea class="cs-textarea" name="description" maxlength="500"></textarea></div>
        <div class="cs-field"><label>Category</label><input class="cs-input" name="category" placeholder="e.g. Design, AI, Dev tools"></div>
        <div class="cs-field"><label>Tags (comma-separated)</label><input class="cs-input" name="tags" placeholder="ai, productivity"></div>
        <div class="cs-field"><label>Logo URL</label><input class="cs-input" name="logo_url" type="url" placeholder="https://"></div>
        <div class="cs-field"><label>Screenshot URL</label><input class="cs-input" name="screenshot_url" type="url" placeholder="https://"></div>
        <button class="cs-btn cs-primary" type="submit">Submit for review</button>
        <div id="cs-submit-msg"></div>
      </form>
    </div>
  </div>`));

  document.body.appendChild(h(`
  <div class="cs-overlay cs-overlay-wide" id="cs-admin-overlay">
    <div class="cs-card">
      <button class="cs-close" data-close>✕</button>
      <h2>Admin · Submissions</h2>
      <div class="cs-sub">Approve or reject pending entries. Approved ones are added to <code>apps</code> immediately.</div>
      <div class="cs-tabs">
        <button class="cs-tab active" data-status="pending">Pending</button>
        <button class="cs-tab" data-status="approved">Approved</button>
        <button class="cs-tab" data-status="rejected">Rejected</button>
      </div>
      <div id="cs-admin-list" class="cs-sub-list"></div>
    </div>
  </div>`));

  // Close handlers
  document.querySelectorAll('.cs-overlay').forEach(ov => {
    ov.addEventListener('click', e => {
      if (e.target === ov || e.target.dataset.close !== undefined) closeOverlay(ov);
    });
  });
}

// ----------------------------------------------------------------------
// Navbar chip
// ----------------------------------------------------------------------
function avatarHTML(profile, user, big = false) {
  const cls = big ? 'cs-avatar-lg' : 'cs-avatar';
  const fbCls = big ? 'cs-avatar-fallback-lg' : 'cs-avatar-fallback';
  const url = profile?.avatar_url || user?.user_metadata?.avatar_url;
  if (url) return `<img class="${cls}" src="${esc(url)}" alt="">`;
  const seed = (profile?.display_name || user?.email || '?').trim()[0]?.toUpperCase() || '?';
  return `<div class="${fbCls}">${esc(seed)}</div>`;
}

function renderChip() {
  const wrap = $('#cs-auth-wrap');
  if (!wrap) return;
  const { isLoggedIn, user, profile, isAdmin } = getState();

  if (!isLoggedIn) {
    wrap.innerHTML = `<button class="cs-auth-chip" id="cs-signin-btn">Sign in</button>`;
    $('#cs-signin-btn').addEventListener('click', () => openOverlay($('#cs-login-overlay')));
    return;
  }

  const label = profile?.display_name || (user.email || '').split('@')[0];
  wrap.innerHTML = `
    <button class="cs-auth-chip" id="cs-chip-btn">
      ${avatarHTML(profile, user)}
      <span>${esc(label)}</span>
    </button>
    <div class="cs-menu" id="cs-menu">
      <div class="cs-menu-head">${esc(user.email || '')}</div>
      <button data-act="profile">Profile & saved</button>
      <button data-act="submit">+ Submit a site</button>
      ${isAdmin ? `<hr><button data-act="admin">Admin panel</button>` : ''}
      <hr>
      <button data-act="signout">Sign out</button>
    </div>`;

  const menu = $('#cs-menu');
  $('#cs-chip-btn').addEventListener('click', e => { e.stopPropagation(); menu.classList.toggle('open'); });
  document.addEventListener('click', () => menu.classList.remove('open'), { once: true });
  menu.addEventListener('click', e => {
    const act = e.target?.dataset?.act; if (!act) return;
    menu.classList.remove('open');
    if (act === 'profile') openProfile();
    if (act === 'submit')  openOverlay($('#cs-submit-overlay'));
    if (act === 'admin')   openAdmin();
    if (act === 'signout') signOut();
  });
}

// ----------------------------------------------------------------------
// Login modal logic
// ----------------------------------------------------------------------
function bindLoginModal() {
  const ov = $('#cs-login-overlay');
  const msg = $('#cs-login-msg');

  $('#cs-magic-form').addEventListener('submit', async e => {
    e.preventDefault();
    msg.innerHTML = '';
    const email   = $('#cs-email').value;
    const consent = $('#cs-consent').checked;
    try {
      await signInWithMagicLink(email, consent);
      msg.innerHTML = `<div class="cs-msg cs-ok">Check your inbox — magic link sent to <strong>${esc(email)}</strong>.</div>`;
    } catch (err) {
      msg.innerHTML = `<div class="cs-msg cs-err">${esc(err.message)}</div>`;
    }
  });

  ov.querySelectorAll('[data-oauth]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const consent = $('#cs-consent').checked;
      try { await signInWithProvider(btn.dataset.oauth, consent); }
      catch (err) {
        msg.innerHTML = `<div class="cs-msg cs-err">${esc(err.message)} — provider may not be enabled in Supabase yet.</div>`;
      }
    });
  });

  // Auto-close on successful sign-in
  onAuthChange(({ isLoggedIn }) => {
    if (isLoggedIn && ov.classList.contains('open')) closeOverlay(ov);
  });
}

// ----------------------------------------------------------------------
// Profile modal logic
// ----------------------------------------------------------------------
async function openProfile() {
  const ov = $('#cs-profile-overlay');
  openOverlay(ov);
  await renderProfilePane();
  // Switch tabs
  ov.querySelectorAll('.cs-tab').forEach(tab => {
    tab.onclick = () => {
      ov.querySelectorAll('.cs-tab').forEach(t => t.classList.toggle('active', t === tab));
      ov.querySelectorAll('[data-pane]').forEach(p => p.hidden = p.dataset.pane !== tab.dataset.tab);
      if (tab.dataset.tab === 'saved')       renderSavedPane();
      if (tab.dataset.tab === 'submissions') renderSubmissionsPane();
    };
  });
  $('#cs-open-submit').onclick = () => openOverlay($('#cs-submit-overlay'));
}

async function renderProfilePane() {
  const { user, profile } = getState();
  if (!user) return;

  $('#cs-avatar-slot').innerHTML = avatarHTML(profile, user, true);
  const form = $('#cs-profile-form');
  ['display_name','username','bio','website_url','twitter_url','github_url']
    .forEach(k => form.elements[k].value = profile?.[k] ?? '');
  form.elements.marketing_consent.checked = !!profile?.marketing_consent;

  $('#cs-avatar-pick').onclick = () => $('#cs-avatar-input').click();
  $('#cs-avatar-input').onchange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadAvatar(file);
      const fresh = await getMyProfile();
      $('#cs-avatar-slot').innerHTML = avatarHTML(fresh, user, true);
      renderChip();
      flash('#cs-profile-msg', 'Avatar updated.', 'ok');
    } catch (err) { flash('#cs-profile-msg', err.message, 'err'); }
  };

  form.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const patch = {
      display_name: fd.get('display_name')?.trim() || null,
      username:     fd.get('username')?.trim() || null,
      bio:          fd.get('bio')?.trim() || null,
      website_url:  fd.get('website_url')?.trim() || null,
      twitter_url:  fd.get('twitter_url')?.trim() || null,
      github_url:   fd.get('github_url')?.trim() || null,
      marketing_consent: !!fd.get('marketing_consent'),
    };
    try {
      await updateMyProfile(patch);
      flash('#cs-profile-msg', 'Saved.', 'ok');
      renderChip();
    } catch (err) {
      const m = /duplicate key.*username/i.test(err.message) ? 'Username already taken.' : err.message;
      flash('#cs-profile-msg', m, 'err');
    }
  };
}

async function renderSavedPane() {
  const list = $('#cs-saved-list');
  list.innerHTML = `<div class="cs-msg cs-info">Loading…</div>`;
  try {
    const apps = await fetchBookmarkedApps();
    if (!apps.length) { list.innerHTML = `<div class="cs-msg cs-info">No saved sites yet — tap the bookmark icon on any card.</div>`; return; }
    list.innerHTML = apps.map(a => `
      <div class="cs-sub-card">
        <img class="cs-sub-logo" src="${esc(a.logo_url || '')}" alt="" onerror="this.style.visibility='hidden'">
        <div>
          <div><strong>${esc(a.name)}</strong></div>
          <div class="cs-sub-meta">${esc(a.category || '')} · <a href="${esc(a.url)}" target="_blank" rel="noopener">Visit</a></div>
        </div>
        <div class="cs-sub-actions">
          <button class="cs-btn cs-sm cs-danger" data-unsave="${esc(a.id)}">Remove</button>
        </div>
      </div>`).join('');
    list.querySelectorAll('[data-unsave]').forEach(b => b.onclick = async () => {
      await toggleBookmark(b.dataset.unsave);
      renderSavedPane();
      window.dispatchEvent(new CustomEvent('cs:bookmarks-changed'));
    });
  } catch (err) { list.innerHTML = `<div class="cs-msg cs-err">${esc(err.message)}</div>`; }
}

async function renderSubmissionsPane() {
  const list = $('#cs-mysubs-list');
  list.innerHTML = `<div class="cs-msg cs-info">Loading…</div>`;
  try {
    const subs = await fetchMySubmissions();
    if (!subs.length) { list.innerHTML = `<div class="cs-msg cs-info">No submissions yet.</div>`; return; }
    list.innerHTML = subs.map(s => `
      <div class="cs-sub-card">
        <img class="cs-sub-logo" src="${esc(s.logo_url || '')}" alt="" onerror="this.style.visibility='hidden'">
        <div>
          <div><strong>${esc(s.name)}</strong> <span class="cs-status-pill cs-status-${s.status}">${s.status}</span></div>
          <div class="cs-sub-meta">${esc(s.url)}</div>
          ${s.admin_note ? `<div class="cs-msg cs-info" style="margin-top:6px;">Admin note: ${esc(s.admin_note)}</div>` : ''}
        </div>
        <div></div>
      </div>`).join('');
  } catch (err) { list.innerHTML = `<div class="cs-msg cs-err">${esc(err.message)}</div>`; }
}

// ----------------------------------------------------------------------
// Submit form
// ----------------------------------------------------------------------
function bindSubmitForm() {
  const ov = $('#cs-submit-overlay');
  $('#cs-submit-form').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await submitApp(Object.fromEntries(fd.entries()));
      flash('#cs-submit-msg', 'Submitted! We will review it shortly.', 'ok');
      e.target.reset();
      setTimeout(() => closeOverlay(ov), 1200);
    } catch (err) {
      const m = err.message === 'SIGN_IN_REQUIRED' ? 'Please sign in first.' : err.message;
      flash('#cs-submit-msg', m, 'err');
    }
  };
}

// ----------------------------------------------------------------------
// Admin panel
// ----------------------------------------------------------------------
async function openAdmin() {
  const ov = $('#cs-admin-overlay');
  openOverlay(ov);
  ov.querySelectorAll('.cs-tab').forEach(t => {
    t.onclick = () => {
      ov.querySelectorAll('.cs-tab').forEach(x => x.classList.toggle('active', x === t));
      renderAdminList(t.dataset.status);
    };
  });
  await renderAdminList('pending');
}

async function renderAdminList(status) {
  const list = $('#cs-admin-list');
  list.innerHTML = `<div class="cs-msg cs-info">Loading…</div>`;
  try {
    const subs = await adminFetchSubs(status);
    if (!subs.length) { list.innerHTML = `<div class="cs-msg cs-info">Nothing here.</div>`; return; }
    list.innerHTML = subs.map(s => `
      <div class="cs-sub-card" data-id="${esc(s.id)}">
        <img class="cs-sub-logo" src="${esc(s.logo_url || '')}" alt="" onerror="this.style.visibility='hidden'">
        <div>
          <div><strong>${esc(s.name)}</strong> <span class="cs-status-pill cs-status-${s.status}">${s.status}</span></div>
          <div class="cs-sub-meta"><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url)}</a></div>
          ${s.description ? `<div style="margin-top:6px;font-size:12.5px;color:var(--text-muted);">${esc(s.description)}</div>` : ''}
          <div class="cs-sub-meta">By ${esc(s.profiles?.display_name || s.profiles?.username || 'user')} · ${new Date(s.created_at).toLocaleString()}</div>
          ${s.admin_note ? `<div class="cs-msg cs-info" style="margin-top:6px;">${esc(s.admin_note)}</div>` : ''}
        </div>
        <div class="cs-sub-actions">
          ${s.status === 'pending' ? `
            <button class="cs-btn cs-sm cs-primary" data-act="approve">Approve</button>
            <button class="cs-btn cs-sm cs-danger"  data-act="reject">Reject</button>` : ''}
        </div>
      </div>`).join('');
    list.querySelectorAll('[data-act]').forEach(btn => {
      btn.onclick = async () => {
        const card = btn.closest('.cs-sub-card');
        const id   = card.dataset.id;
        const note = prompt(btn.dataset.act === 'approve'
          ? 'Optional note (visible to submitter):'
          : 'Reason for rejection (visible to submitter):') || null;
        btn.disabled = true;
        try {
          if (btn.dataset.act === 'approve') await approveSubmission(id, note);
          else                                await rejectSubmission(id, note);
          renderAdminList(status);
        } catch (err) { alert(err.message); btn.disabled = false; }
      };
    });
  } catch (err) { list.innerHTML = `<div class="cs-msg cs-err">${esc(err.message)}</div>`; }
}

// ----------------------------------------------------------------------
// Bookmark buttons on app cards (delegated)
// ----------------------------------------------------------------------
async function decorateBookmarkButtons() {
  await ensureBookmarksLoaded();
  // Decorate any app card variant that exposes the app id via data-id
  // (.app-card, .list-row, .kanban-card, .timeline-card, .lb-row…)
  const cards = document.querySelectorAll(
    '.app-card[data-id], .list-row[data-id], .kanban-card[data-id], .timeline-card[data-id], .lb-row[data-id]'
  );
  cards.forEach(card => {
    if (card.querySelector('.cs-bookmark-btn')) return;
    const id = card.dataset.id;
    if (!id) return;
    const btn = h(`<button class="cs-bookmark-btn ${isBookmarked(id) ? 'active' : ''}"
                            title="Save for later" aria-label="Bookmark">
                     ${isBookmarked(id) ? ICON.bookmarkFill : ICON.bookmark}
                   </button>`);
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const { isLoggedIn } = getState();
      if (!isLoggedIn) { openOverlay($('#cs-login-overlay')); return; }
      try {
        const nowOn = await toggleBookmark(id);
        btn.classList.toggle('active', nowOn);
        btn.innerHTML = nowOn ? ICON.bookmarkFill : ICON.bookmark;
      } catch (err) { console.warn(err); }
    });
    if (getComputedStyle(card).position === 'static') card.style.position = 'relative';
    card.appendChild(btn);
  });
}

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------
function flash(sel, msg, kind) {
  const el = $(sel);
  if (!el) return;
  el.innerHTML = `<div class="cs-msg cs-${kind}">${esc(msg)}</div>`;
  if (kind === 'ok') setTimeout(() => { el.innerHTML = ''; }, 3000);
}

// ----------------------------------------------------------------------
// Init
// ----------------------------------------------------------------------
function init() {
  mountOverlays();
  bindLoginModal();
  bindSubmitForm();
  renderChip();
  onAuthChange(renderChip);

  // Re-decorate cards when app list re-renders (index.html dispatches this)
  const obs = new MutationObserver(() => decorateBookmarkButtons());
  obs.observe(document.body, { childList: true, subtree: true });
  decorateBookmarkButtons();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Expose for debugging
window.CSAuthUI = { openLogin: () => openOverlay($('#cs-login-overlay')),
                    openProfile, openAdmin };
