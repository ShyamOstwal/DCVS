export const CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // Local hardhat default address for first deployed contract

export const CONTRACT_ABI = [
  "function owner() view returns (address)",
  "function admins(address) view returns (bool)",
  "function certificates(string) view returns (string cid, address issuer, uint256 timestamp, bool isValid, bool exists)",
  "function addAdmin(address _admin)",
  "function removeAdmin(address _admin)",
  "function issueCertificate(string calldata _hash, string calldata _cid)",
  "function revokeCertificate(string calldata _hash)",
  "function verifyCertificate(string calldata _hash) view returns (bool exists, bool isValid, string cid, address issuer, uint256 timestamp)",
  "event CertificateIssued(string hash, string cid, address issuer, uint256 timestamp)",
  "event CertificateRevoked(string hash, address issuer, uint256 timestamp)"
];
