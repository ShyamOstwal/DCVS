"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../constants";

export default function VerifyPage() {
  const [file, setFile] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError("");
    }
  };

  const handleVerify = async () => {
    if (!file) {
      setError("Please select a file to verify.");
      return;
    }

    setIsVerifying(true);
    setResult(null);
    setError("");

    try {
      // 1. Get the hash of the uploaded document via the same API route
      // We only need the hash, we don't need to save the IPFS mock cid, but the route does it anyway.
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      // 2. Query the blockchain using ethers
      // Using a standard provider (since we just need to read, no wallet required, but we'll use window.ethereum if available or a public RPC)
      let provider;
      if (typeof window.ethereum !== "undefined") {
        provider = new ethers.BrowserProvider(window.ethereum);
      } else {
        // Fallback to local node if no wallet
        provider = new ethers.JsonRpcProvider("http://localhost:8545");
      }

      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      
      const cert = await contract.verifyCertificate(data.hash);
      
      if (!cert.exists) {
        setResult({
          status: "Invalid",
          message: "This certificate hash was not found on the blockchain. It may be forged or tampered with."
        });
      } else if (!cert.isValid) {
        setResult({
          status: "Revoked",
          message: "This certificate was issued but has since been revoked by the issuing institution.",
          details: cert
        });
      } else {
        setResult({
          status: "Valid",
          message: "Authenticity Verified. This document exactly matches the record on the blockchain.",
          details: cert
        });
      }

    } catch (err) {
      console.error(err);
      setError("Failed to verify. Ensure the local blockchain is running and MetaMask is connected to the right network.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="container animate-fade-in">
      <h1 className="title" style={{ textAlign: 'center' }}>Verify Certificate</h1>
      <p className="subtitle" style={{ textAlign: 'center' }}>Upload a document to check its authenticity against the blockchain record.</p>

      <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="form-group">
          <div className="file-upload" onClick={() => document.getElementById('file-upload-verify').click()}>
            <input 
              id="file-upload-verify" 
              type="file" 
              style={{ display: 'none' }} 
              onChange={handleFileChange}
              accept=".pdf,.png,.jpg,.jpeg"
            />
            {file ? (
              <div style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>
                📄 {file.name}
              </div>
            ) : (
              <>
                <div style={{ fontSize: '2rem' }}>🔍</div>
                <p>Click to upload document for verification</p>
              </>
            )}
          </div>
        </div>

        <button 
          className="btn btn-primary" 
          style={{ width: '100%', marginTop: '1rem' }}
          onClick={handleVerify}
          disabled={isVerifying || !file}
        >
          {isVerifying ? "Verifying against Blockchain..." : "Verify Authenticity"}
        </button>

        {error && (
          <div style={{ marginTop: '1rem', color: 'var(--danger)', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {result && (
          <div className="animate-fade-in" style={{ 
            marginTop: '2rem', 
            padding: '1.5rem', 
            borderRadius: '12px', 
            background: result.status === 'Valid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${result.status === 'Valid' ? 'var(--success)' : 'var(--danger)'}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '2rem' }}>
                {result.status === 'Valid' ? '✅' : '❌'}
              </div>
              <div>
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  color: result.status === 'Valid' ? 'var(--success)' : 'var(--danger)',
                  fontWeight: 'bold'
                }}>
                  {result.status}
                </h3>
                <p style={{ color: 'var(--text-main)', marginTop: '0.25rem' }}>{result.message}</p>
              </div>
            </div>

            {result.details && (
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: `1px dashed ${result.status === 'Valid' ? 'var(--success)' : 'var(--danger)'}` }}>
                <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.875rem', textTransform: 'uppercase' }}>On-Chain Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Issuer:</span>
                  <span style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{result.details.issuer}</span>
                  <span style={{ color: 'var(--text-muted)' }}>IPFS CID:</span>
                  <a 
                    href={`https://gateway.pinata.cloud/ipfs/${result.details.cid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontFamily: 'monospace', wordBreak: 'break-all', color: 'var(--primary-color)', textDecoration: 'underline' }}
                  >
                    {result.details.cid}
                  </a>
                  <span style={{ color: 'var(--text-muted)' }}>Issued On:</span>
                  <span>{new Date(Number(result.details.timestamp) * 1000).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
