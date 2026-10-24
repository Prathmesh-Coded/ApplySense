from threading import Lock
from time import monotonic

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.config import settings

bearer_scheme = HTTPBearer(auto_error=False)
JWKS_CACHE_SECONDS = 600
_jwks_cache: dict | None = None
_jwks_cached_at = 0.0
_jwks_lock = Lock()


def _get_jwks() -> dict:
    global _jwks_cache, _jwks_cached_at
    with _jwks_lock:
        if _jwks_cache and monotonic() - _jwks_cached_at < JWKS_CACHE_SECONDS:
            return _jwks_cache

        url = settings.supabase_jwks_url or (
            f"{settings.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
        )
        try:
            response = httpx.get(url, timeout=5.0)
            response.raise_for_status()
            keys = response.json()
            if not isinstance(keys, dict) or not isinstance(keys.get("keys"), list):
                raise ValueError("Invalid JWKS response")
        except (httpx.HTTPError, ValueError) as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Unable to retrieve Supabase signing keys",
            ) from exc

        _jwks_cache = keys
        _jwks_cached_at = monotonic()
        return keys


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> str:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    try:
        header = jwt.get_unverified_header(token)
        algorithm = header.get("alg")
        if algorithm == "HS256":
            if not settings.supabase_jwt_secret:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Legacy Supabase JWT verification is not configured",
                )
            key = settings.supabase_jwt_secret
        elif algorithm in {"ES256", "ES384", "ES512", "RS256", "RS384", "RS512"}:
            kid = header.get("kid")
            key = next(
                (item for item in _get_jwks()["keys"] if item.get("kid") == kid),
                None,
            )
            if key is None:
                raise JWTError("No matching signing key")
        else:
            raise JWTError("Unsupported token signing algorithm")

        payload = jwt.decode(
            token,
            key,
            algorithms=[algorithm],
            audience="authenticated",
            options={"require_sub": True, "require_exp": True},
        )
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    return payload["sub"]
