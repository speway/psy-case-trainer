import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://psy-case-trainer.vercel.app"),
  title: {
    default: "Тренажёр психолога",
    template: "%s — Тренажёр психолога",
  },
  description:
    "Учебная платформа Научного сектора психологии ТФ МГУ: 10 кейсов, методика КАРТА, разбор ошибок и профессиональные источники.",
  applicationName: "Тренажёр психолога",
  authors: [{ name: "Научный сектор психологии ТФ МГУ" }],
  creator: "Научный сектор психологии ТФ МГУ",
  publisher: "Научный сектор психологии ТФ МГУ",
  keywords: [
    "психология",
    "учебные кейсы",
    "студенты-психологи",
    "психологическое консультирование",
    "ТФ МГУ",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "/",
    siteName: "Тренажёр психолога",
    title: "Тренажёр психолога",
    description:
      "Учебные психологические кейсы, методика КАРТА, разбор ошибок и профессиональные источники.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Тренажёр психолога — учебная площадка Научного сектора психологии ТФ МГУ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Тренажёр психолога",
    description:
      "Учебные психологические кейсы, методика КАРТА, разбор ошибок и профессиональные источники.",
    images: ["/opengraph-image"],
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml", sizes: "any" }],
    shortcut: "/favicon.svg",
  },
};

export const viewport = {
  themeColor: "#17332d",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
