import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;

describe("CertificateStorage", function () {
  let certificateStorage;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const CertificateStorage = await ethers.getContractFactory("CertificateStorage");
    certificateStorage = await CertificateStorage.deploy();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await certificateStorage.owner()).to.equal(owner.address);
    });

    it("Should make the owner an admin", async function () {
      expect(await certificateStorage.admins(owner.address)).to.equal(true);
    });
  });

  describe("Admin Management", function () {
    it("Should allow owner to add an admin", async function () {
      await certificateStorage.addAdmin(addr1.address);
      expect(await certificateStorage.admins(addr1.address)).to.equal(true);
    });

    it("Should not allow non-owner to add an admin", async function () {
      await expect(certificateStorage.connect(addr1).addAdmin(addr2.address))
        .to.be.revertedWith("Not contract owner");
    });
  });

  describe("Certificate Management", function () {
    const testHash = "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9";
    const testCid = "QmTest1234567890";

    it("Should allow admin to issue a certificate", async function () {
      await certificateStorage.issueCertificate(testHash, testCid);
      
      const cert = await certificateStorage.verifyCertificate(testHash);
      expect(cert.exists).to.equal(true);
      expect(cert.isValid).to.equal(true);
      expect(cert.cid).to.equal(testCid);
      expect(cert.issuer).to.equal(owner.address);
    });

    it("Should not allow issuing an existing certificate", async function () {
      await certificateStorage.issueCertificate(testHash, testCid);
      await expect(certificateStorage.issueCertificate(testHash, testCid))
        .to.be.revertedWith("Certificate already exists");
    });

    it("Should allow admin to revoke a certificate", async function () {
      await certificateStorage.issueCertificate(testHash, testCid);
      await certificateStorage.revokeCertificate(testHash);

      const cert = await certificateStorage.verifyCertificate(testHash);
      expect(cert.exists).to.equal(true);
      expect(cert.isValid).to.equal(false);
    });
  });
});
