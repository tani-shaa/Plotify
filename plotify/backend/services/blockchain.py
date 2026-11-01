"""
Blockchain service — wraps Web3.py calls to the LandRegistry smart contract.

Usage:
    from services.blockchain import BlockchainService
    bc = BlockchainService.from_app(current_app)
    tx_hash, contract_id = bc.register_property(...)
"""
import json
import os
from pathlib import Path
from typing import Tuple, List, Dict, Any

from web3 import Web3
try:
    # web3 >= 7
    from web3.middleware import ExtraDataToPOAMiddleware
except ImportError:
    # web3 6.x fallback
    from web3.middleware import geth_poa_middleware as ExtraDataToPOAMiddleware


_ARTIFACT_PATH = Path(__file__).parent.parent / "blockchain_artifacts" / "LandRegistry.json"


class BlockchainService:
    def __init__(self, rpc_url: str, contract_address: str, private_key: str):
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))
        # Required for Hardhat / PoA chains
        self.w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)

        if not self.w3.is_connected():
            raise ConnectionError(f"Cannot connect to blockchain node at {rpc_url}")

        self.account = self.w3.eth.account.from_key(private_key)

        # Load ABI + address from the artifact written by deploy.js
        if _ARTIFACT_PATH.exists():
            with open(_ARTIFACT_PATH) as f:
                artifact = json.load(f)
            abi = artifact["abi"]
            # CLI-supplied address takes precedence over artifact address
            addr = contract_address or artifact.get("address", "")
        else:
            raise FileNotFoundError(
                f"Blockchain artifact not found at {_ARTIFACT_PATH}. "
                "Run: cd blockchain && npm run deploy:local"
            )

        self.contract = self.w3.eth.contract(
            address=Web3.to_checksum_address(addr),
            abi=abi,
        )

    @classmethod
    def from_app(cls, app) -> "BlockchainService":
        return cls(
            rpc_url=app.config["BLOCKCHAIN_RPC_URL"],
            contract_address=app.config["CONTRACT_ADDRESS"],
            private_key=app.config["ADMIN_PRIVATE_KEY"],
        )

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _send_tx(self, fn) -> str:
        """Build, sign, and send a contract transaction. Returns the tx hash."""
        tx = fn.build_transaction({
            "from":  self.account.address,
            "nonce": self.w3.eth.get_transaction_count(self.account.address),
            "gas":   500_000,
        })
        signed = self.w3.eth.account.sign_transaction(tx, self.account.key)
        # web3 v6 uses .rawTransaction, v7/v8 uses .raw_transaction
        raw = getattr(signed, "raw_transaction", None) or getattr(signed, "rawTransaction", None)
        tx_hash = self.w3.eth.send_raw_transaction(raw)
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
        if receipt.status != 1:
            raise RuntimeError("Transaction reverted")
        return tx_hash.hex()

    # ── Write functions ───────────────────────────────────────────────────────

    def register_property(
        self, title: str, location: str, area: int, owner_address: str
    ) -> Tuple[str, int]:
        """
        Register a property on-chain.
        Returns (tx_hash, contract_property_id).
        """
        owner = Web3.to_checksum_address(owner_address)
        fn = self.contract.functions.registerProperty(title, location, area, owner)
        tx_hash = self._send_tx(fn)

        # Read the newly assigned ID from the contract state
        total = self.contract.functions.totalProperties().call()
        return tx_hash, total

    def transfer_ownership(
        self,
        contract_property_id: int,
        from_address: str,
        to_address: str,
        note: str = "",
    ) -> str:
        """Transfer ownership on-chain. Returns tx_hash."""
        fn = self.contract.functions.transferOwnership(
            contract_property_id,
            Web3.to_checksum_address(from_address),
            Web3.to_checksum_address(to_address),
            note,
        )
        return self._send_tx(fn)

    def add_document_hash(
        self,
        contract_property_id: int,
        sha256_hex: str,
        doc_type: str,
    ) -> str:
        """Anchor a document hash on-chain. Returns tx_hash."""
        # Convert 64-char hex string to bytes32
        doc_hash_bytes = bytes.fromhex(sha256_hex)
        fn = self.contract.functions.addDocumentHash(
            contract_property_id,
            doc_hash_bytes,
            doc_type,
        )
        return self._send_tx(fn)

    # ── Read functions ────────────────────────────────────────────────────────

    def get_property(self, contract_property_id: int) -> Dict[str, Any]:
        prop = self.contract.functions.getProperty(contract_property_id).call()
        return {
            "id":           prop[0],
            "title":        prop[1],
            "location":     prop[2],
            "area":         prop[3],
            "currentOwner": prop[4],
            "registeredAt": prop[5],
        }

    def get_transfer_history(self, contract_property_id: int) -> List[Dict[str, Any]]:
        history = self.contract.functions.getTransferHistory(contract_property_id).call()
        return [
            {
                "propertyId": h[0],
                "from":       h[1],
                "to":         h[2],
                "timestamp":  h[3],
                "note":       h[4],
            }
            for h in history
        ]

    def get_documents(self, contract_property_id: int) -> List[Dict[str, Any]]:
        docs = self.contract.functions.getDocuments(contract_property_id).call()
        return [
            {
                "propertyId": d[0],
                "docHash":    d[1].hex(),
                "timestamp":  d[2],
                "docType":    d[3],
            }
            for d in docs
        ]

    def is_connected(self) -> bool:
        return self.w3.is_connected()
