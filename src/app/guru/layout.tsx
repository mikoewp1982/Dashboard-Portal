import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "GAS Guru",
  description: "Portal guru GAS — monitoring kelas wali di iPhone/iPad dan browser.",
  applicationName: "GAS Guru",
  manifest: "/guru/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GAS Guru",
  },
  icons: {
    apple: "/tutorial/gas-siswa/logo-aplikasi.png",
    icon: "/tutorial/gas-siswa/logo-aplikasi.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function GuruLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="apple-touch-icon" href="/tutorial/gas-siswa/logo-aplikasi.png" />
      {children}
    </>
  );
}
