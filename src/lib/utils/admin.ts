export function isAdmin(email: string | undefined | null): boolean {
  if (!email) return false
  const list = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)
  return list.includes(email)
}
