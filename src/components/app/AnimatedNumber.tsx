import { useCountUp } from "@/hooks/use-count-up";

export function AnimatedNumber({
  value,
  format = (n) => String(Math.round(n)),
  duration,
  className,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}) {
  const v = useCountUp(value, duration);
  return <span className={className}>{format(Math.round(v))}</span>;
}
