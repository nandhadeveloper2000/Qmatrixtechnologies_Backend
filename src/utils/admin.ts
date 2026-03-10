export function isMasterAdminEmail(email: string): boolean {
  const raw = process.env.MASTER_GOOGLE_EMAILS || "";
  const set = new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
  return set.has(String(email || "").trim().toLowerCase());
}

/** Optional: only master admins can do high-risk ops like creating/downgrading admins */
export function isMasterAdminUser(reqUser: { email: string; role: string } | undefined) {
  if (!reqUser) return false;
  if (reqUser.role !== "ADMIN") return false;
  return isMasterAdminEmail(reqUser.email);
}