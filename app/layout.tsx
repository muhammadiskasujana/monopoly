import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Monopoly Digital",
  description: "Dompet dan bank digital pendamping permainan Monopoly di meja.",
  other: {
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
