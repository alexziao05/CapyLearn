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
  title: "CapyLearn - AI Training for Insurance Professionals | Learn AI in 10 Minutes",
  description: "Master AI through 10-minute project-based lessons built for insurance professionals. Automate claims, underwriting, and customer service workflows. Start free.",
  keywords: ["AI training insurance", "insurance automation", "claims automation", "underwriting AI", "insurance professionals learning", "microlearning insurance"],
  authors: [{ name: "CapyLearn" }],
  openGraph: {
    title: "CapyLearn - AI Training for Insurance Professionals",
    description: "Learn AI by doing — automate your insurance workflow in minutes with project-based lessons.",
    type: "website",
    url: "https://capylearn.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "CapyLearn - AI Training for Insurance Professionals",
    description: "Learn AI by doing — automate your insurance workflow in minutes.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
