# ADR 0002: Token-Based Authentication via HttpOnly Secure SameSite Cookies

## Status
Accepted

## Context
Storing access and refresh tokens in browser `localStorage` or `sessionStorage` exposes web applications to Stored and DOM-based Cross-Site Scripting (XSS) attacks, enabling malicious scripts to exfiltrate session tokens. Furthermore, stateless bearer tokens lack immediate server-side revocation during user logout or session termination.

## Decision
1. **HttpOnly, Secure, SameSite Cookie Transport**:
   - Access tokens (15-minute lifetime) and refresh tokens (7-day lifetime) are delivered strictly via `Set-Cookie` with `HttpOnly=True`, `Secure=True` (in production/HTTPS), and `SameSite=Lax`.
   - Browser JavaScript cannot access or exfiltrate credentials via `document.cookie` or XSS vectors.
2. **Double-Submit CSRF Protection**:
   - Mutating state requests (`POST`, `PUT`, `PATCH`, `DELETE`) require a cryptographic CSRF token transmitted in custom header `X-CSRF-Token`, matched against the secure CSRF cookie.
3. **Cryptographic Refresh Token Rotation & Revocation**:
   - Every refresh request generates a fresh access token and rotates the refresh token.
   - User logouts permanently invalidate the refresh family in the database session store, blocking replay attacks.
4. **Fail-Closed Configuration Validation**:
   - Application startup validates that `SECRET_KEY` is not default or weak in production, preventing token forging.
   - Demo account auto-seeding is gated by `DEMO_ACCOUNT_ENABLED` and strictly disabled when `ENV=production`.

## Consequences
- **Positive**: Immune to JavaScript token theft via XSS, robust defense against CSRF, instantaneous revocation on logout.
- **Negative**: API testing and curl scripts require handling cookie jars and CSRF headers.

