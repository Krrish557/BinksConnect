import "./globals.css";
import AppLayout from "@/components/AppLayout";

export const metadata = {
  title: "BinksConnect",
  description: "Personal music ecosystem"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}