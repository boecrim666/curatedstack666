/**
 * CuratedStack — Admin data layer
 */
import { supabase, getState } from './auth.js';

function assertAdmin() {
  const { isAdmin } = getState();
  if (!isAdmin) throw new Error('ADMIN_REQUIRED');
}

export async function fetchSubmissions(status = 'pending') {
  assertAdmin();
  let q = supabase
    .from('app_submissions')
    .select('*, profiles:submitter_id(display_name, username, avatar_url)')
    .order('created_at', { ascending: false });
  if (status && status !== 'all') q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function approveSubmission(id, note) {
  assertAdmin();
  const { data, error } = await supabase.rpc('approve_submission', {
    p_submission_id: id,
    p_admin_note:    note ?? null,
  });
  if (error) throw error;
  return data; // new app id
}

export async function rejectSubmission(id, note) {
  assertAdmin();
  const { error } = await supabase.rpc('reject_submission', {
    p_submission_id: id,
    p_admin_note:    note ?? null,
  });
  if (error) throw error;
}
