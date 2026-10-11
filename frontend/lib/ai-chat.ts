/** Minimal Claude conversation format. Never store provider keys or secrets in chat history. */
export type ChatRole = 'user' | 'assistant';
export type ChatMessage = { role: ChatRole; content: string };

/** Reject untrusted history entries rather than casting arbitrary JSON. */
export function parseChatHistory(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];
  const valid: ChatMessage[] = [];
  for (const item of value.slice(-6)) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const m = item as Record<string, unknown>;
    if ((m.role !== 'user' && m.role !== 'assistant') ||
        typeof m.content !== 'string' || m.content.length === 0 ||
        m.content.length > 1200 || /[\u0000-\u001f]/.test(m.content)) continue;
    valid.push({ role: m.role, content: m.content });
  }
  return valid;
}
