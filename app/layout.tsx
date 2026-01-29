import type { Metadata } from "next";
import { Phudu } from "next/font/google";
import "./globals.css";

const phudu = Phudu({
  variable: "--font-phudu",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Geographic Insights",
  description: "Interactive map visualizations and geographic insights",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${phudu.variable} font-phudu antialiased`}>
        {children}
      </body>
    </html>
  );
}
