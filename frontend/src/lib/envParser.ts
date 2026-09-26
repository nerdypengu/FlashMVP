/** Parses dotenv-style text into KEY/VALUE pairs (comments, `export`, quotes supported). */
export type EnvPair = { key: string; value: string }

export function parseEnv(text: string): { pairs: EnvPair[]; invalid: number } {
  const pairs = new Map<string, string>()
  let invalid = 0
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line)
    if (!match) { invalid += 1; continue }
    let value = match[2].trim()
    const quoted = /^(['"])([\s\S]*)\1$/.exec(value)
    if (quoted) value = quoted[2]
    else value = value.replace(/\s+#.*$/, '')
    if (!value) { invalid += 1; continue }
    pairs.set(match[1].toUpperCase(), value)
  }
  return { pairs: [...pairs].map(([key, value]) => ({ key, value })), invalid }
}
