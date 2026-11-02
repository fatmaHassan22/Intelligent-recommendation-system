import { useEffect, useState } from "react";
import Container from "../components/Container";
import Button from "../components/Button";
import Icon from "../components/Icon";
import NavLinks from "../components/NavLinks";
import MobileMenu from "../components/MobileMenu";
import { Logo } from "../components/Logo";
import { Link } from "react-router-dom";
import { useAuth } from "../../state";

// المحتوى النصي لهذا القسم، عدّله هنا مباشرة.
const brand = "مسار";

const navLinks = [
  { href: "#problem", label: "المشكلة والحل" },
  { href: "#how", label: "كيف يعمل" },
  { href: "#features", label: "المزايا" },
  { href: "#tour", label: "جولة" },
  { href: "#stories", label: "قصص النجاح" },
  { href: "#faq", label: "الأسئلة الشائعة" },
];

const cta = { label: "ابدأ الآن" };

export default function Header() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const mq = window.matchMedia("(min-width:1024px)");
    const onMq = (e: MediaQueryListEvent) => e.matches && setOpen(false);
    window.addEventListener("keydown", onKey);
    mq.addEventListener("change", onMq);
    return () => { window.removeEventListener("keydown", onKey); mq.removeEventListener("change", onMq); };
  }, []);

  const auth = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
      <Container className="flex min-h-[68px] items-center justify-between gap-4">
        <Logo />
        <NavLinks links={navLinks} />
        <div className="flex items-center gap-2">

          <div className="hidden sm:block ">
            <Link to="/login">
              <Button variant="secondary" className="!min-h-[44px] mx-3">تسجيل الدخول</Button>
            </Link>

            <Link to={auth.user ? '/app' : '/register'}>
              <Button href="#cta" className="!min-h-[44px]">{auth.user ? 'فتح حسابي' : 'ابدأ رحلتك'}</Button>
            </Link>


          </div>

          <button type="button" aria-label="القائمة" aria-expanded={open} aria-controls="mobileNav"
            onClick={() => setOpen((o) => !o)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-line transition-colors hover:bg-surface lg:hidden">
            <Icon name={open ? "x" : "menu"} size={22} />
          </button>

        </div>
      </Container>
      <MobileMenu open={open} links={navLinks} cta={cta.label} onNavigate={() => setOpen(false)} />
    </header>
  );
}
