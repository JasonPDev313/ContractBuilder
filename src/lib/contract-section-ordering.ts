import { ContractType, getBlueprint } from './contract-blueprints'

/**
 * Build canonical order map from blueprint
 */
function buildCanonicalOrderMap(blueprintSections: string[]): Record<string, number> {
  const orderMap: Record<string, number> = {}

  blueprintSections.forEach((section, index) => {
    const normalized = section.toLowerCase().trim()
    orderMap[normalized] = index + 1
  })

  return orderMap
}

/**
 * Normalize section title to lowercase for matching
 */
function normalizeTitle(title: string): string {
  return title.toLowerCase().trim()
}

/**
 * Convert title to Title Case
 */
function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Get canonical order for a section title based on blueprint
 * Returns 999 if no match (appears at end)
 */
function getCanonicalOrder(
  title: string,
  orderMap: Record<string, number>
): number {
  const normalized = normalizeTitle(title)
  return orderMap[normalized] ?? 999
}

/**
 * Deduplicate section titles by appending (2), (3), etc.
 */
function deduplicateTitles(sections: Array<{ title: string; body: string }>) {
  const titleCounts = new Map<string, number>()

  return sections.map((section) => {
    const baseTitle = section.title.trim()
    const count = titleCounts.get(baseTitle) || 0
    titleCounts.set(baseTitle, count + 1)

    if (count > 0) {
      return {
        ...section,
        title: `${baseTitle} (${count + 1})`,
      }
    }

    return section
  })
}

/**
 * Normalize and reorder contract sections based on contract type blueprint
 */
export function normalizeAndOrderSections(
  sections: Array<{ title: string; body: string }>,
  contractType: ContractType
): Array<{ title: string; body: string; order: number }> {
  // Get blueprint for this contract type
  const blueprint = getBlueprint(contractType)
  const orderMap = buildCanonicalOrderMap(blueprint.sections)

  // Step 1: Trim whitespace and title case
  const normalized = sections.map((section) => ({
    title: toTitleCase(section.title.trim()),
    body: section.body.trim(),
  }))

  // Step 2: Deduplicate titles
  const deduplicated = deduplicateTitles(normalized)

  // Step 3: Sort by canonical order from blueprint
  const sorted = [...deduplicated].sort((a, b) => {
    const orderA = getCanonicalOrder(a.title, orderMap)
    const orderB = getCanonicalOrder(b.title, orderMap)
    return orderA - orderB
  })

  // Step 4: Add explicit order field
  return sorted.map((section, index) => ({
    ...section,
    order: index,
  }))
}

/**
 * Merge exhibits into sections (as separate sections at end)
 */
export function mergeExhibits(
  sections: Array<{ title: string; body: string }>,
  exhibits?: Array<{ title: string; body: string }>
): Array<{ title: string; body: string }> {
  if (!exhibits || exhibits.length === 0) {
    return sections
  }

  const exhibitSections = exhibits.map((exhibit, index) => ({
    title: exhibit.title.startsWith('Exhibit')
      ? exhibit.title
      : `Exhibit ${String.fromCharCode(65 + index)}: ${exhibit.title}`,
    body: exhibit.body,
  }))

  return [...sections, ...exhibitSections]
}
