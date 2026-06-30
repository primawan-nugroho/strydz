export type ThemePreference = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "strydz-theme";

export function applyTheme(theme: ThemePreference) {
  if (theme === "system") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }
}

/** Inlined into a blocking <script> in the document head so the correct theme applies
 * before first paint — avoids a flash of the wrong theme on load. */
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var t = localStorage.getItem("${THEME_STORAGE_KEY}");
    if (t === "light" || t === "dark") {
      document.documentElement.setAttribute("data-theme", t);
    }
  } catch (e) {}
})();
`;
