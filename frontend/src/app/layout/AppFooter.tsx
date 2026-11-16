import { layoutText } from "../../config/strings.ar";

export function AppFooter() {
  return (
    <footer className="flex justify-between gap-2 px-[37px] pt-[15px] pb-[23px] text-[12px] text-fg-muted max-[1100px]:px-[25px] max-[800px]:px-[22px] max-[560px]:flex-col">
      {layoutText.footerBrand}
      <span>{layoutText.footerDisclaimer}</span>
    </footer>
  );
}
