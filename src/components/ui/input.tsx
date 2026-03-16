import * as React from "react";
import { cn } from "./utils";

interface InputProps extends React.ComponentProps<"input"> {
  variant?: "default" | "underline";
  changed?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = "default", changed = false, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        data-slot="input"
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground flex h-9 w-full min-w-0 px-3 py-1 text-[17px] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          "focus-visible:border-b-[#118AB2] focus-visible:ring-0",
          "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
          "[&[type=date]]:[-webkit-appearance:none] [&[type=date]::-webkit-calendar-picker-indicator]:hidden",
          variant === "underline"
            ? cn(
                "bg-transparent border-0 border-b-2 rounded-none shadow-none px-1 transition-colors",
                changed ? "border-[#EE5A7B]" : "border-gray-300"
              )
            : "rounded-[2px] border border-input bg-input-background transition-[color,box-shadow]",
          className,
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
export { Input };
