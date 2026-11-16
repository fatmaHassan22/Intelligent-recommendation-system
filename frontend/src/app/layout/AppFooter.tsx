import { layoutText } from "../../config/strings.ar";

export function AppFooter() {
  return (
    <footer className="app-footer">
      {layoutText.footerBrand}
      <span>{layoutText.footerDisclaimer}</span>
    </footer>
  );
}
