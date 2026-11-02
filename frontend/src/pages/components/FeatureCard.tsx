import IconBox from "./IconBox";
import Icon from "./Icon";
import Heading from "./Heading";
import Reveal from "./Reveal";

type Props = { icon: string; title: string; text: string; benefit: string; delay?: number };

export default function FeatureCard({ icon, title, text, benefit, delay = 0 }: Props) {
  return (
    <Reveal delay={delay} className="h-full">
      <div className="group h-full rounded-2xl border border-line bg-surface p-7 transition duration-300 hover:-translate-y-1.5 hover:border-accent hover:bg-white hover:shadow-[0_16px_36px_rgba(11,31,58,0.10)]">
        <div className="w-fit origin-right transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
          <IconBox name={icon} />
        </div>
        <Heading as="h3" size="md" className="mb-2">{title}</Heading>
        <p className="mb-4 text-muted">{text}</p>
        <div className="flex items-center gap-2 border-t border-line pt-3 text-[15px] font-semibold text-accent">
          <Icon name="check" size={18} /><span>{benefit}</span>
        </div>
      </div>
    </Reveal>
  );
}
