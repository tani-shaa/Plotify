"""
Document hashing service — computes and verifies SHA-256 hashes of uploaded files.
"""
import hashlib
from pathlib import Path
from typing import Union


def hash_file(file_path: Union[str, Path]) -> str:
    """
    Compute the SHA-256 hash of a file on disk.
    Returns a 64-character lowercase hex string.
    """
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            sha256.update(chunk)
    return sha256.hexdigest()


def hash_bytes(data: bytes) -> str:
    """
    Compute the SHA-256 hash of raw bytes (e.g. from a Flask file stream).
    Returns a 64-character lowercase hex string.
    """
    return hashlib.sha256(data).hexdigest()


def verify_file_against_hash(file_path: Union[str, Path], expected_hash: str) -> bool:
    """
    Return True if the file at *file_path* matches the expected SHA-256 hex string.
    Comparison is case-insensitive.
    """
    actual = hash_file(file_path)
    return actual.lower() == expected_hash.lower()


def verify_bytes_against_hash(data: bytes, expected_hash: str) -> bool:
    """Return True if the raw bytes match the expected SHA-256 hex string."""
    actual = hash_bytes(data)
    return actual.lower() == expected_hash.lower()
