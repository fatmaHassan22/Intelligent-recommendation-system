import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Compass } from "lucide-react";
import { Logo } from "../../shared/ui";

const points = ["توصيات مساقات مشروحة", "تقويم ومهام في مكان واحد", "مساعد ذكي يرافقك"];

export function AuthFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-white text-ink lg:grid-cols-[minmax(380px,42%)_1fr]">
      <aside className="relative flex flex-col justify-between gap-3 overflow-hidden bg-ink p-6 text-white lg:gap-8 lg:p-12">
        {/* خلفية متحركة */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -end-16 -top-24 size-[340px] animate-drift rounded-full bg-accent opacity-40 blur-[70px]"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -start-20 size-[300px] animate-drift-rev rounded-full bg-[#2f6fa8] opacity-40 blur-[70px]"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(circle_at_50%_45%,#000,transparent_75%)]"
        />

        <div className="relative z-10">
          <Logo light />
        </div>

        <div className="relative z-10">
          <span className="inline-flex animate-rise items-center gap-2.5 text-sm font-semibold text-accent-mint">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent-mint opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-accent-mint" />
            </span>
            رحلتك الأكاديمية، بوضوح
          </span>

          <h2 className="mb-4 mt-4 text-[clamp(24px,3.4vw,46px)] font-bold leading-[1.35]">
            <span className="block animate-rise [animation-delay:.2s]">
              كل خطوة صغيرة
            </span>
            <span className="block animate-rise text-accent-mint [animation-delay:.35s]">
              تصنع فرقًا.
            </span>
          </h2>

          <p className="mb-5 max-w-[420px] animate-rise leading-loose text-white/75 [animation-delay:.5s] max-lg:hidden">
            ابدأ بخطتك الحالية، احتفظ بإنجازك، وتابع تقدمك بثقة ووعي بالبيانات المتاحة.
          </p>

          <ul className="mb-7 grid gap-3 max-lg:hidden">
            {points.map((p, i) => (
              <li
                key={p}
                style={{ animationDelay: `${0.7 + i * 0.12}s` }}
                className="flex animate-rise items-center gap-2.5 text-[15px] text-white/90"
              >
                <Check
                  size={24}
                  className="flex-none rounded-full bg-accent-mint/15 p-1.5 text-accent-mint"
                />
                {p}
              </li>
            ))}
          </ul>

          <div
            aria-hidden="true"
            className="relative grid size-[150px] animate-[rise_.9s_ease-out_1s_both,float_6s_ease-in-out_1.9s_infinite] place-items-center rounded-[36px] border border-white/15 bg-white/5 text-accent-mint backdrop-blur-sm max-lg:hidden"
          >
            <span className="absolute inset-0 animate-ripple rounded-[36px] border border-accent-mint opacity-0" />
            <span className="absolute inset-0 animate-ripple rounded-[36px] border border-accent-mint opacity-0 [animation-delay:1.8s]" />
            <Compass size={85} className="animate-sway" />
          </div>
        </div>

        <small className="relative z-10 text-xs text-white/50 max-lg:hidden">
          مسار · Intelligent Academic Support System
        </small>
      </aside>

      <main className="relative flex flex-col bg-white px-6 py-8 lg:px-[clamp(24px,6vw,96px)]">
        <Link
          to="/"
          className="group inline-flex w-fit animate-rise items-center gap-2 text-sm text-muted transition-colors hover:text-accent"
        >
          <ArrowRight
            size={17}
            className="transition-transform duration-300 group-hover:translate-x-1"
          />{" "}
          العودة للرئيسية
        </Link>

        {/* auth-fields: يربط تنسيق الحقول والأزرار الموجود في index.css */}
        <div className="auth-fields mx-auto my-auto w-full max-w-[460px] py-6">
          <h1 className="mb-1.5 animate-rise text-[34px] font-bold [animation-delay:.1s]">
            {title}
          </h1>
          <p className="mb-6 animate-rise text-sm text-muted [animation-delay:.18s]">
            {subtitle}
          </p>
          {children}
        </div>
      </main>
    </div>
  );
}
