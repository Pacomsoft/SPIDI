import React from "react"
import { cn } from "@/lib/utils"

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string
  size?: string | number
}

export function Icon({ name, size, className, ...props }: IconProps) {
  return (
    <span
      className={cn("material-symbols-rounded select-none", className)}
      style={size ? { fontSize: size } : undefined}
      aria-hidden="true"
      {...props}
    >
      {name}
    </span>
  )
}
