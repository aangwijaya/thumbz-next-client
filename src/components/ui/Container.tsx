interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: "default" | "wide";
}

const sizeClasses: Record<NonNullable<ContainerProps["size"]>, string> = {
  default: "max-w-6xl",
  wide: "max-w-[132rem] lg:px-8",
};

export function Container({ children, className = "", size = "default" }: ContainerProps) {
  return (
    <div className={`mx-auto w-full px-4 sm:px-6 ${sizeClasses[size]} ${className}`}>
      {children}
    </div>
  );
}
