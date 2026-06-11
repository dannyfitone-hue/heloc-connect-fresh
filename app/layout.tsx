import "./globals.css";

export const metadata = {
  title: "HELOC CONNECT | Home Equity Connection Platform",
  description: "HELOC CONNECT helps homeowners connect with participating mortgage companies.",
  icons: { icon: "/favicon.png" }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
