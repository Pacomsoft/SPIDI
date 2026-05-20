import type { Metadata } from "next";
import { Inter, Open_Sans } from "next/font/google";
import "./globals.css";
import "material-symbols";
import { GlobalLoadingProvider } from "@/modules/shared/application/presentation/components/global-loading-provider";
import { ToastProvider } from "@/modules/shared/application/presentation/components/toast-provider";
import { createNonceProvider } from "@/modules/shared/infrastructure/server-dependency-injection";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-open-sans",
});

export const metadata: Metadata = {
  title: "Sé Repartidor | Gana Dinero con Entregas a Domicilio",
  description:
    "Genera ingresos extra como repartidor. Tú decides tus horarios, elige tu zona y recibe pagos semanales. Regístrate hoy y comienza a ganar",
  keywords: [
    "Repartidor",
    "Socio repartidor",
    "Entregas a domicilio",
    "Última milla",
    "Gana dinero extra",
    "Flexibilidad laboral",
    "Trabaja cuando quieras",
    "Aplicación móvil",
    "Seguimiento en tiempo real",
    "Soporte al cliente",
  ],
  authors: [{ name: "SPIDI Team", url: "https://spidi.mx" }],
};
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = await createNonceProvider().getNonce();
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${inter.variable} ${openSans.variable}`}
      data-scroll-behavior="smooth"
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="googlebot-news" content="nosnippet" />
        <meta name="googlebot" content="notranslate" />
        {nonce && <meta name="csp-nonce" content={nonce} />}
      </head>
      <body className="font-sans antialiased">
        <GlobalLoadingProvider>
          <ToastProvider>{children}</ToastProvider>
        </GlobalLoadingProvider>
      </body>
    </html>
  );
}

