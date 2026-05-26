"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../constants";

export default function StudentPage() {
  const [hash, setHash] = useState("");
  const [certData, setCertData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!hash) return;
    
    setIsLoading(true);
    setCertData(null);
    setError("");

    try {
      // In a real environment we'd connect to public RPC
      let provider;
      if (typeof window.ethereum !== "undefined") {
        provider = new ethers.BrowserProvider(window.ethereum);
      } else {
        provider = new ethers.JsonRpcProvider("http://localhost:8545");
      }

      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      
      const hashWithPrefix = hash.startsWith('0x') ? hash : '0x' + hash;
      const cert = await contract.verifyCertificate(hashWithPrefix);

      if (!cert.exists) {
        setError("Certificate not found. Please check the hash and try again.");
      } else {
        setCertData({
          cid: cert.cid,
          issuer: cert.issuer,
          timestamp: cert.timestamp,
          isValid: cert.isValid
        });
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch certificate. Ensure blockchain is running.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container animate-fade-in">
      <h1 className="title" style={{ textAlign: 'center' }}>Student Portal</h1>
      <p className="subtitle" style={{ textAlign: 'center' }}>Access and download your verifiable digital certificates.</p>

      <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="form-group">
          <label className="form-label">Certificate Hash (SHA256)</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="e.g. 0xb94d27b99..." 
            value={hash}
            onChange={(e) => setHash(e.target.value)}
          />
        </div>

        <button 
          className="btn btn-primary" 
          style={{ width: '100%', marginTop: '0.5rem' }}
          onClick={handleSearch}
          disabled={isLoading || !hash}
        >
          {isLoading ? "Searching..." : "Find Certificate"}
        </button>

        {error && (
          <div style={{ marginTop: '1rem', color: 'var(--danger)', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {certData && (
          <div className="animate-fade-in" style={{ marginTop: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Certificate Details</h3>
            
            <div style={{ 
              background: 'rgba(15, 23, 42, 0.5)', 
              borderRadius: '8px', 
              padding: '1.5rem',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                <span className={`badge ${certData.isValid ? 'badge-success' : 'badge-danger'}`} style={{ justifySelf: 'start' }}>
                  {certData.isValid ? 'Valid' : 'Revoked'}
                </span>
                
                <span style={{ color: 'var(--text-muted)' }}>Issuer Address:</span>
                <span style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{certData.issuer}</span>
                
                <span style={{ color: 'var(--text-muted)' }}>Issue Date:</span>
                <span>{new Date(Number(certData.timestamp) * 1000).toLocaleString()}</span>
                
                <span style={{ color: 'var(--text-muted)' }}>IPFS Link:</span>
                <a 
                  href={`https://gateway.pinata.cloud/ipfs/${certData.cid}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: 'var(--primary-color)', textDecoration: 'underline', wordBreak: 'break-all' }}
                >
                  ipfs://{certData.cid}
                </a>
              </div>

              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  Since this is a decentralized system, your actual certificate file is stored on IPFS.
                </p>
                <a 
                  href={`https://gateway.pinata.cloud/ipfs/${certData.cid}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                >
                  View Document on IPFS
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
