import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import { Providers } from "@/app/providers";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-sans-primary",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LearnOS",
  description: "AI-powered learning operating system",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/logo.svg", type: "image/svg+xml" }],
    apple: [{ url: "/logo.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    title: "LearnOS",
    description: "AI-powered learning operating system",
    images: [{ url: "/logo.svg", type: "image/svg+xml" }],
  },
  twitter: {
    card: "summary",
    title: "LearnOS",
    description: "AI-powered learning operating system",
    images: ["/logo.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${figtree.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
