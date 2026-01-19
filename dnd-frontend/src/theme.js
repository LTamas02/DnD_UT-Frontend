export const THEME_KEY = "profileTheme";

export const DEFAULT_THEME = {
  bgImage: "",
  bgGradient: "linear-gradient(130deg, rgba(10,6,4,0.75), rgba(64,36,18,0.85))",
  pageBg: "#2f1e16",
  overlay: "rgba(0,0,0,0.35)",
  cardBg: "#4e342e",
  cardBorder: "#795548",
  accent: "#ffcc80",
  text: "#ffe7c2",
  muted: "#c9a980",
  panelBg: "rgba(255,255,255,0.12)",
  panelText: "#ffe7c2",
  buttonBg: "#795548",
  buttonText: "#fff8e1",
  friendBg: "#5d4037"
};

const normalizeHex = (value) => {
  if (!value) return null;
  const hex = value.trim();
  if (/^#[0-9a-f]{3}$/i.test(hex)) {
    return (
      "#" +
      hex
        .slice(1)
        .split("")
        .map((ch) => ch + ch)
        .join("")
    );
  }
  if (/^#[0-9a-f]{6}$/i.test(hex)) return hex;
  return null;
};

const hexToRgba = (hex, alpha) => {
  const normalized = normalizeHex(hex);
  if (!normalized) return `rgba(0, 0, 0, ${alpha})`;
  const intVal = parseInt(normalized.slice(1), 16);
  const r = (intVal >> 16) & 255;
  const g = (intVal >> 8) & 255;
  const b = intVal & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const applyTheme = (theme) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const merged = { ...DEFAULT_THEME, ...(theme || {}) };

  const accentSoft = hexToRgba(merged.accent, 0.22);
  const borderSoft = hexToRgba(merged.text, 0.12);
  const vars = {
    "--app-bg": merged.pageBg,
    "--app-text": merged.text,
    "--app-muted": merged.muted,
    "--app-accent": merged.accent,
    "--app-accent-soft": accentSoft,
    "--app-panel": merged.panelBg,
    "--app-overlay": merged.overlay,
    "--app-card": merged.cardBg,
    "--app-border": merged.cardBorder,
    "--app-button-bg": merged.buttonBg,
    "--app-button-text": merged.buttonText,
    "--app-nav-start": merged.cardBg,
    "--app-nav-end": merged.friendBg,
    "--app-bg-gradient": merged.bgGradient,
    "--home-bg": merged.pageBg,
    "--home-ink": merged.text,
    "--home-muted": merged.muted,
    "--home-accent": merged.accent,
    "--home-accent-soft": accentSoft,
    "--home-panel": merged.panelBg,
    "--home-border": borderSoft,
    "--profile-bg-gradient": merged.bgGradient,
    "--profile-bg-color": merged.pageBg,
    "--profile-overlay": merged.overlay,
    "--profile-card-bg": merged.cardBg,
    "--profile-card-border": merged.cardBorder,
    "--profile-accent": merged.accent,
    "--profile-text": merged.text,
    "--profile-muted": merged.muted,
    "--profile-panel-bg": merged.panelBg,
    "--profile-panel-text": merged.panelText,
    "--profile-button-bg": merged.buttonBg,
    "--profile-button-text": merged.buttonText,
    "--profile-friend-bg": merged.friendBg
  };

  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  if (merged.bgImage) {
    root.style.setProperty("--app-bg-image", `url("${merged.bgImage}")`);
    root.style.setProperty("--profile-bg-image", `url("${merged.bgImage}")`);
  } else {
    root.style.removeProperty("--app-bg-image");
    root.style.removeProperty("--profile-bg-image");
  }
};
