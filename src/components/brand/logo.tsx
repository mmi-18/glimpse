import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  href = "/feed",
  showIcon = true,
  size = "md",
  className,
}: {
  href?: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const textSize =
    size === "lg" ? "text-3xl" : size === "md" ? "text-xl" : "text-base";
  const iconPx = size === "lg" ? 40 : size === "md" ? 28 : 22;

  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-2", className)}
    >
      {showIcon && (
        <Image
          src="/images/glimpse-logo.jpeg"
          alt="glimpse."
          width={iconPx}
          height={iconPx}
          className="rounded-full object-cover"
          priority
        />
      )}
      <span
        className={cn("brand-wordmark text-foreground leading-none", textSize)}
      >
        glimpse.
      </span>
    </Link>
  );
}
