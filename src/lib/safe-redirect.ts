// Sanitises an OAuth `next` redirect target so it can only ever resolve to a
// path on our OWN origin. The value is appended to `origin` by the auth
// callback (`${origin}${next}`); without this guard a crafted `next` such as
// "@evil.com" injects an attacker-controlled host into the URL authority and
// turns the callback into an open redirect (audit 2026-09-11; same guard as wtw).
//
// Returns a path that is always safe to concatenate after `origin`. Anything
// that is not a plain, single-slash, same-origin absolute path collapses to
// the fallback.
export function safeNextPath(next: string | null | undefined, fallback = '/dashboard'): string {
  if (!next) return fallback
  if (/[\x00-\x1F\x7F]/.test(next)) return fallback // URL parsers strip tab/CR/LF: "/\t/evil.com" → "//evil.com"
  if (next[0] !== '/') return fallback            // "@evil.com", "https://evil.com"
  if (next[1] === '/' || next[1] === '\\') return fallback   // "//evil.com", "/\evil.com"
  if (next.includes('\\')) return fallback       // any backslash is a normalisation hazard
  return next
}
