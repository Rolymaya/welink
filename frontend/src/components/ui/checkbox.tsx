'use client';
import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
    HTMLInputElement,
    React.InputHTMLAttributes<HTMLInputElement> & { onCheckedChange?: (checked: boolean) => void }
>(({ className, onCheckedChange, onChange, ...props }, ref) => (
    <div className="relative flex items-center">
        <input
            type="checkbox"
            className={cn(
                "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
                className
            )}
            ref={ref}
            onChange={(e) => {
                onChange?.(e);
                onCheckedChange?.(e.target.checked);
            }}
            {...props}
        />
    </div>
))
Checkbox.displayName = "Checkbox"

export { Checkbox }
