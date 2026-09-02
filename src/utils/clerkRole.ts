export function hasAdminRole(publicMetadata: Record<string, unknown> | undefined): boolean {
  const role = publicMetadata?.role;
  return typeof role === "string" && role.toUpperCase() === "ADMIN";
}
