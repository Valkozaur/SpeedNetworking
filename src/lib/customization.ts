import type { CSSProperties } from "react";

export const ROOM_THEMES = [
  {
    id: "emerald",
    label: "Emerald Salon",
    accent: "#059669",
    background:
      "radial-gradient(circle at 20% 15%, rgba(16,185,129,0.20), transparent 32%), linear-gradient(135deg, #f8fafc 0%, #eefdf7 48%, #f8fafc 100%)",
  },
  {
    id: "midnight",
    label: "Midnight Club",
    accent: "#38bdf8",
    background:
      "radial-gradient(circle at 80% 15%, rgba(56,189,248,0.26), transparent 30%), linear-gradient(135deg, #020617 0%, #0f172a 45%, #111827 100%)",
  },
  {
    id: "sunrise",
    label: "Sunrise Mixer",
    accent: "#f97316",
    background:
      "radial-gradient(circle at 18% 18%, rgba(249,115,22,0.20), transparent 31%), linear-gradient(135deg, #fff7ed 0%, #fef3c7 45%, #f8fafc 100%)",
  },
  {
    id: "atelier",
    label: "Atelier Paper",
    accent: "#be123c",
    background:
      "radial-gradient(circle at 85% 12%, rgba(190,18,60,0.16), transparent 28%), linear-gradient(135deg, #fff1f2 0%, #f8fafc 50%, #f1f5f9 100%)",
  },
] as const;

export const ROOM_OVERLAYS = [
  { id: "soft", label: "Soft wash" },
  { id: "clear", label: "Image-led" },
  { id: "dark", label: "Dark veil" },
] as const;

type RoomTheme = {
  themePreset?: string;
  accentColor?: string;
  backgroundImageUrl?: string;
  backgroundOverlay?: string;
};

const themeIds: Set<string> = new Set(ROOM_THEMES.map((theme) => theme.id));
const overlayIds: Set<string> = new Set(ROOM_OVERLAYS.map((overlay) => overlay.id));

export function getThemePreset(value: unknown) {
  return typeof value === "string" && themeIds.has(value)
    ? value
    : ROOM_THEMES[0].id;
}

export function getBackgroundOverlay(value: unknown) {
  return typeof value === "string" && overlayIds.has(value)
    ? value
    : ROOM_OVERLAYS[0].id;
}

export function sanitizeAccentColor(
  value: unknown,
  fallback: string = ROOM_THEMES[0].accent,
) {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim();

  return /^#[0-9a-fA-F]{6}$/.test(normalized) ? normalized : fallback;
}

export function sanitizeBackgroundImageUrl(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  const normalized = value.trim();

  if (!normalized) {
    return "";
  }

  try {
    const url = new URL(normalized);

    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
  } catch {
    return "";
  }

  return "";
}

export function cleanRoomText(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

export function getThemeById(themePreset: string | undefined) {
  return (
    ROOM_THEMES.find((theme) => theme.id === themePreset) ??
    ROOM_THEMES[0]
  );
}

export function roomThemeStyle(room: RoomTheme): CSSProperties {
  const preset = getThemeById(getThemePreset(room.themePreset));
  const accent = sanitizeAccentColor(room.accentColor, preset.accent);
  const backgroundImageUrl = sanitizeBackgroundImageUrl(room.backgroundImageUrl);
  const overlay = getBackgroundOverlay(room.backgroundOverlay);
  const image = backgroundImageUrl
    ? `url("${backgroundImageUrl.replace(/["\\]/g, "")}")`
    : "";
  const imageOverlay =
    overlay === "dark"
      ? "linear-gradient(135deg, rgba(2,6,23,0.74), rgba(15,23,42,0.58))"
      : overlay === "clear"
        ? "linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.08))"
        : "linear-gradient(135deg, rgba(248,250,252,0.88), rgba(255,255,255,0.72))";

  return {
    "--room-accent": accent,
    backgroundColor: "#f8fafc",
    backgroundImage: image ? `${imageOverlay}, ${image}` : preset.background,
    backgroundPosition: "center",
    backgroundSize: "cover",
    backgroundAttachment: "fixed",
  } as CSSProperties;
}
