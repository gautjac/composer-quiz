import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cadenza — A Daily Classical Music Quiz",
  description:
    "Learn the canon of Western classical music one composer at a time. Listen to a piece and identify the composer + period — or work in describe mode with their stylistic fingerprints.",
  applicationName: "Cadenza",
  appleWebApp: {
    capable: true,
    title: "Cadenza",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#2c241b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-vellum">{children}</body>
    </html>
  );
}
