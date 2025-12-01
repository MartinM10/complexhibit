# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of Complexhibit / OntoExhibit seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please do NOT:

- Open a public GitHub issue
- Disclose the vulnerability publicly before it has been addressed

### Please DO:

1. **Email us directly** at: [martinjs@uma.es]
2. **Include the following information**:
   - Type of vulnerability
   - Full paths of source file(s) related to the vulnerability
   - Location of the affected source code (tag/branch/commit or direct URL)
   - Step-by-step instructions to reproduce the issue
   - Proof-of-concept or exploit code (if possible)
   - Impact of the vulnerability

## Security Best Practices

### General
- **Secrets**: Never commit `.env` files or secrets to the repository.
- **Updates**: Keep dependencies up to date.

### Backend
- **Injection**: Ensure all SPARQL queries are parameterized to prevent injection attacks.
- **Auth**: Use JWT tokens for protected endpoints.

### Frontend
- **XSS**: Next.js handles most XSS protection, but be careful with `dangerouslySetInnerHTML`.
- **Data Exposure**: Do not expose sensitive environment variables with `NEXT_PUBLIC_` prefix unless necessary.

## Contact

For security-related questions or concerns, contact:
- **Email**: martinjs@uma.es
