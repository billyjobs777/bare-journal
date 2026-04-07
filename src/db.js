import { supabase } from './supabase'

export async function loadAllEntries() {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('entry_date, data')
    .order('entry_date', { ascending: true })

  if (error) { console.error('Load error:', error); return {}; }

  const entries = {};
  for (const row of data || []) {
    entries[row.entry_date] = row.data;
  }
  return entries;
}

export async function saveEntry(dateStr, data) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('journal_entries')
    .upsert({
      user_id: user.id,
      entry_date: dateStr,
      data: data,
    }, {
      onConflict: 'user_id,entry_date',
    })

  if (error) { console.error('Save error:', error); return false; }
  return true;
}

export async function deleteAllEntries() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('journal_entries')
    .delete()
    .eq('user_id', user.id);

  if (error) { console.error('Delete error:', error); return false; }
  return true;
}
