import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://psy-case-trainer.vercel.app"),
  title: "Тренажёр профессионального мышления психолога",
  description:
    "Учебный тренажёр для студентов-психологов с реалистичными кейсами и объяснимой обратной связью.",
  applicationName: "Тренажёр психолога",
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
