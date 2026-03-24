export const BUILTIN_TAGS = ['旅游', '美食', '演唱会'] as const

export function normalizeTags(input: string[]) {
  const normalized = input
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => tag.slice(0, 20))

  const deduped = Array.from(new Set(normalized))
  return deduped.slice(0, 10)
}

export function serializeTags(tags: string[]) {
  return JSON.stringify(normalizeTags(tags))
}

export function parseTags(value: string | null | undefined) {
  if (!value) {
    return []
  }

  try {
    const parsed = JSON.parse(value) as unknown
    if (!Array.isArray(parsed)) {
      return []
    }

    return normalizeTags(
      parsed.filter((item): item is string => typeof item === 'string'),
    )
  } catch {
    return []
  }
}
