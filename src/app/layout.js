import "./globals.css";
import { Providers } from "@/app/providers";

export const metadata = {
  title: "Chat App",
  description: "Real-time chat application",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
