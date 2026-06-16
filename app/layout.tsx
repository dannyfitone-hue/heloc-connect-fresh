import "./globals.css";

export const metadata = {
  title: "HELOC CONNECT | Home Equity Connection Platform",
  description:
    "HELOC CONNECT helps homeowners connect with participating mortgage professionals for home equity, refinance, and homeowner financing options.",

  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}
