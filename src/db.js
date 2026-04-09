import { supabase } from './supabase'

export async function loadIntention(journalType) {
  const { data, error } = await supabase
    .from('journal_intentions')
    .select('intention, generated_prompts')
    .eq('journal_type', journalType)
    .maybeSingle();

  if (error) { console.error('Load intention error:', error); return null; }
  return data || null;
}

export async function saveIntention(journalType, intention, generatedPrompts) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('journal_intentions')
    .upsert({
      user_id: user.id,
      journal_type: journalType,
      intention,
      generated_prompts: generatedPrompts,
    }, {
      onConflict: 'user_id,journal_type',
    });

  if (error) { console.error('Save intention error:', error); return false; }
  return true;
}

export async function generatePrompts(journalType, intention) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data, error } = await supabase.functions.invoke('generate-prompts', {
    body: { journalType, intention },
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (error) { console.error('Generate prompts error:', error); return null; }
  return data;
}

export async function loadAllEntries(journalType = 'wealth') {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('entry_date, data')
    .eq('journal_type', journalType)
    .order('entry_date', { ascending: true })

  if (error) { console.error('Load error:', error); return {}; }

  const entries = {};
  for (const row of data || []) {
    entries[row.entry_date] = row.data;
  }
  return entries;
}

export async function saveEntry(dateStr, data, journalType = 'wealth') {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('journal_entries')
    .upsert({
      user_id: user.id,
      entry_date: dateStr,
      journal_type: journalType,
      data: data,
    }, {
      onConflict: 'user_id,entry_date,journal_type',
    })

  if (error) { console.error('Save error:', error); return false; }
  return true;
}

export async function deleteAllEntries(journalType = 'wealth') {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('journal_entries')
    .delete()
    .eq('user_id', user.id)
    .eq('journal_type', journalType);

  if (error) { console.error('Delete error:', error); return false; }
  return true;
}
