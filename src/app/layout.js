import "./globals.css";
import { Providers } from "@/app/providers";
import { Lexend } from "next/font/google";

const lexend = Lexend({ subsets: ["latin"] });

export const metadata = {
  title: "DashBoard Cungkok",
  description: "Real-time chat application",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`antialiased ${lexend.className}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
