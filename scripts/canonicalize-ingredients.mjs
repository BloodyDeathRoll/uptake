#!/usr/bin/env node
// One-shot backfill: rewrite Hebrew canonical_name values to stable English
// identifiers in ingredient_nutrition_overrides and portion_priors. Resolves
// merge conflicts by keeping the most-recently-updated row when two rows end
// up with the same canonical key.
//
// Uses a hand-curated translation table keyed on ingredient_name — Groq's
// canonicalizations weren't deterministic enough to trust for this one-shot,
// and the set of existing Hebrew foods is small.
//
// Usage:
//   node --env-file=.env.local scripts/canonicalize-ingredients.mjs           # apply
//   node --env-file=.env.local scripts/canonicalize-ingredients.mjs --dry-run # preview

import { createClient } from '@supabase/supabase-js'

const DRY_RUN = process.argv.includes('--dry-run')

// Hand-curated Hebrew → canonical-English mapping. Keys are matched against
// the trimmed ingredient_name. If a non-ASCII row's ingredient_name isn't in
// this map the script aborts so you can add the missing entry.
const TRANSLATIONS = {
  'חלב סויה': 'soy milk',
  'בננה': 'banana',
  'מוזלי': 'muesli',
  'אפרסק': 'peach',
  'גבינה צהובה': 'yellow cheese',
  'גבינת פטה': 'feta cheese',
  'עגבניה': 'tomato',
  'לחם לבן': 'white bread',
  'מלפפון': 'cucumber',
  'גרנולה': 'granola',
  'אדמאם': 'edamame',
  'סייטן': 'seitan',
  'פיתה': 'pita',
  'טחינה': 'tahini',
  'חומוס': 'hummus',
  'תפוח ירוק': 'green apple',
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const hasNonAscii = (s) => /[^\x00-\x7F]/.test(s)

function translate(name) {
  const key = (name ?? '').trim()
  const translated = TRANSLATIONS[key]
  if (!translated) {
    throw new Error(`No translation for Hebrew ingredient_name "${key}". Add it to TRANSLATIONS in scripts/canonicalize-ingredients.mjs and re-run.`)
  }
  return translated
}

async function processTable({ table, conflictCols, label }) {
  console.log(`\n--- ${label} ---`)
  const { data: rows, error } = await supabase
    .from(table)
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error(`Failed to read ${table}:`, error.message)
    return
  }

  const stale = rows.filter((r) => hasNonAscii(r.canonical_name ?? ''))
  if (stale.length === 0) {
    console.log(`  no non-English canonical_name rows; nothing to do`)
    return
  }
  console.log(`  found ${stale.length} non-English rows (of ${rows.length} total)`)

  // Hand-curated translation by ingredient_name. Throws if any row's name
  // isn't in the TRANSLATIONS map, so we never write a wrong canonical.
  const canonicals = stale.map((r) => translate(r.ingredient_name))

  // Index existing rows by their conflict-target key so we can detect collisions.
  // Rows are already sorted newest-first by updated_at.
  const keyOf = (row, canonical) => conflictCols.map((c) => c === 'canonical_name' ? canonical : row[c]).join('||')
  const winners = new Map()
  for (const row of rows) {
    const k = keyOf(row, row.canonical_name)
    if (!winners.has(k)) winners.set(k, row)
  }

  const updates = []
  const deletes = []

  for (let i = 0; i < stale.length; i++) {
    const row = stale[i]
    const newCanonical = canonicals[i]
    if (newCanonical === row.canonical_name) continue

    const newKey = keyOf(row, newCanonical)
    const collision = winners.get(newKey)

    if (collision && collision.id !== row.id) {
      // Newer row wins. Since `rows` was sorted desc by updated_at and
      // `winners` was populated in that order, the existing entry is the
      // most-recent for that key. If `row` is older, drop `row`.
      const rowDate = new Date(row.updated_at ?? 0).getTime()
      const colDate = new Date(collision.updated_at ?? 0).getTime()
      if (rowDate > colDate) {
        // `row` is newer — keep it, delete collision, then update row.
        deletes.push({ id: collision.id, reason: `replaced by newer ${row.id} → ${newCanonical}` })
        winners.set(newKey, row)
        updates.push({ id: row.id, canonical_name: newCanonical })
      } else {
        deletes.push({ id: row.id, reason: `older duplicate of ${collision.id} → ${newCanonical}` })
      }
    } else {
      winners.set(newKey, { ...row, canonical_name: newCanonical })
      updates.push({ id: row.id, canonical_name: newCanonical })
    }
  }

  console.log(`  plan: ${updates.length} updates, ${deletes.length} deletes`)

  if (DRY_RUN) {
    for (const u of updates.slice(0, 10)) console.log(`    UPDATE ${u.id} canonical_name → ${u.canonical_name}`)
    for (const d of deletes.slice(0, 10)) console.log(`    DELETE ${d.id} (${d.reason})`)
    if (updates.length > 10 || deletes.length > 10) console.log(`    … (truncated)`)
    return
  }

  // Apply deletes first so updates don't trip the unique constraint.
  if (deletes.length > 0) {
    const { error: delErr } = await supabase
      .from(table)
      .delete()
      .in('id', deletes.map((d) => d.id))
    if (delErr) {
      console.error(`  delete failed:`, delErr.message)
      return
    }
    console.log(`  deleted ${deletes.length} rows`)
  }

  for (const u of updates) {
    const { error: updErr } = await supabase
      .from(table)
      .update({ canonical_name: u.canonical_name })
      .eq('id', u.id)
    if (updErr) {
      console.error(`  update ${u.id} failed:`, updErr.message)
    }
  }
  console.log(`  updated ${updates.length} rows`)
}

console.log(DRY_RUN ? 'DRY RUN — no writes will happen' : 'LIVE RUN — applying changes')

await processTable({
  table: 'ingredient_nutrition_overrides',
  conflictCols: ['user_id', 'canonical_name', 'unit'],
  label: 'ingredient_nutrition_overrides',
})

await processTable({
  table: 'portion_priors',
  conflictCols: ['user_id', 'canonical_name'],
  label: 'portion_priors',
})

console.log('\nDone.')
