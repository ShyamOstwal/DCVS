import Link from 'next/link';

export default function Home() {
  return (
    <div className="container animate-fade-in" style={{ textAlign: 'center', marginTop: '4rem' }}>
      <h1 className="title">Decentralized Certificate Verification</h1>
      <p className="subtitle">
        Secure, Immutable, and Transparent digital certificate issuance using Blockchain and IPFS.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '4rem' }}>
        
        <Link href="/admin">
          <div className="glass-card" style={{ cursor: 'pointer', height: '100%' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏛️</div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Institution / Admin</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Issue new certificates to students. Documents are hashed, stored on IPFS, and secured on the blockchain.
            </p>
          </div>
        </Link>

        <Link href="/verify">
          <div className="glass-card" style={{ cursor: 'pointer', height: '100%' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Verify a Certificate</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Upload a certificate document to instantly verify its authenticity and check if it has been tampered with or revoked.
            </p>
          </div>
        </Link>

        <Link href="/student">
          <div className="glass-card" style={{ cursor: 'pointer', height: '100%' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎓</div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Student Portal</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              View and download your issued certificates using your unique verification hash or IPFS CID.
            </p>
          </div>
        </Link>

      </div>
    </div>
  );
}
