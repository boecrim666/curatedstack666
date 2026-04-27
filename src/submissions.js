/**
 * CuratedStack — App submissions
 */
import { supabase, getState } from './auth.js';

export async function submitApp(payload) {
  const { user } = getState();
  if (!user) throw new Error('SIGN_IN_REQUIRED');

  // Verify session is still alive (see updateMyProfile for the same pattern)
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Your session has expired. Please sign in again.');

  const row = {
    submitter_id:   user.id,
    name:           (payload.name || '').trim(),
    url:            (payload.url  || '').trim(),
    description:    (payload.description || '').trim() || null,
    category:       (payload.category || '').trim() || null,
    tags:           Array.isArray(payload.tags) ? payload.tags
                    : (payload.tags || '').split(',').map(s => s.trim()).filter(Boolean),
    logo_url:       (payload.logo_url || '').trim() || null,
    screenshot_url: (payload.screenshot_url || '').trim() || null,
  };

  if (!row.name) throw new Error('Name is required');
  if (!row.url || !/^https?:\/\//i.test(row.url)) throw new Error('Valid URL required');

  const { data, error } = await supabase
    .from('app_submissions')
    .insert(row)
    .select().single();
  if (error) throw error;
  return data;
}

export async function fetchMySubmissions() {
  const { user } = getState();
  if (!user) return [];
  const { data, error } = await supabase
    .from('app_submissions')
    .select('*')
    .eq('submitter_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
