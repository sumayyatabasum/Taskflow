import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GATE DA 2027 Tracker",
  description: "Personal GATE Data Science & AI preparation tracker",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
