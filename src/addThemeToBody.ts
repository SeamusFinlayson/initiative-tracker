export default function addThemeToBody(themeMode?: "dark" | "light") {
  if (themeMode === undefined)
    themeMode = new URLSearchParams(document.location.search).get(
      "themeMode",
    ) as "dark" | "light";
  if (themeMode === "dark") document.body.classList.add("dark");
  else document.body.classList.remove("dark");
}
