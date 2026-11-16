import type { ReactNode } from "react";
import Icon from "./Icon";
import Reveal from "./Reveal";

type Props = { delay?: number; children: ReactNode };

export default function ReasonItem({ delay = 0, children }: Props) {
  return (
    <Reveal delay={delay}>
      <div className="flex gap-2.5">
        <Icon name="check" size={20} className="mt-0.5 flex-none text-accent" />
        <span>{children}</span>
      </div>
    </Reveal>
  );
}
