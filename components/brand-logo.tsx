import Image from "next/image";

type Props = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZE_MAP = {
  sm: 44,
  md: 60,
  lg: 80,
};

export function BrandLogo({ size = "md", className = "" }: Props) {
  const dimension = SIZE_MAP[size];

  return (
    <div
      className={`inline-flex items-center justify-center overflow-hidden ${className}`.trim()}
      aria-label="Brand logo"
      role="img"
    >
      <Image
        src="/logo.png"
        alt="Logo"
        width={dimension}
        height={dimension}
        className="h-full w-full object-contain"
        priority={size === "lg"}
      />
    </div>
  );
}
