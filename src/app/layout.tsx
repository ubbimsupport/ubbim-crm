import { IBM_Plex_Sans, Source_Serif_4 } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const sans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const serif = Source_Serif_4({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "UBBIM Corporate CRM",
    template: "%s | UBBIM CRM",
  },
  description: "UBBIM corporate CRM for vendors, contractors, documents, projects, and payments.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} h-full antialiased`}>
      <body className="min-h-full bg-background font-sans text-foreground">
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
