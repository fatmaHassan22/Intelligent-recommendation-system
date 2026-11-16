import Icon from "./Icon";
import Reveal from "./Reveal";

type Props = {
  problem: string;
  problemText: string;
  solution: string;
  solutionText: string;
  delay?: number;
};

export default function ProblemPair({
  problem,
  problemText,
  solution,
  solutionText,
  delay = 0,
}: Props) {
  return (
    <Reveal delay={delay}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex gap-4 rounded-2xl border border-line bg-surface p-6">
          <span className="mt-1 flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#FDECEA] text-[#9A3412]">
            <Icon name="x" size={18} />
          </span>
          <div>
            <div className="text-sm font-semibold text-[#9A3412]">المشكلة</div>
            <strong className="text-lg">{problem}</strong>
            <p className="text-muted">{problemText}</p>
          </div>
        </div>
        <div className="flex gap-4 rounded-2xl border border-accent/30 bg-accent-soft p-6">
          <span className="mt-1 flex h-9 w-9 flex-none items-center justify-center rounded-full bg-accent text-white">
            <Icon name="check" size={18} />
          </span>
          <div>
            <div className="text-sm font-semibold text-accent">الحل مع مسار</div>
            <strong className="text-lg">{solution}</strong>
            <p className="text-muted">{solutionText}</p>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
