/**
 * CuratedStack — Auth module
 * --------------------------------------------------------------
 * Wraps Supabase auth: magic link, OAuth (Google, GitHub, Twitter,
 * Apple), session, and current user/profile/role state.
 *
 * Exposes window.CSAuth for use from index.html.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jereytrwxnuwcvzvqhbg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Ja352XgtGhInP4xHMhVB7Q_wuouZohQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

// ------------------------------------------------------------------
// State
// ------------------------------------------------------------------
const state = {
  session: null,
  user: null,
  profile: null,
  loading: true,
};

const listeners = new Set();
function emit() { for (const l of listeners) l(getState()); }

export function getState() {
  return {
    session:  state.session,
    user:     state.user,
    profile:  state.profile,
    isLoggedIn: !!state.user,
    isAdmin:  state.profile?.role === 'admin',
    loading:  state.loading,
  };
}

export function onAuthChange(fn) {
  listeners.add(fn);
  fn(getState());
  return () => listeners.delete(fn);
}

// ------------------------------------------------------------------
// Bootstrap
// ------------------------------------------------------------------
async function loadProfile(userId) {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) console.warn('loadProfile error:', error.message);
  return data || null;
}

async function refresh() {
  const { data: { session } } = await supabase.auth.getSession();
  state.session = session;
  state.user    = session?.user ?? null;
  state.profile = state.user ? await loadProfile(state.user.id) : null;
  state.loading = false;
  emit();
}

// Kick off initial session load (no top-level await for browser-target build)
refresh();

supabase.auth.onAuthStateChange(async (_event, session) => {
  state.session = session;
  state.user    = session?.user ?? null;
  state.profile = state.user ? await loadProfile(state.user.id) : null;
  state.loading = false;
  emit();
});

// ------------------------------------------------------------------
// Sign in
// ------------------------------------------------------------------
const REDIRECT_TO = `${window.location.origin}${window.location.pathname}`;

/**
 * Send magic link to e-mail.
 * @param {string} email
 * @param {boolean} marketingConsent — store in user_metadata so the
 *   handle_new_user trigger picks it up on first sign-in.
 */
export async function signInWithMagicLink(email, marketingConsent = false) {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: {
      emailRedirectTo: REDIRECT_TO,
      data: { marketing_consent: !!marketingConsent },
    },
  });
  if (error) throw error;
  return { ok: true };
}

const PROVIDER_MAP = {
  google:  'google',
  github:  'github',
  twitter: 'twitter',
  apple:   'apple',
};

export async function signInWithProvider(providerKey, marketingConsent = false) {
  const provider = PROVIDER_MAP[providerKey];
  if (!provider) throw new Error(`Unknown provider: ${providerKey}`);

  // Stash consent in localStorage so we can patch the profile after
  // the OAuth round-trip (user_metadata can't carry custom fields
  // through every provider).
  if (marketingConsent) {
    localStorage.setItem('cs_pending_marketing_consent', '1');
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: REDIRECT_TO },
  });
  if (error) throw error;
}

export async function signOut() {
  await supabase.auth.signOut();
}

// After OAuth redirect, persist the consent the user opted into.
onAuthChange(async ({ user, profile }) => {
  if (!user || !profile) return;
  const pending = localStorage.getItem('cs_pending_marketing_consent');
  if (pending === '1' && !profile.marketing_consent) {
    await supabase.from('profiles').update({
      marketing_consent: true,
      marketing_consent_at: new Date().toISOString(),
    }).eq('id', user.id);
    localStorage.removeItem('cs_pending_marketing_consent');
  }
});

// ------------------------------------------------------------------
// Public helper for index.html
// ------------------------------------------------------------------
window.CSAuth = {
  supabase,
  getState,
  onAuthChange,
  signInWithMagicLink,
  signInWithProvider,
  signOut,
};
