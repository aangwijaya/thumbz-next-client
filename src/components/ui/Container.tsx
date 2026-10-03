interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: "default" | "wide" | "page" | "watch";
}

const sizeClasses: Record<NonNullable<ContainerProps["size"]>, string> = {
  default: "max-w-6xl px-4 sm:px-6",
  wide: "max-w-[132rem] px-4 sm:px-6 lg:px-8",
  page: "max-w-[1200px] px-5 sm:px-6 lg:px-8",
  watch: "max-w-[1376px] px-5 sm:px-6 lg:px-8",
};

export function Container({ children, className = "", size = "default" }: ContainerProps) {
  return (
    <div className={`mx-auto w-full ${sizeClasses[size]} ${className}`}>
      {children}
    </div>
  );
}
