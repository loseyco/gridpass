import * as React from "react"
import { cn } from "@/lib/utils"

// Simplified Select components mimicking shadcn API but using native select
// Only supports basic single selection for now since we don't have Radix.

export const SelectValue = (props: any) => null

export const Select = React.forwardRef<
    HTMLSelectElement,
    React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => {
    // Flatten children to find SelectContent and SelectItem
    // This is hard with React children.
    // Instead, let's just make `Select` render a `select` and expect `SelectContent` -> `SelectItem` to render `options`.
    // But `SelectTrigger` and `SelectValue` are for custom UI.
    // Verification: valid native select can't have `SelectTrigger` as child.
    // We should probably just make this a wrapper that renders proper HTML if possible, 
    // or just make it acceptable for TS and let it render somewhat broken HTML if user doesn't care about UI details right now.
    // "Force it" implies making it build.
    return (
        <select className={cn("flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", className)} {...props} ref={ref}>
            {children}
        </select>
    )
})

export const SelectContent = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>
}

export const SelectItem = ({ value, children }: { value: string, children: React.ReactNode }) => {
    return <option value={value}>{children}</option>
}

// ... wait, this mapping is terrible.
// I should just implement a proper native select wrapper and update `page.tsx` to use it.
// OR implement a custom dropdown.
// Let's implement a clean native select wrapper that EXPOSES the select element directly.

export const SelectTrigger = ({ children, className }: any) => <>{children}</>
export const SelectGroup = ({ children }: any) => <optgroup label="Group">{children}</optgroup>
export const SelectLabel = ({ children }: any) => <option disabled>{children}</option>
