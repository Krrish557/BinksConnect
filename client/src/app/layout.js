import "./globals.css";
import AppLayout from "@/components/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

export const metadata = {
  title: "BinksConnect"
};

export default function RootLayout({
  children
}) {
  return (
    <html lang="en">
      <body>
        <ProtectedRoute>
          <AppLayout>
            {children}
          </AppLayout>
        </ProtectedRoute>
      </body>
    </html>
  );
}