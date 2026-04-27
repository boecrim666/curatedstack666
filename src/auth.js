// ---------------------------------------------------------------------------
// CuratedStack — Supabase auth helper
//
// Implicit flow magic link.  The flow is:
//   1. user enters email → signInWithOtp() sends magic link
//   2. user clicks link in email → Supabase verifies the token and redirects
//      back to the site with #access_token=...&refresh_token=...&type=magiclink
//   3. supabase-js detects the hash automatically (detectSessionInUrl: true),
//      stores the session in localStorage under sb-<ref>-auth-token,
//      fires onAuthStateChange('SIGNED_IN').
//   4. We then strip the hash from the URL so refreshes do not re-trigger it.
// ---------------------------------------------------------------------------
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL      = 'https://jereytrwxnuwcvzvqhbg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Ja352XgtGhInP4xHMhVB7Q_wuouZohQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken:    true,
    persistSession:      true,
    detectSessionInUrl:  true,
    flowType:            'implicit',
    storage:             window.localStorage,
    storageKey:          'sb-jereytrwxnuwcvzvqhbg-auth-token',
  },
});

// ---------------------------------------------------------------------------
// State + listeners
// ---------------------------------------------------------------------------
const state = {
  session:  null,
  user:     null,
  profile:  null,
  loading:  true,
};
const listeners = new Set();
const emit = () => listeners.forEach(fn => { try { fn(state); } catch(e) { console.error(e); } });

export function getState()       { return state; }
export function isLoggedIn()     { return !!state.user; }
export function isAdmin()        { return state.profile?.role === 'admin'; }
export function onAuthChange(fn) {
  listeners.add(fn);
  // fire immediately with current state so the UI doesn't have to wait
  try { fn(state); } catch(e) { console.error(e); }
  return () => listeners.delete(fn);
}

// ---------------------------------------------------------------------------
// Profile loading
// ---------------------------------------------------------------------------
async function loadProfile(userId) {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) console.warn('[CSAuth] loadProfile error:', error.message);
  return data || null;
}

async function syncFromSession(session, source = '?') {
  state.session = session;
  state.user    = session?.user ?? null;
  state.profile = state.user ? await loadProfile(state.user.id) : null;
  state.loading = false;
  console.log('[CSAuth]', source, '→ user:', state.user?.email || 'null', '| role:', state.profile?.role || 'none');
  emit();
}

// ---------------------------------------------------------------------------
// Bootstrap
//
// supabase-js v2 fires INITIAL_SESSION on its own once it has finished parsing
// the URL hash (or restored a persisted session).  We rely on that exclusively
// instead of also racing with a manual getSession() call — which used to cause
// AbortError when the two ran concurrently.
// ---------------------------------------------------------------------------
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('[CSAuth] onAuthStateChange →', event, '| has session:', !!session);
  await syncFromSession(session, 'onAuthStateChange[' + event + ']');

  // Strip auth params from the URL only after the session is safely persisted
  if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') &&
      (window.location.hash.includes('access_token=') ||
       window.location.search.includes('code='))) {
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
    console.log('[CSAuth] cleaned auth params from URL');
  }
});

// Safety net: in case onAuthStateChange does not fire INITIAL_SESSION quickly
// (rare), fall back to an explicit getSession() after a short delay so the UI
// is never left in a "loading" state.
setTimeout(async () => {
  if (state.loading) {
    const { data: { session } } = await supabase.auth.getSession();
    await syncFromSession(session, 'fallback-getSession');
  }
}, 1500);

// ---------------------------------------------------------------------------
// Sign-in helpers
// ---------------------------------------------------------------------------
const REDIRECT_TO = `${window.location.origin}${window.location.pathname}`;

export async function signInWithMagicLink(email, marketingConsent = false) {
  if (marketingConsent) localStorage.setItem('cs_pending_marketing_consent', '1');
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: REDIRECT_TO, shouldCreateUser: true },
  });
  if (error) throw error;
}

export async function signInWithOAuth(provider) {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: REDIRECT_TO },
  });
  if (error) throw error;
}
// Back-compat alias used elsewhere in the codebase
export const signInWithProvider = signInWithOAuth;

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Pending marketing consent (set during sign-in, applied after profile loads)
// ---------------------------------------------------------------------------
onAuthChange(async ({ user, profile }) => {
  if (!user || !profile) return;
  const pending = localStorage.getItem('cs_pending_marketing_consent');
  if (pending && !profile.marketing_consent) {
    const { error } = await supabase
      .from('profiles')
      .update({
        marketing_consent: true,
        marketing_consent_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    if (!error) localStorage.removeItem('cs_pending_marketing_consent');
  }
});

// Expose a few helpers for debugging from DevTools
if (typeof window !== 'undefined') {
  window.__csAuthDebug = {
    state: () => state,
    storage: () => localStorage.getItem('sb-jereytrwxnuwcvzvqhbg-auth-token'),
    forceRefresh: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await syncFromSession(session, 'manual');
      return session;
    },
  };
}
