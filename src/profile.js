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

  // Allowed self-edit fields
  const allowed = ['username', 'display_name', 'bio', 'avatar_url',
                   'website_url', 'twitter_url', 'github_url',
                   'marketing_consent'];
  const safe = {};
  for (const k of allowed) if (k in patch) safe[k] = patch[k];

  if ('marketing_consent' in safe) {
    safe.marketing_consent_at = safe.marketing_consent ? new Date().toISOString() : null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(safe)
    .eq('id', user.id)
    .select()
    .single();
  if (error) throw error;
  return data;
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
