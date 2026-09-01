import "./globals.css";
import { SessionBootstrap } from "../components/session-bootstrap";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <SessionBootstrap />
        {children}
      </body>
    </html>
  );
}
