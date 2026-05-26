"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../constants";

export default function AdminPage() {
  const [mounted, setMounted] = useState(false);
  const [file, setFile] = useState(null);
  const [account, setAccount] = useState("");
  const [isIssuing, setIsIssuing] = useState(false);
  const [message, setMessage] = useState("");

  // Revocation State
  const [revokeHash, setRevokeHash] = useState("");
  const [isRevoking, setIsRevoking] = useState(false);
  const [revokeMessage, setRevokeMessage] = useState("");

  // History State
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        setAccount(accounts[0]);
        setMessage("");
        
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x7a69' }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: '0x7a69',
                    chainName: 'Hardhat Localhost',
                    rpcUrls: ['http://127.0.0.1:8545/'],
                    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 }
                  },
                ],
              });
            } catch (addError) {
              console.error("Error adding network", addError);
            }
          }
        }
      } catch (error) {
        console.error("Wallet connection failed", error);
        setMessage("Error: Wallet connection failed. Please try again.");
      }
    } else {
      setMessage("Error: Please install MetaMask or another Web3 wallet to connect.");
    }
  };

  const checkIfWalletIsConnected = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        }
      } catch (error) {
        console.error("Error checking wallet connection", error);
      }
    }
  };

  const fetchHistory = async (currentAccount) => {
    if (!currentAccount) return;
    setIsLoadingHistory(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      
      const filter = contract.filters.CertificateIssued();
      const allEvents = await contract.queryFilter(filter);
      const events = allEvents.filter(e => e.args[2].toLowerCase() === currentAccount.toLowerCase());
      
      const historyData = await Promise.all(events.map(async (event) => {
        const cert = await contract.verifyCertificate(event.args[0]);
        return {
          hash: event.args[0],
          cid: event.args[1],
          timestamp: Number(event.args[3]),
          isValid: cert.isValid
        };
      }));
      
      historyData.sort((a, b) => b.timestamp - a.timestamp);
      setHistory(historyData);
    } catch (error) {
      console.error("Error fetching history", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    checkIfWalletIsConnected();
    
    if (typeof window.ethereum !== "undefined") {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount("");
          setHistory([]);
        }
      });
    }
  }, []);

  useEffect(() => {
    if (account) {
      fetchHistory(account);
    }
  }, [account]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleIssue = async () => {
    if (!file) {
      setMessage("Please select a file first.");
      return;
    }
    if (!account) {
      setMessage("Please connect your wallet.");
      return;
    }

    setIsIssuing(true);
    setMessage("Uploading to IPFS and generating hash...");

    try {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x7a69' }],
        });
      } catch (switchError) {
        console.error("Network switch failed", switchError);
      }

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setMessage(`Pinned to IPFS. Signing transaction...`);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const tx = await contract.issueCertificate(data.hash, data.cid);
      setMessage("Transaction submitted. Waiting for confirmation...");
      
      await tx.wait();
      
      setMessage(`Certificate successfully issued! CID: ${data.cid}`);
      setFile(null);
      fetchHistory(account);
    } catch (error) {
      console.error(error);
      setMessage(`Error: ${error.reason || error.message || "Unknown error occurred"}`);
    } finally {
      setIsIssuing(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeHash) {
      setRevokeMessage("Please enter a hash to revoke.");
      return;
    }
    if (!account) {
      setRevokeMessage("Please connect your wallet.");
      return;
    }

    setIsRevoking(true);
    setRevokeMessage("Initiating revocation...");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const hashWithPrefix = revokeHash.startsWith('0x') ? revokeHash : '0x' + revokeHash;
      
      const tx = await contract.revokeCertificate(hashWithPrefix);
      setRevokeMessage("Transaction submitted. Waiting for confirmation...");
      
      await tx.wait();
      
      setRevokeMessage("Certificate successfully revoked!");
      setRevokeHash("");
      fetchHistory(account);
    } catch (error) {
      console.error(error);
      setRevokeMessage(`Error: ${error.reason || error.message || "Unknown error occurred"}`);
    } finally {
      setIsRevoking(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="container animate-fade-in">
      <h1 className="title">Admin Dashboard</h1>
      <p className="subtitle">Manage certificates on the blockchain.</p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', maxWidth: '800px', margin: '0 auto 2rem auto', padding: '1rem', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Connected Wallet</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : "Not connected"}
          </p>
        </div>
        {!account && (
          <button className="btn btn-secondary" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Issue Section */}
        <div className="glass-card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Issue Certificate</h2>
          <div className="form-group">
            <label className="form-label">Upload Document</label>
            <div className="file-upload" onClick={() => document.getElementById('file-upload').click()}>
              <input 
                id="file-upload" 
                type="file" 
                style={{ display: 'none' }} 
                onChange={handleFileChange}
                accept=".pdf,.png,.jpg,.jpeg"
              />
              {file ? (
                <div style={{ color: 'var(--success)', fontWeight: 'bold' }}>📄 {file.name}</div>
              ) : (
                <>
                  <div style={{ fontSize: '2rem' }}>📁</div>
                  <p>Click or drag file to upload</p>
                </>
              )}
            </div>
          </div>

          <button 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '1rem' }}
            onClick={handleIssue}
            disabled={isIssuing || !file || !account}
          >
            {isIssuing ? "Issuing..." : "Issue Certificate"}
          </button>

          {message && (
            <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '8px', background: message.includes('Error') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', border: `1px solid ${message.includes('Error') ? 'var(--danger)' : 'var(--success)'}`, color: message.includes('Error') ? 'var(--danger)' : 'var(--success)' }}>
              {message}
            </div>
          )}
        </div>

        {/* Revoke Section */}
        <div className="glass-card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Revoke Certificate</h2>
          <div className="form-group">
            <label className="form-label">Certificate Hash (SHA256)</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. 0xb94d27b99..." 
              value={revokeHash}
              onChange={(e) => setRevokeHash(e.target.value)}
            />
          </div>

          <button 
            className="btn" 
            style={{ width: '100%', marginTop: '1rem', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)', border: '1px solid var(--danger)' }}
            onClick={handleRevoke}
            disabled={isRevoking || !revokeHash || !account}
          >
            {isRevoking ? "Revoking..." : "Revoke Certificate"}
          </button>

          {revokeMessage && (
            <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '8px', background: revokeMessage.includes('Error') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', border: `1px solid ${revokeMessage.includes('Error') ? 'var(--danger)' : 'var(--success)'}`, color: revokeMessage.includes('Error') ? 'var(--danger)' : 'var(--success)' }}>
              {revokeMessage}
            </div>
          )}
        </div>
      </div>

      {/* History Section */}
      <div className="glass-card" style={{ maxWidth: '1000px', margin: '2rem auto' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
          <span>Issued Certificates History</span>
          <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }} onClick={() => fetchHistory(account)} disabled={isLoadingHistory || !account}>
            Refresh
          </button>
        </h2>
        
        {!account ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Connect wallet to view history.</p>
        ) : isLoadingHistory ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Loading history...</p>
        ) : history.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No certificates issued yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>Date</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>Hash</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>IPFS CID</th>
                  <th style={{ padding: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((cert, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                      {new Date(cert.timestamp * 1000).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                      {cert.hash.substring(0, 10)}...{cert.hash.substring(cert.hash.length - 8)}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                      <a href={`https://gateway.pinata.cloud/ipfs/${cert.cid}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>
                        {cert.cid.substring(0, 8)}...
                      </a>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={`badge ${cert.isValid ? 'badge-success' : 'badge-danger'}`} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                        {cert.isValid ? 'Valid' : 'Revoked'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
