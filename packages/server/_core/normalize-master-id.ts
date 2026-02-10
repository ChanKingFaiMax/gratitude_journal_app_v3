/**
 * Normalize master IDs returned by AI to standard IDs used throughout the app.
 * 
 * Standard IDs: jesus, plato, laozi, buddha
 * 
 * AI sometimes returns alternative IDs in various formats:
 * - Underscore: lao_tzu, the_awakened_one, messenger_of_love
 * - Hyphen: lao-tzu, the-awakened-one, messenger-of-love
 * - CamelCase: laoTzu, theAwakenedOne
 * - Other names: socrates, christ, siddhartha
 * 
 * This function normalizes all variants to the 4 standard IDs.
 */

const MASTER_ID_MAP: Record<string, string> = {
  // Standard IDs (pass through)
  jesus: 'jesus',
  plato: 'plato',
  laozi: 'laozi',
  buddha: 'buddha',

  // Laozi variants
  lao_tzu: 'laozi',
  laozu: 'laozi',
  lao_zi: 'laozi',
  laotzu: 'laozi',
  lao_tze: 'laozi',
  old_master: 'laozi',

  // Buddha variants
  the_awakened_one: 'buddha',
  awakened_one: 'buddha',
  siddhartha: 'buddha',
  shakyamuni: 'buddha',
  gautama: 'buddha',

  // Jesus variants
  messenger_of_love: 'jesus',
  love_messenger: 'jesus',
  christ: 'jesus',
  jesus_christ: 'jesus',

  // Plato variants
  socrates: 'plato',
};

/**
 * Normalize a single master ID to standard format.
 * First converts hyphens/spaces to underscores and lowercases,
 * then looks up in the mapping table.
 * Returns the normalized ID, or the original (cleaned) if no mapping exists.
 */
export function normalizeMasterId(id: string): string {
  // Normalize separators: hyphens and spaces → underscores, then lowercase
  const cleaned = id.toLowerCase().trim().replace(/[-\s]+/g, '_');
  return MASTER_ID_MAP[cleaned] || cleaned;
}

/**
 * Normalize master IDs in an array of master objects.
 * Works with any object that has an `id` field.
 */
export function normalizeMasterIds<T extends { id: string }>(masters: T[]): T[] {
  return masters.map(master => ({
    ...master,
    id: normalizeMasterId(master.id),
  }));
}
