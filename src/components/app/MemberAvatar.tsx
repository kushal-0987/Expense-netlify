import { avatarColor, initials } from "@/lib/avatar";
import { cn } from "@/lib/utils";

export function MemberAvatar({
  name,
  seed,
  src,
  size = "md",
  className,
}: {
  name: string;
  seed?: string;
  src?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const dims = { xs: "h-6 w-6 text-[10px]", sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-14 w-14 text-lg" }[size];
  if (src) {
    return <img src={src} alt={name} className={cn("shrink-0 rounded-full object-cover", dims, className)} />;
  }
  return (
    <div
      aria-hidden
      className={cn("flex shrink-0 items-center justify-center rounded-full font-bold text-primary-foreground", dims, className)}
      style={{ backgroundColor: avatarColor(seed ?? name) }}
    >
      {initials(name)}
    </div>
  );
}
