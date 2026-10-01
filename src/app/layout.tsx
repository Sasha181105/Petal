import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Instrument_Serif } from "next/font/google";
import { MotionProvider } from "@/components/motion-provider";
import "./globals.css";

// Expressive serif for headings and figures; calm, legible sans/mono for the UI.
const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
});
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  title: "Petal",
  description: "Flower waste tracking for small shops",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f4efe6",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const fonts = [instrument, plexSans, plexMono].map((f) => f.variable).join(" ");
  return (
    <html lang="en" className={fonts}>
      <body className="paper min-h-dvh font-sans text-soil antialiased">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
