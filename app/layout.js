import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://psy-case-trainer.vercel.app"),
  title: {
    default: "Тренажёр для психологов",
    template: "%s — Тренажёр для психологов",
  },
  description:
    "Практикум решения психологических и организационных кейсов: клинические ситуации, организационная диагностика, стандарты и разбор решений.",
  applicationName: "Тренажёр для психологов",
  authors: [{ name: "Тренажёр для психологов" }],
  creator: "Тренажёр для психологов",
  publisher: "Тренажёр для психологов",
  keywords: [
    "психология",
    "учебные кейсы",
    "тренажёр для психологов",
    "психологическое консультирование",
    "организационная психология",
    "HR-консалтинг",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "/",
    siteName: "Тренажёр для психологов",
    title: "Тренажёр для психологов",
    description:
      "Практикум решения психологических и организационных кейсов, разбор ошибок и профессиональные источники.",
    images: [
      {
        url: "/og-preview.png",
        width: 1200,
        height: 630,
        alt: "Тренажёр для психологов",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Тренажёр для психологов",
    description:
      "Практикум решения психологических и организационных кейсов, разбор ошибок и профессиональные источники.",
    images: ["/og-preview.png"],
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport = {
  themeColor: "#10201c",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
