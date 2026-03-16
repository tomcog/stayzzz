import * as React from "react";
import { cn } from "./utils";

interface TextareaProps extends React.ComponentProps<"textarea"> {
  variant?: "default" | "underline";
  changed?: boolean;
}

function Textarea({ className, variant = "default", changed = false, ...props }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "resize-none placeholder:text-muted-foreground focus-visible:border-b-[#118AB2] focus-visible:ring-0 aria-invalid:border-destructive flex min-h-16 w-full px-3 py-2 text-[17px] outline-none disabled:cursor-not-allowed disabled:opacity-50",
        variant === "underline"
          ? cn(
              "bg-transparent border-0 border-b-2 rounded-none shadow-none px-1 transition-colors",
              changed ? "border-[#EE5A7B]" : "border-gray-300"
            )
          : "border-input rounded-md border bg-input-background transition-[color,box-shadow]",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
