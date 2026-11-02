import { Logo } from "../Auth";
import Container from "../components/Container";


// المحتوى النصي لهذا القسم، عدّله هنا مباشرة.
const brand = "مسار";

const footer = {
  copy: "© مسار. جميع الحقوق محفوظة.",
  links: [
    { label: "المشكلة والحل", href: "#problem" },
    { label: "كيف يعمل", href: "#how" },
    { label: "المزايا", href: "#features" },
    { label: "الأسئلة الشائعة", href: "#faq" },
  ],
  legal: [{ label: "[الخصوصية]", href: "#" }, { label: "[تواصل معنا]", href: "#" }],
};

export default function Footer() {
  return (
    <footer className="border-t border-line bg-white">
      <Container className="flex flex-wrap items-center justify-between gap-5 py-8 text-sm text-muted">
        <Logo />
        <div className="flex flex-wrap gap-5">
          {footer.links.map((l) => <a key={l.label} href={l.href} className="hover:text-ink">{l.label}</a>)}
        </div>
        <div className="flex flex-wrap gap-5">
          {footer.legal.map((l) => <a key={l.label} href={l.href} className="hover:text-ink">{l.label}</a>)}
        </div>
        <span className="w-full border-t border-line pt-5">{footer.copy}</span>
      </Container>
    </footer>
  );
}
