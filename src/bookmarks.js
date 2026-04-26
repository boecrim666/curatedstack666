/**
 * CuratedStack — Bookmarks data layer
 */
import { supabase, getState, onAuthChange } from './auth.js';

let cache = new Set();
let loaded = false;

async function load() {
  const { user } = getState();
  cache = new Set();
  loaded = false;
  if (!user) { loaded = true; return; }
  const { data, error } = await supabase
    .from('bookmarks')
    .select('app_id')
    .eq('user_id', user.id);
  if (!error && data) cache = new Set(data.map(r => r.app_id));
  loaded = true;
}

onAuthChange(load);

export function isBookmarked(appId) { return cache.has(appId); }
export function bookmarkedIds()     { return Array.from(cache); }
export async function ensureLoaded(){ if (!loaded) await load(); }

export async function toggleBookmark(appId) {
  const { user } = getState();
  if (!user) throw new Error('SIGN_IN_REQUIRED');
  if (cache.has(appId)) {
    cache.delete(appId);
    const { error } = await supabase
      .from('bookmarks').delete()
      .eq('user_id', user.id).eq('app_id', appId);
    if (error) { cache.add(appId); throw error; }
    return false;
  } else {
    cache.add(appId);
    const { error } = await supabase
      .from('bookmarks')
      .insert({ user_id: user.id, app_id: appId });
    if (error && error.code !== '23505') { // ignore duplicate
      cache.delete(appId); throw error;
    }
    return true;
  }
}

export async function fetchBookmarkedApps() {
  const { user } = getState();
  if (!user) return [];
  const { data, error } = await supabase
    .from('bookmarks')
    .select('app_id, created_at, apps(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(r => ({ ...r.apps, _bookmarked_at: r.created_at }));
}
