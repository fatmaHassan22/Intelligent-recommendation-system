import Button from "./Button";

// قائمة الجوال: تنزلق بتحريك grid-template-rows، وتُعطَّل عند الإغلاق.
type Props = { open: boolean; links: { href: string; label: string }[]; cta: string; onNavigate: () => void };

export default function MobileMenu({ open, links, cta, onNavigate }: Props) {
  return (
    <div id="mobileNav" onClick={(e) => (e.target as HTMLElement).closest("a") && onNavigate()}
      className={`grid transition-[grid-template-rows] duration-300 lg:hidden ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
      <div className="overflow-hidden" {...(open ? {} : { inert: "" })}>
        <nav className="flex flex-col px-6 pb-5" aria-label="قائمة الجوال">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="flex min-h-[48px] items-center border-t border-line font-medium">{l.label}</a>
          ))}
          <Button href="#cta" className="mt-3 sm:hidden">{cta}</Button>
        </nav>
      </div>
    </div>
  );
}
