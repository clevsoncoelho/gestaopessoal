import type { Metadata, Viewport } from "next";
import "./globals.css";
import { RegisterSW } from "@/components/register-sw";

export const metadata: Metadata = {
  title: "Pulse Finance",
  description: "Gestão financeira pessoal e profissional, feita para o celular.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: ["/icon.svg"],
    apple: [{ url: "/icon.svg" }]
  },
  applicationName: "Pulse Finance",
  generator: "Next.js"
};

export const viewport: Viewport = {
  themeColor: "#101827",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body><RegisterSW />{children}</body>
    </html>
  );
}
