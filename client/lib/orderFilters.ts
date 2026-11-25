// Accept existing single-value links and JSON arrays for multiple selections.
export function parseOrderFilter(value?: string): string[] {
  if (!value || value === "All") return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed))
      return [
        ...new Set(
          parsed.filter(
            (item): item is string => typeof item === "string" && !!item.trim(),
          ),
        ),
      ];
  } catch {
    /* Existing single-value URL. */
  }
  return [value];
}

export function matchesOrderFilter(
  filter: string | undefined,
  value: string,
): boolean {
  const selected = parseOrderFilter(filter);
  return !selected.length || selected.includes(value);
}
