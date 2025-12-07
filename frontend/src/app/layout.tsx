import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WeLinkAI - Automação com IA",
  description: "Automatize o atendimento da sua empresa com inteligência artificial",
};

import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body
        className="antialiased font-sans"
        suppressHydrationWarning
        style={{
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
