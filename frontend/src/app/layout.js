import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "DCVS - Decentralized Certificate Verification",
  description: "Secure, blockchain-based certificate issuance and verification.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className={inter.className}>
        <nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '32px', height: '32px', background: 'var(--primary-color)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white' }}>
              D
            </div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>DCVS</h1>
          </div>
          <div className="nav-links">
            <a href="/" className="nav-link">Home</a>
            <a href="/admin" className="nav-link">Admin</a>
            <a href="/verify" className="nav-link">Verify</a>
            <a href="/student" className="nav-link">Student</a>
          </div>
        </nav>
        <main style={{ flex: 1, padding: '2rem 0' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
