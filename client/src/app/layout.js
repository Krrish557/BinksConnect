import "./globals.css";
import LoginLayoutWrapper from "@/components/LoginLayoutWrapper";

export const metadata = {
    title: "BinksConnect",
    description: "Listen to your music anywhere",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>
                <LoginLayoutWrapper>
                    {children}
                </LoginLayoutWrapper>
            </body>
        </html>
    );
}
