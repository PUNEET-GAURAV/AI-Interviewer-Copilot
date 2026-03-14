import type { Metadata } from "next";
import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "Interview Mate | AI-Powered Interview Assistant",
  description: "An intelligent enterprise recruitment simulation platform that reinvents technical interviews using AI, Behavioral Intelligence, and Adaptive Questioning.",
  keywords: ["AI Interview", "Recruitment", "Enterprise Hiring", "Interview Simulation"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}
