"""
Rate Limiting & Account Lockout Engine for CELESTIA.
Enforces per-endpoint sliding window rate limits and temporary account/IP lockout
on authentication, AI, and upload endpoints.
Returns HTTP 429 Too Many Requests when limits are exceeded.
"""
import time
from typing import Dict, List, Tuple
from fastapi import Request, HTTPException, status

class InMemoryRateLimiter:
    def __init__(self):
        # map key -> list of timestamps
        self._requests: Dict[str, List[float]] = {}
        # map key -> list of failed attempt timestamps
        self._failed_attempts: Dict[str, List[float]] = {}
        # map key -> lockout expiry timestamp
        self._lockouts: Dict[str, float] = {}

    def check_rate_limit(
        self,
        key: str,
        max_requests: int,
        window_seconds: int,
        endpoint_name: str = "endpoint"
    ):
        """Standard sliding-window rate limit."""
        now = time.time()
        
        # Check if currently locked out
        if key in self._lockouts:
            remaining = self._lockouts[key] - now
            if remaining > 0:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Temporary lockout in effect due to excessive requests. Please retry in {int(remaining)} seconds.",
                    headers={"Retry-After": str(max(1, int(remaining)))}
                )
            else:
                del self._lockouts[key]

        timestamps = self._requests.get(key, [])
        # Prune old timestamps
        cutoff = now - window_seconds
        timestamps = [t for t in timestamps if t > cutoff]
        
        if len(timestamps) >= max_requests:
            retry_after = int(window_seconds - (now - timestamps[0])) + 1
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded for {endpoint_name}. Maximum {max_requests} requests per {window_seconds}s.",
                headers={"Retry-After": str(max(1, retry_after))}
            )
            
        timestamps.append(now)
        self._requests[key] = timestamps

    def check_lockout(self, key: str):
        now = time.time()
        if key in self._lockouts:
            remaining = self._lockouts[key] - now
            if remaining > 0:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Account is temporarily locked out due to multiple failed login attempts. Retry in {int(remaining)} seconds.",
                    headers={"Retry-After": str(max(1, int(remaining)))}
                )
            else:
                del self._lockouts[key]

    def record_failed_login(
        self,
        key: str,
        max_failures: int = 5,
        lockout_duration_seconds: int = 900 # 15 minutes
    ):
        """Records a failed authentication attempt and locks out if threshold reached."""
        now = time.time()
        failures = self._failed_attempts.get(key, [])
        cutoff = now - lockout_duration_seconds
        failures = [t for t in failures if t > cutoff]
        failures.append(now)
        self._failed_attempts[key] = failures
        
        if len(failures) >= max_failures:
            self._lockouts[key] = now + lockout_duration_seconds

    def clear_failed_logins(self, key: str):
        """Resets failed attempt count on successful login."""
        self._failed_attempts.pop(key, None)
        self._lockouts.pop(key, None)

    def reset_all(self):
        """Reset internal stores (primarily for test suite isolation)."""
        self._requests.clear()
        self._failed_attempts.clear()
        self._lockouts.clear()

limiter = InMemoryRateLimiter()

def get_client_ip(request: Request) -> str:
    """Extracts client IP address safely, checking X-Forwarded-For if available."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"

def rate_limit_auth(request: Request):
    """Rate limit for login, register, and demo-login: 10 requests / 60 seconds per IP."""
    ip = get_client_ip(request)
    limiter.check_rate_limit(
        key=f"auth:{ip}",
        max_requests=10,
        window_seconds=60,
        endpoint_name="authentication"
    )

def rate_limit_ai(request: Request):
    """Rate limit for AI endpoints: 15 requests / 60 seconds per IP/User."""
    ip = get_client_ip(request)
    auth_header = request.headers.get("Authorization", "")
    key = f"ai:{auth_header[:20] if auth_header else ip}"
    limiter.check_rate_limit(
        key=key,
        max_requests=15,
        window_seconds=60,
        endpoint_name="AI assistance"
    )

def rate_limit_upload(request: Request):
    """Rate limit for upload endpoints: 10 requests / 60 seconds per IP."""
    ip = get_client_ip(request)
    limiter.check_rate_limit(
        key=f"upload:{ip}",
        max_requests=10,
        window_seconds=60,
        endpoint_name="document upload"
    )
