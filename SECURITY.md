# Security Policy

## Secrets Management

This project uses automated secrets scanning to prevent accidental exposure of sensitive credentials.

### Policy

- **NEVER** commit real API keys, passwords, or tokens to version control
- Use environment variables for all sensitive configuration
- Keep `.env.example` as a template with placeholder values only
- Use actual secrets in `.env.local` or `.env` (both gitignored)

### Local Development

1. **Setup pre-commit hooks** (required for all contributors):
   ```bash
   # Install pre-commit
   pip install pre-commit

   # Install git hooks
   pre-commit install

   # Test it works
   pre-commit run --all-files
   ```

2. **Environment files**:
   - `.env.example` - Template with placeholders (committed to repo)
   - `.env` or `.env.local` - Real secrets (gitignored, NEVER commit)
   - Copy `.env.example` to `.env` and fill in real values

3. **Pre-commit will block commits** containing secrets:
   ```bash
   $ git commit -m "Add feature"
   detect-secrets...............................................................Failed
   - hook id: detect-secrets
   - exit code: 1
   ```

### CI/CD Secrets

All CI/CD secrets (GitHub Actions, deployment pipelines) are stored in:
- **GitHub Repository Secrets** for CI/CD workflows
- **Vercel Environment Variables** for deployment secrets
- **Azure Key Vault** (production) for infrastructure secrets

Never log secrets or include them in error messages.

### Secrets Baseline

The `.secrets.baseline` file contains audited detection results:
- All entries are known false positives (template values, test data)
- Baseline is regenerated and audited when adding legitimate high-entropy strings
- Run `detect-secrets scan > .secrets.baseline` to update
- Run `detect-secrets audit .secrets.baseline` to review detections

### What Gets Scanned

Pre-commit and CI scan all git-tracked files for:
- API keys (OpenAI, Anthropic, AWS, Azure, GCP)
- Authentication tokens (JWT, OAuth, GitHub)
- Database credentials (passwords, connection strings)
- Private keys (SSH, TLS, signing keys)
- High-entropy strings (base64, hex)

Excluded from scanning:
- `*.lock` files (package-lock.json, pnpm-lock.yaml)
- Minified files (*.min.js, *.min.css)
- Test fixtures with intentional fake secrets (marked in baseline)

### Incident Response

**If secrets are accidentally committed:**

1. **Immediately rotate the exposed secret**:
   - Generate new API key/token
   - Update environment variables in all environments
   - Revoke old secret in provider dashboard

2. **Remove from git history**:
   ```bash
   # WARNING: This rewrites history - coordinate with team
   git filter-branch --force --index-filter \
     'git rm --cached --ignore-unmatch path/to/secret/file' \
     --prune-empty --tag-name-filter cat -- --all

   # Force push (requires coordination)
   git push origin --force --all
   ```

3. **Update baseline**:
   ```bash
   detect-secrets scan > .secrets.baseline
   git add .secrets.baseline
   git commit -m "chore: update secrets baseline after incident"
   ```

4. **Document incident**:
   - Record what was exposed and for how long
   - Confirm secret was rotated
   - Review access logs for unauthorized usage

### Reporting Security Issues

**DO NOT** open public GitHub issues for security vulnerabilities.

Instead, email security concerns to: [your-security-email@domain.com]

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will respond within 48 hours and work with you on a fix.

## Additional Security Practices

### Code Review
- All PRs require review before merge
- Security-sensitive changes require senior review
- CI must pass (including secrets scanning)

### Dependencies
- Run `uv update` regularly to get security patches
- Monitor GitHub Dependabot alerts
- Review dependency changes in PRs

### Access Control
- Follow principle of least privilege
- Rotate credentials every 90 days
- Use service accounts for automation
- Enable MFA on all critical accounts

### Data Protection
- Never log sensitive user data
- Sanitize inputs to prevent injection attacks
- Use parameterized queries (no string concatenation)
- Encrypt sensitive data at rest and in transit
