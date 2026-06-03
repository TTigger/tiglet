import type { Tool } from '../data/tools';

export function filterTools(tools: Tool[], query: string): Tool[] {
  const q = query.trim().toLowerCase();
  if (!q) return tools;
  return tools.filter((t) => {
    const haystack = [t.title, t.description, t.category, ...(t.keywords ?? [])]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}
