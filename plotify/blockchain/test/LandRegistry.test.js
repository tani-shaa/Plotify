const { expect } = require("chai");
const { ethers }  = require("hardhat");

describe("LandRegistry", function () {
  let registry;
  let admin, owner1, owner2, stranger;

  beforeEach(async function () {
    [admin, owner1, owner2, stranger] = await ethers.getSigners();
    const LandRegistry = await ethers.getContractFactory("LandRegistry");
    registry = await LandRegistry.deploy();
    await registry.waitForDeployment();
  });

  // ── Deployment ─────────────────────────────────────────────────────────────

  describe("Deployment", function () {
    it("sets the deployer as admin", async function () {
      expect(await registry.admin()).to.equal(admin.address);
    });

    it("starts with zero properties", async function () {
      expect(await registry.totalProperties()).to.equal(0n);
    });
  });

  // ── registerProperty ───────────────────────────────────────────────────────

  describe("registerProperty", function () {
    it("registers a property and emits event", async function () {
      await expect(
        registry.registerProperty("Lot A", "Nairobi CBD", 500, owner1.address)
      )
        .to.emit(registry, "PropertyRegistered")
        .withArgs(1n, owner1.address, "Lot A", (ts) => ts > 0n);
    });

    it("increments the property counter", async function () {
      await registry.registerProperty("Lot A", "Nairobi", 500, owner1.address);
      await registry.registerProperty("Lot B", "Mombasa", 300, owner2.address);
      expect(await registry.totalProperties()).to.equal(2n);
    });

    it("getProperty returns correct data", async function () {
      await registry.registerProperty("Lot A", "Nairobi", 500, owner1.address);
      const prop = await registry.getProperty(1n);
      expect(prop.title).to.equal("Lot A");
      expect(prop.location).to.equal("Nairobi");
      expect(prop.area).to.equal(500n);
      expect(prop.currentOwner).to.equal(owner1.address);
    });

    it("reverts when called by non-admin", async function () {
      await expect(
        registry.connect(stranger).registerProperty("Lot A", "Nairobi", 500, owner1.address)
      ).to.be.revertedWith("LandRegistry: caller is not admin");
    });
  });

  // ── transferOwnership ──────────────────────────────────────────────────────

  describe("transferOwnership", function () {
    beforeEach(async function () {
      await registry.registerProperty("Lot A", "Nairobi", 500, owner1.address);
    });

    it("transfers ownership and emits event", async function () {
      await expect(
        registry.transferOwnership(1n, owner1.address, owner2.address, "sale")
      )
        .to.emit(registry, "OwnershipTransferred")
        .withArgs(1n, owner1.address, owner2.address, (ts) => ts > 0n);

      const prop = await registry.getProperty(1n);
      expect(prop.currentOwner).to.equal(owner2.address);
    });

    it("records transfer in history", async function () {
      await registry.transferOwnership(1n, owner1.address, owner2.address, "sale");
      const history = await registry.getTransferHistory(1n);
      expect(history.length).to.equal(1);
      expect(history[0].from).to.equal(owner1.address);
      expect(history[0].to).to.equal(owner2.address);
      expect(history[0].note).to.equal("sale");
    });

    it("reverts if 'from' is not current owner", async function () {
      await expect(
        registry.transferOwnership(1n, owner2.address, owner1.address, "")
      ).to.be.revertedWith("LandRegistry: 'from' is not current owner");
    });

    it("reverts on transfer to zero address", async function () {
      await expect(
        registry.transferOwnership(1n, owner1.address, ethers.ZeroAddress, "")
      ).to.be.revertedWith("LandRegistry: transfer to zero address");
    });

    it("reverts for non-existent property", async function () {
      await expect(
        registry.transferOwnership(999n, owner1.address, owner2.address, "")
      ).to.be.revertedWith("LandRegistry: property not found");
    });

    it("reverts when called by non-admin", async function () {
      await expect(
        registry.connect(stranger).transferOwnership(1n, owner1.address, owner2.address, "")
      ).to.be.revertedWith("LandRegistry: caller is not admin");
    });
  });

  // ── addDocumentHash ────────────────────────────────────────────────────────

  describe("addDocumentHash", function () {
    const sampleHash = ethers.keccak256(ethers.toUtf8Bytes("sample document content"));

    beforeEach(async function () {
      await registry.registerProperty("Lot A", "Nairobi", 500, owner1.address);
    });

    it("records document hash and emits event", async function () {
      await expect(
        registry.addDocumentHash(1n, sampleHash, "title_deed")
      )
        .to.emit(registry, "DocumentHashRecorded")
        .withArgs(1n, sampleHash, "title_deed", (ts) => ts > 0n);

      const docs = await registry.getDocuments(1n);
      expect(docs.length).to.equal(1);
      expect(docs[0].docHash).to.equal(sampleHash);
      expect(docs[0].docType).to.equal("title_deed");
    });

    it("reverts for non-existent property", async function () {
      await expect(
        registry.addDocumentHash(999n, sampleHash, "title_deed")
      ).to.be.revertedWith("LandRegistry: property not found");
    });
  });

  // ── getPropertiesByOwner ───────────────────────────────────────────────────

  describe("getPropertiesByOwner", function () {
    it("returns all properties for an owner after registration and transfer", async function () {
      await registry.registerProperty("Lot A", "Nairobi", 500, owner1.address);
      await registry.registerProperty("Lot B", "Mombasa", 300, owner1.address);
      await registry.transferOwnership(1n, owner1.address, owner2.address, "sold");

      const owner2Props = await registry.getPropertiesByOwner(owner2.address);
      expect(owner2Props.map(Number)).to.include(1);
    });
  });
});
