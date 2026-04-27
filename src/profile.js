/**
 * CuratedStack — Profile data layer
 */
import { supabase, getState } from './auth.js';

export async function getMyProfile() {
  const { user } = getState();
  if (!user) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateMyProfile(patch) {
  const { user } = getState();
  if (!user) throw new Error('Not signed in');

  // Verify the auth session is still alive before attempting an UPDATE.
  // Without an active session, RLS silently drops the update and PostgREST
  // returns 200 OK with zero rows (no error), making the failure invisible.
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Your session has expired. Please sign in again.');
  }

  // Allowed self-edit fields
  const allowed = ['username', 'display_name', 'bio', 'avatar_url',
                   'website_url', 'twitter_url', 'github_url',
                   'marketing_consent'];
  const safe = {};
  for (const k of allowed) if (k in patch) safe[k] = patch[k];

  if ('marketing_consent' in safe) {
    safe.marketing_consent_at = safe.marketing_consent ? new Date().toISOString() : null;
  }

  console.log('[CSAuth] updateMyProfile patch:', safe, 'for user', user.id);

  const { data, error } = await supabase
    .from('profiles')
    .update(safe)
    .eq('id', user.id)
    .select();   // returns array, not single — lets us detect 0-row updates
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error('Profile update affected no rows. Check that you are signed in (RLS may be blocking).');
  }
  return data[0];
}

/**
 * Upload an avatar image to the `avatars` bucket and return public URL.
 * Stored under path `<userId>/<timestamp>-<filename>` so RLS can enforce
 * "user can only write into their own folder".
 */
export async function uploadAvatar(file) {
  const { user } = getState();
  if (!user) throw new Error('Not signed in');
  if (!file) throw new Error('No file');
  if (!/^image\//.test(file.type)) throw new Error('Avatar must be an image');
  if (file.size > 2 * 1024 * 1024) throw new Error('Max 2 MB');

  const ext  = (file.name.split('.').pop() || 'png').toLowerCase();
  const path = `${user.id}/${Date.now()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type });
  if (upErr) throw upErr;

  const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
  await updateMyProfile({ avatar_url: pub.publicUrl });
  return pub.publicUrl;
}
