import { supabase } from './supabase'

// Journey day = 1-based days since intention was created
export function calcJourneyDay(createdAt) {
  const startLocal = new Date(new Date(createdAt).toDateString());
  const todayLocal = new Date(new Date().toDateString());
  return Math.floor((todayLocal - startLocal) / 86400000) + 1;
}

// Week number = 0-indexed (Days 1–7 = week 0, Days 8–14 = week 1, ...)
export function calcWeekNumber(journeyDay) {
  return Math.floor((journeyDay - 1) / 7);
}

export async function loadIntention(journalType) {
  const { data, error } = await supabase
    .from('journal_intentions')
    .select('intention, generated_prompts, created_at')
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
  const { data, error } = await supabase.functions.invoke('generate-prompts', {
    body: { journalType, intention },
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

export function calcStreakFromEntries(entries) {
  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const has = (k) => entries[k]?.ms_am || entries[k]?.ms_pm;
  let d = new Date();
  let current = 0;
  if (has(fmt(d))) { current = 1; d.setDate(d.getDate() - 1); }
  else { d.setDate(d.getDate() - 1); }
  while (has(fmt(d))) { current++; d.setDate(d.getDate() - 1); }
  return current;
}

export async function loadAllEntriesForJournals(journalIds) {
  const results = await Promise.all(journalIds.map(id => loadAllEntries(id)));
  const map = {};
  journalIds.forEach((id, i) => { map[id] = results[i]; });
  return map;
}

export async function loadWeeklyReflection(journalType, weekNumber) {
  const { data, error } = await supabase
    .from('weekly_reflections')
    .select('reflection_text, entries_count, generated_at')
    .eq('journal_type', journalType)
    .eq('week_number', weekNumber)
    .maybeSingle();

  if (error) { console.error('Load weekly reflection error:', error); return null; }
  return data || null;
}

export async function saveWeeklyReflection(journalType, weekNumber, reflectionText, entriesCount) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('weekly_reflections')
    .upsert({
      user_id: user.id,
      journal_type: journalType,
      week_number: weekNumber,
      reflection_text: reflectionText,
      entries_count: entriesCount,
    }, { onConflict: 'user_id,journal_type,week_number' });

  if (error) { console.error('Save weekly reflection error:', error); return false; }
  return true;
}

export async function generateWeeklyReflection(journalType, intention, journeyDay, weekEntries, weeklyPrompt) {
  const { data, error } = await supabase.functions.invoke('generate-weekly-reflection', {
    body: { journalType, intention, journeyDay, weekEntries, weeklyPrompt },
  });

  if (error) { console.error('Generate weekly reflection error:', error); return null; }
  return data;
}

export async function deleteIntention(journalType) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('journal_intentions')
    .delete()
    .eq('user_id', user.id)
    .eq('journal_type', journalType);

  if (error) { console.error('Delete intention error:', error); return false; }
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
