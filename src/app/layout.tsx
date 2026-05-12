import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Speed Networking Passport",
  description: "Mobile-first speed networking game with QR passport stamps.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
