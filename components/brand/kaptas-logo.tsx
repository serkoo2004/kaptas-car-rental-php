import Image from "next/image";
import { cn } from "@/lib/utils";

export function KaptasLogo({
  className,
  compact = false,
  priority = false,
}: {
  className?: string;
  compact?: boolean;
  priority?: boolean;
}) {
  return (
    <span
      className={cn(
        "relative block shrink-0 overflow-hidden",
        compact ? "h-10 w-[168px]" : "h-[50px] w-[210px]",
        className,
      )}
    >
      <Image
        alt="KAPTAŞ Car Rental"
        className={cn(
          "absolute max-w-none",
          compact
            ? "-left-5 -top-[45px] h-[140px] w-[210px]"
            : "-left-[25px] -top-14 h-[175px] w-[263px]",
        )}
        height={compact ? 140 : 175}
        priority={priority}
        src="/logo.png"
        width={compact ? 210 : 263}
      />
    </span>
  );
}
