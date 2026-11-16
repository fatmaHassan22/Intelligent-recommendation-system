import Container from "../components/Container";
import Heading from "../components/Heading";
import Button from "../components/Button";
import Reveal from "../components/Reveal";
import { Link } from "react-router-dom";

// المحتوى النصي لهذا القسم، عدّله هنا مباشرة.
const cta = {
  title: "قرار فصلك القادم يبدأ من هنا",
  text: "لا تترك مساقاتك ووقتك للصدفة. ابدأ الآن، وتقرّر أنت دائمًا بينما يوضح لك مسار السبب.",
  label: "ابدأ الآن",
  href: "#top",
  secondary: { label: "جرّب قائمة المهام", href: "#try" },
};

export default function CTA() {
  return (
    <section id="cta" className="py-[88px]">
      <Container>
        <Reveal>
          <div className="rounded-3xl bg-ink px-8 py-16 text-center text-white ">
            <Heading className="mx-auto mb-4 text-10xl ">{cta.title}</Heading>
            <p className="mx-auto mb-8 text-[#C9D6EA]">{cta.text}</p>

            <Link to="/register">
              <Button
                href={cta.href}
                variant="mint"
                className="animate-pulse-ring px-10 font-bold"
              >
                {cta.label}
              </Button>
            </Link>

            {/* max-w-[560px] text-[17px]  */}
            {/* max-w-[680px] !text-[clamp(28px,4.5vw,46px)] */}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
