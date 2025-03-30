"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "light" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-center" 
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "font-bold text-lg group toast group-[.toaster]:bg-white group-[.toaster]:text-black group-[.toaster]:border-border group-[.toaster]:shadow-sm",
          description: "group-[.toast]:text-primary",
          actionButton:
            "group-[.toast]:bg-white group-[.toast]:text-black",
          cancelButton:
            "group-[.toast]:bg-white group-[.toast]:text-black",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }