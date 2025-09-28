import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ConfidentialAuction - Privacy-Preserving Auctions",
  description: "A privacy-preserving auction system built with FHEVM technology, ensuring complete bid confidentiality and voter anonymity.",
  keywords: ["auction", "FHEVM", "privacy", "blockchain", "encryption", "confidential"],
  authors: [{ name: "ConfidentialAuction Team" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
