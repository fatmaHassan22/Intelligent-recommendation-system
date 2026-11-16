import Icon from "./Icon";

type Props = { name: string };

export default function IconBox({ name }: Props) {
  return (
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-accent">
      <Icon name={name} />
    </div>
  );
}
