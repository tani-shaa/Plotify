// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title LandRegistry
 * @notice Tamper-evident land ownership and document registry for Plotify.
 *         All ownership history and document hashes are stored on-chain and
 *         cannot be altered once written.
 */
contract LandRegistry {
    // ─── Structs ──────────────────────────────────────────────────────────────

    struct Property {
        uint256 id;
        string  title;
        string  location;
        uint256 area;           // in square metres
        address currentOwner;
        uint256 registeredAt;
        bool    exists;
    }

    struct Transfer {
        uint256 propertyId;
        address from;
        address to;
        uint256 timestamp;
        string  note;
    }

    struct Document {
        uint256 propertyId;
        bytes32 docHash;        // SHA-256 hash of the uploaded file
        uint256 timestamp;
        string  docType;        // e.g. "title_deed", "survey_map"
    }

    // ─── State ────────────────────────────────────────────────────────────────

    address public admin;
    uint256 private _propertyCounter;

    mapping(uint256 => Property)   public properties;
    mapping(uint256 => Transfer[]) public transferHistory;
    mapping(uint256 => Document[]) public documents;

    // index: wallet → list of property IDs owned
    mapping(address => uint256[]) private _ownerProperties;

    // ─── Events ───────────────────────────────────────────────────────────────

    event PropertyRegistered(
        uint256 indexed propertyId,
        address indexed owner,
        string  title,
        uint256 timestamp
    );

    event OwnershipTransferred(
        uint256 indexed propertyId,
        address indexed from,
        address indexed to,
        uint256 timestamp
    );

    event DocumentHashRecorded(
        uint256 indexed propertyId,
        bytes32 docHash,
        string  docType,
        uint256 timestamp
    );

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyAdmin() {
        require(msg.sender == admin, "LandRegistry: caller is not admin");
        _;
    }

    modifier propertyExists(uint256 propertyId) {
        require(properties[propertyId].exists, "LandRegistry: property not found");
        _;
    }

    modifier onlyOwner(uint256 propertyId) {
        require(
            properties[propertyId].currentOwner == msg.sender,
            "LandRegistry: caller is not the property owner"
        );
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor() {
        admin = msg.sender;
        _propertyCounter = 0;
    }

    // ─── Write Functions ──────────────────────────────────────────────────────

    /**
     * @notice Register a new property. Only the admin (backend wallet) may call this.
     * @param  title    Human-readable property title
     * @param  location Textual location description
     * @param  area     Area in square metres
     * @param  owner    Initial owner wallet address
     * @return propertyId  The newly assigned property ID
     */
    function registerProperty(
        string  calldata title,
        string  calldata location,
        uint256 area,
        address owner
    ) external onlyAdmin returns (uint256 propertyId) {
        _propertyCounter++;
        propertyId = _propertyCounter;

        properties[propertyId] = Property({
            id:           propertyId,
            title:        title,
            location:     location,
            area:         area,
            currentOwner: owner,
            registeredAt: block.timestamp,
            exists:       true
        });

        _ownerProperties[owner].push(propertyId);

        emit PropertyRegistered(propertyId, owner, title, block.timestamp);
    }

    /**
     * @notice Transfer ownership of a property. Only the admin may call this on
     *         behalf of the current owner (off-chain approval has already been done).
     * @param  propertyId  ID of the property to transfer
     * @param  from        Current owner wallet address
     * @param  to          New owner wallet address
     * @param  note        Optional free-text note (e.g. sale price)
     */
    function transferOwnership(
        uint256 propertyId,
        address from,
        address to,
        string  calldata note
    ) external onlyAdmin propertyExists(propertyId) {
        Property storage prop = properties[propertyId];
        require(prop.currentOwner == from, "LandRegistry: 'from' is not current owner");
        require(to != address(0), "LandRegistry: transfer to zero address");

        prop.currentOwner = to;

        transferHistory[propertyId].push(Transfer({
            propertyId: propertyId,
            from:       from,
            to:         to,
            timestamp:  block.timestamp,
            note:       note
        }));

        _ownerProperties[to].push(propertyId);

        emit OwnershipTransferred(propertyId, from, to, block.timestamp);
    }

    /**
     * @notice Anchor a document hash on-chain so future verification is possible.
     * @param  propertyId  The property this document belongs to
     * @param  docHash     SHA-256 hash of the document bytes (as bytes32)
     * @param  docType     Descriptive type string
     */
    function addDocumentHash(
        uint256 propertyId,
        bytes32 docHash,
        string  calldata docType
    ) external onlyAdmin propertyExists(propertyId) {
        documents[propertyId].push(Document({
            propertyId: propertyId,
            docHash:    docHash,
            timestamp:  block.timestamp,
            docType:    docType
        }));

        emit DocumentHashRecorded(propertyId, docHash, docType, block.timestamp);
    }

    // ─── Read Functions ───────────────────────────────────────────────────────

    /**
     * @notice Return basic property data.
     */
    function getProperty(uint256 propertyId)
        external
        view
        propertyExists(propertyId)
        returns (Property memory)
    {
        return properties[propertyId];
    }

    /**
     * @notice Return the complete ownership transfer history for a property.
     */
    function getTransferHistory(uint256 propertyId)
        external
        view
        propertyExists(propertyId)
        returns (Transfer[] memory)
    {
        return transferHistory[propertyId];
    }

    /**
     * @notice Return all document hashes anchored for a property.
     */
    function getDocuments(uint256 propertyId)
        external
        view
        propertyExists(propertyId)
        returns (Document[] memory)
    {
        return documents[propertyId];
    }

    /**
     * @notice Return all property IDs owned by a given wallet.
     */
    function getPropertiesByOwner(address owner)
        external
        view
        returns (uint256[] memory)
    {
        return _ownerProperties[owner];
    }

    /**
     * @notice Return the total number of registered properties.
     */
    function totalProperties() external view returns (uint256) {
        return _propertyCounter;
    }
}
