// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CertificateStorage {
    address public owner;

    struct Certificate {
        string cid;       // IPFS Content Identifier
        address issuer;   // Admin who issued the certificate
        uint256 timestamp; // Time of issuance
        bool isValid;     // Allows for revocation
        bool exists;
    }

    // Mapping from SHA256 document hash to Certificate details
    mapping(string => Certificate) public certificates;

    // Mapping to track authorized admins
    mapping(address => bool) public admins;

    event CertificateIssued(string hash, string cid, address issuer, uint256 timestamp);
    event CertificateRevoked(string hash, address issuer, uint256 timestamp);
    event AdminAdded(address admin);
    event AdminRemoved(address admin);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not contract owner");
        _;
    }

    modifier onlyAdmin() {
        require(admins[msg.sender], "Not authorized admin");
        _;
    }

    constructor() {
        owner = msg.sender;
        admins[msg.sender] = true; // The owner is the first admin
    }

    function addAdmin(address _admin) external onlyOwner {
        admins[_admin] = true;
        emit AdminAdded(_admin);
    }

    function removeAdmin(address _admin) external onlyOwner {
        require(_admin != owner, "Cannot remove owner from admins");
        admins[_admin] = false;
        emit AdminRemoved(_admin);
    }

    function issueCertificate(string calldata _hash, string calldata _cid) external onlyAdmin {
        require(!certificates[_hash].exists, "Certificate already exists");

        certificates[_hash] = Certificate({
            cid: _cid,
            issuer: msg.sender,
            timestamp: block.timestamp,
            isValid: true,
            exists: true
        });

        emit CertificateIssued(_hash, _cid, msg.sender, block.timestamp);
    }

    function revokeCertificate(string calldata _hash) external onlyAdmin {
        require(certificates[_hash].exists, "Certificate does not exist");
        require(certificates[_hash].isValid, "Certificate already revoked");
        // Optional: only the issuer or owner can revoke? For now, any admin can revoke.

        certificates[_hash].isValid = false;

        emit CertificateRevoked(_hash, msg.sender, block.timestamp);
    }

    function verifyCertificate(string calldata _hash) external view returns (bool exists, bool isValid, string memory cid, address issuer, uint256 timestamp) {
        Certificate memory cert = certificates[_hash];
        return (cert.exists, cert.isValid, cert.cid, cert.issuer, cert.timestamp);
    }
}
