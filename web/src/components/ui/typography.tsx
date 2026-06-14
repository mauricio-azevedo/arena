import * as React from "react"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

type TypographyProps<T extends React.ElementType> = React.ComponentPropsWithoutRef<T> & {
  asChild?: boolean
}

function TypographyH1({ className, asChild, ...props }: TypographyProps<"h1">) {
  const Comp = asChild ? Slot.Root : "h1"

  return (
    <Comp
      data-slot="typography-h1"
      className={cn("scroll-m-20 text-4xl font-extrabold tracking-tight text-balance", className)}
      {...props}
    />
  )
}

function TypographyH2({ className, asChild, ...props }: TypographyProps<"h2">) {
  const Comp = asChild ? Slot.Root : "h2"

  return (
    <Comp
      data-slot="typography-h2"
      className={cn("scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0", className)}
      {...props}
    />
  )
}

function TypographyH3({ className, asChild, ...props }: TypographyProps<"h3">) {
  const Comp = asChild ? Slot.Root : "h3"

  return (
    <Comp
      data-slot="typography-h3"
      className={cn("scroll-m-20 text-2xl font-semibold tracking-tight", className)}
      {...props}
    />
  )
}

function TypographyH4({ className, asChild, ...props }: TypographyProps<"h4">) {
  const Comp = asChild ? Slot.Root : "h4"

  return (
    <Comp
      data-slot="typography-h4"
      className={cn("scroll-m-20 text-xl font-semibold tracking-tight", className)}
      {...props}
    />
  )
}

function TypographyP({ className, asChild, ...props }: TypographyProps<"p">) {
  const Comp = asChild ? Slot.Root : "p"

  return (
    <Comp
      data-slot="typography-p"
      className={cn("leading-7 [&:not(:first-child)]:mt-6", className)}
      {...props}
    />
  )
}

function TypographyBlockquote({ className, asChild, ...props }: TypographyProps<"blockquote">) {
  const Comp = asChild ? Slot.Root : "blockquote"

  return (
    <Comp
      data-slot="typography-blockquote"
      className={cn("mt-6 border-l-2 pl-6 italic", className)}
      {...props}
    />
  )
}

function TypographyList({ className, asChild, ...props }: TypographyProps<"ul">) {
  const Comp = asChild ? Slot.Root : "ul"

  return (
    <Comp
      data-slot="typography-list"
      className={cn("my-6 ml-6 list-disc [&>li]:mt-2", className)}
      {...props}
    />
  )
}

function TypographyInlineCode({ className, asChild, ...props }: TypographyProps<"code">) {
  const Comp = asChild ? Slot.Root : "code"

  return (
    <Comp
      data-slot="typography-inline-code"
      className={cn(
        "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
        className
      )}
      {...props}
    />
  )
}

function TypographyLead({ className, asChild, ...props }: TypographyProps<"p">) {
  const Comp = asChild ? Slot.Root : "p"

  return (
    <Comp
      data-slot="typography-lead"
      className={cn("text-xl text-muted-foreground", className)}
      {...props}
    />
  )
}

function TypographyLarge({ className, asChild, ...props }: TypographyProps<"div">) {
  const Comp = asChild ? Slot.Root : "div"

  return (
    <Comp
      data-slot="typography-large"
      className={cn("text-lg font-semibold", className)}
      {...props}
    />
  )
}

function TypographySmall({ className, asChild, ...props }: TypographyProps<"small">) {
  const Comp = asChild ? Slot.Root : "small"

  return (
    <Comp
      data-slot="typography-small"
      className={cn("text-sm leading-none font-medium", className)}
      {...props}
    />
  )
}

function TypographyMuted({ className, asChild, ...props }: TypographyProps<"p">) {
  const Comp = asChild ? Slot.Root : "p"

  return (
    <Comp
      data-slot="typography-muted"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  TypographyBlockquote,
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyH4,
  TypographyInlineCode,
  TypographyLarge,
  TypographyLead,
  TypographyList,
  TypographyMuted,
  TypographyP,
  TypographySmall,
}
