import { Plus_Jakarta_Sans } from "next/font/google";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackServerApp } from "../stack";
import "./globals.css";
import { PdfWorkerInitializer } from "@/components/ui/pdfworkerinitializer";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"], 
  variable: "--font-plus-jakarta",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${plusJakartaSans.variable} antialiased`}><StackProvider app={stackServerApp}><StackTheme>
        {children}
        <PdfWorkerInitializer />
      </StackTheme></StackProvider></body>
    </html>
  );
}
