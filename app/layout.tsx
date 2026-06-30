import type { Metadata } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "STRYDZ",
  description: "Connect Strava, visualize activities, get training insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased">
        <div className="flex flex-col flex-1 mx-auto w-full max-w-md min-h-screen bg-background relative">
          <main className="flex-1 px-4 pt-4 pb-24">{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
