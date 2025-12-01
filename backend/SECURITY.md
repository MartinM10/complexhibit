# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of Complexhibit API seriously. If you believe you have found a security vulnerability, please report it to us as described below.

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

### What to expect:

- **Acknowledgment**: We will acknowledge receipt of your vulnerability report within 48 hours
- **Communication**: We will send you regular updates about our progress
- **Timeline**: We aim to patch critical vulnerabilities within 7 days
- **Credit**: We will credit you in our security advisory (unless you prefer to remain anonymous)

## Security Best Practices

### For Developers

1. **Environment Variables**: Never commit `.env` files or secrets to the repository
2. **Dependencies**: Keep dependencies up to date with `pip-audit` or `safety`
3. **Authentication**: Always use JWT tokens for protected endpoints
4. **Input Validation**: Use Pydantic models for all inputs
5. **SPARQL Injection**: Use parameterized queries, never string concatenation

### For Deployment

1. **HTTPS Only**: Always use HTTPS in production
2. **Secrets Management**: Use proper secret management (e.g., AWS Secrets Manager, HashiCorp Vault)
3. **Docker Security**: 
   - Run containers as non-root user
   - Use official base images
   - Scan images with Trivy or similar tools
4. **Network Security**: 
   - Use firewalls to restrict access
   - Implement rate limiting
   - Use VPCs for database access

### Known Security Considerations

1. **JWT Secret**: The `DJANGO_SECRET_KEY` must be kept secure and rotated regularly
2. **SPARQL Endpoint**: Should be behind authentication and not publicly accessible
3. **CORS**: Configure `allow_origins` appropriately for production (not `["*"]`)

## Security Updates

Security updates will be released as patch versions (e.g., 1.0.1, 1.0.2) and documented in:
- [CHANGELOG.md](CHANGELOG.md)
- [GitHub Security Advisories](https://github.com/MartinM10/ontoexhibit-api/security/advisories)
- [GitHub Releases](https://github.com/MartinM10/ontoexhibit-api/releases)

## Automated Security Scanning

This project uses:
- **Dependabot**: Automated dependency updates
- **Trivy**: Container vulnerability scanning
- **GitHub CodeQL**: Code security analysis
- **Safety**: Python dependency vulnerability checking

## Compliance

This project follows:
- OWASP Top 10 security practices
- CWE (Common Weakness Enumeration) guidelines
- Secure coding standards for Python

## Contact

For security-related questions or concerns, contact:
- **Email**: martinjs@uma.es

---

**Last Updated**: 2025-11-26
