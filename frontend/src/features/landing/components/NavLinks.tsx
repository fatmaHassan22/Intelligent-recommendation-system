type Props = { links: { href: string; label: string }[] };

export default function NavLinks({ links }: Props) {
  return (
    <nav
      className="hidden items-center gap-6 text-[15px] font-medium text-muted lg:flex"
      aria-label="التنقل الرئيسي"
    >
      {links.map((l) => (
        <a key={l.href} href={l.href} className="hover:text-ink">
          {l.label}
        </a>
      ))}
    </nav>
  );
}
