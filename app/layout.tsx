import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Changed from Geist to Inter for "premium" feel
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vivid News | Learn English from Zero",
  description: "Simplifying world news for English learners using AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
