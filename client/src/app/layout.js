import "./globals.css";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import LoginLayoutWrapper from "@/components/LoginLayoutWrapper";

export const metadata = {
    title: "BinksConnect",
    description: "Listen to your music anywhere",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <ProtectedRoute>
                    <LoginLayoutWrapper>
                        {children}
                    </LoginLayoutWrapper>
                </ProtectedRoute>
            </body>
        </html>
    );
}
