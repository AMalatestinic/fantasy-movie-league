import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionWrapper } from "./session-wrapper"; // see below
import Header from "./partials/Header/header";
import Footer from "./partials/Footer/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Fantasy Movie League",
  description: "Create and manage your own fantasy movie leagues",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} app-container`}
      >
        <SessionWrapper>
          <Header />
          <main className="app-content">{children}</main>
          <Footer />
        </SessionWrapper>
      </body>
    </html>
  );
}
