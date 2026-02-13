import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mailien Demo",
  description: "Composable Email Infrastructure Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-100 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
