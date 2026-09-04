export function isClerkPublishableKeyValid(key: string | undefined): boolean {
  return Boolean(key && key.startsWith("pk_") && !key.includes("your_clerk"));
}
