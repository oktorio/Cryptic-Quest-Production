# Security Policy

## Scope

Cryptic Quest is a static educational web application. It has no backend, user accounts, or secret server-side configuration.

## Reporting a vulnerability

If this project is published publicly, configure a private GitHub security-reporting channel or security contact for the repository. Avoid posting exploit details publicly before a fix is available.

## Deployment checklist

- Serve the application over HTTPS.
- Keep the supplied Content Security Policy or tighten it further for your host.
- If the hosting platform supports response headers, apply the supplied `_headers` policies.
- Enable GitHub branch protection and require the quality-check workflow before merging changes.
- Review dependency changes carefully if runtime dependencies are introduced later; the current release has none.
- Update the service-worker cache version when shipping changed app-shell assets if you materially change the caching strategy.
- Test PWA installation/offline behavior after changing manifest paths or deployment base paths.

## Cryptographic warning

The application contains deliberately small and insecure cryptographic examples for teaching. Do not copy toy RSA parameters, classical ciphers, repeated XOR examples, or hand-built demonstrations into production security systems.

Production systems should use maintained cryptographic libraries, current standards, appropriate key sizes, authenticated constructions, secure randomness, correct nonce/key lifecycle, and robust key management.

## Content Security Policy

`index.html` includes a CSP that blocks remote scripts, remote connections, plugins, and non-self application resources. Inline CSS is permitted because the interactive UI uses dynamically calculated visual positions and widths. JavaScript remains restricted to same-origin files.

GitHub Pages does not provide arbitrary repository-defined response headers. Hosts that implement a `_headers` convention can apply the additional headers in that file.
