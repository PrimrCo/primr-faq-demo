import type { Metadata } from "next";
import "./globals.css";
import ClientSessionProvider from "../components/ClientSessionProvider";

export const metadata: Metadata = {
  title: "Primr Event Manager - Professional FAQ Management",
  description: "Professional event and team management with AI-powered document Q&A for event planners and marketing managers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans">
        <ClientSessionProvider>{children}</ClientSessionProvider>
      </body>
    </html>
  );
}
