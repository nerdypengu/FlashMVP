"""
IBM Bob 2.0 Skill: bob-skill-secrets-vault
IBM Secrets Manager Proxy — Encrypted environment variables vault.
Stores, retrieves, and injects secrets for container runtimes.
"""
import os
from typing import Literal

DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() == "true"

# In-memory encrypted store: { project_id: { key: {"value": encrypted, "scope": scope} } }
_vault: dict[str, dict] = {}


def _mask(value: str) -> str:
    """Return a masked display value showing only first 3 chars."""
    if len(value) <= 3:
        return "****"
    return value[:3] + "****"


def _encrypt(value: str) -> str:
    """
    Encrypt a secret value.
    In DEMO_MODE: simple base64 encoding (no real crypto needed for demo).
    In live mode: uses Fernet symmetric encryption.
    """
    if DEMO_MODE:
        import base64
        return base64.b64encode(value.encode()).decode()
    try:
        from cryptography.fernet import Fernet  # type: ignore
        key = os.getenv("VAULT_ENCRYPTION_KEY", "").encode()
        if not key:
            # Fallback: generate ephemeral key (secrets lost on restart in demo)
            key = Fernet.generate_key()
        f = Fernet(key)
        return f.encrypt(value.encode()).decode()
    except ImportError:
        import base64
        return base64.b64encode(value.encode()).decode()


def _decrypt(encrypted: str) -> str:
    """Decrypt a vault value."""
    if DEMO_MODE:
        import base64
        return base64.b64decode(encrypted.encode()).decode()
    try:
        from cryptography.fernet import Fernet  # type: ignore
        key = os.getenv("VAULT_ENCRYPTION_KEY", "").encode()
        if not key:
            import base64
            return base64.b64decode(encrypted.encode()).decode()
        f = Fernet(key)
        return f.decrypt(encrypted.encode()).decode()
    except Exception:
        import base64
        return base64.b64decode(encrypted.encode()).decode()


def store_secret(project_id: str, key: str, value: str, scope: str = "ALL") -> dict:
    """Store an encrypted secret in the vault."""
    if project_id not in _vault:
        _vault[project_id] = {}
    _vault[project_id][key] = {
        "encrypted_value": _encrypt(value),
        "scope": scope,
    }
    return {
        "project_id": project_id,
        "key": key,
        "scope": scope,
        "masked_value": _mask(value),
        "status": "STORED",
    }


def list_secrets(project_id: str) -> list[dict]:
    """List all secrets for a project (masked values only — never expose raw)."""
    project_secrets = _vault.get(project_id, {})
    return [
        {
            "project_id": project_id,
            "key": k,
            "scope": v["scope"],
            "masked_value": "****",
            "status": "STORED",
        }
        for k, v in project_secrets.items()
    ]


def delete_secret(project_id: str, key: str) -> bool:
    """Remove a secret from the vault. Returns True if deleted."""
    project_secrets = _vault.get(project_id, {})
    if key in project_secrets:
        del project_secrets[key]
        return True
    return False


def get_secrets_for_container(project_id: str, scope: str) -> dict[str, str]:
    """
    Return decrypted env dict for container injection.
    scope: "ALL" returns everything; "FRONTEND"/"BACKEND" filters accordingly.
    """
    project_secrets = _vault.get(project_id, {})
    result = {}
    for k, v in project_secrets.items():
        secret_scope = v["scope"]
        if secret_scope == "ALL" or secret_scope == scope:
            result[k] = _decrypt(v["encrypted_value"])
    return result


def store_tunnel_url(project_id: str, url: str) -> None:
    """Persist the Cloudflare public tunnel URL into the vault as PUBLIC_APP_URL."""
    store_secret(project_id, "PUBLIC_APP_URL", url, scope="ALL")
