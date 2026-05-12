export function getBaseUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";

  return configuredUrl.replace(/\/$/, "");
}

export function absoluteUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${getBaseUrl()}${normalizedPath}`;
}
