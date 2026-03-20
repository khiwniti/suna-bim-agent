# Task 6: Secrets Scanning Implementation Spec

## Overview
Implement automated secrets detection using detect-secrets to prevent committing hardcoded credentials to the repository.

## Scope
- Install and configure detect-secrets
- Add pre-commit hook for local protection
- Add GitHub Actions check for CI/CD enforcement
- Create and audit secrets baseline
- Document secrets policy

## Implementation Details

### 1. detect-secrets Installation
**Location**: Project root
**Tool**: detect-secrets Python package

**Steps**:
1. Install detect-secrets (development dependency)
2. Run initial scan to create baseline
3. Audit baseline for false positives

**Commands**:
```bash
# Install (add to backend dev dependencies)
cd backend
uv add --dev detect-secrets

# Create baseline
detect-secrets scan --all-files > ../.secrets.baseline

# Audit baseline
detect-secrets audit .secrets.baseline
```

### 2. Pre-commit Hook Configuration
**File**: `.pre-commit-config.yaml` (create if doesn't exist)

**Requirements**:
- Use detect-secrets pre-commit hook
- Check against baseline
- Fail commit if secrets detected
- Allow override with explicit commit message flag (for emergencies)

**Expected Configuration**:
```yaml
repos:
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0  # Use latest stable version
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
        exclude: package.lock.json
```

**Additional pre-commit setup**:
- Python version compatibility: >=3.8
- Install instructions in documentation

### 3. GitHub Actions CI Check
**File**: `.github/workflows/test.yml` (modify existing or create)

**Requirements**:
- Add secrets scanning step to CI pipeline
- Fail build if secrets detected
- Run on pull requests and main branch commits
- Use same baseline as pre-commit

**Expected Job Addition**:
```yaml
  secrets-scan:
    name: Scan for secrets
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: Install detect-secrets
        run: pip install detect-secrets
      - name: Scan for secrets
        run: detect-secrets scan --baseline .secrets.baseline
```

### 4. Secrets Baseline Creation
**File**: `.secrets.baseline` (root directory)

**Requirements**:
- Initial scan includes all files (--all-files)
- Audit false positives
- Document audit rationale in baseline
- Commit audited baseline

**Auditing Process**:
1. Run: `detect-secrets audit .secrets.baseline`
2. For each finding:
   - If false positive: mark as allowed
   - If real secret: remove and rotate
   - If test fixture: mark as allowed with comment
3. Re-scan after fixes: `detect-secrets scan --baseline .secrets.baseline`

**Expected False Positives to Audit**:
- Example API keys in documentation
- Test fixtures with fake credentials
- Hash values that look like secrets
- `.env.example` template values

### 5. Secrets Policy Documentation
**File**: `SECURITY.md` (create in root)

**Required Sections**:
1. **Secrets Management Policy**
   - Never commit real secrets
   - Use `.env.local` for local development
   - Use GitHub secrets for CI/CD
   - Use environment variables in production

2. **Local Development**
   - Copy `.env.example` to `.env.local`
   - Fill in real credentials in `.env.local`
   - Never commit `.env.local` (gitignored)

3. **CI/CD Secrets**
   - Use GitHub repository secrets
   - Document which secrets are needed
   - Rotate secrets regularly

4. **Pre-commit Hook Setup**
   - Install pre-commit: `pip install pre-commit`
   - Install hooks: `pre-commit install`
   - Run manually: `pre-commit run --all-files`

5. **If Secrets Are Committed**
   - Immediately rotate affected credentials
   - Use `git filter-branch` or BFG to remove from history
   - Contact security team

6. **Reporting Security Issues**
   - Email: security@example.com (update with real contact)
   - Expected response time
   - Responsible disclosure policy

## Files to Create/Modify

### New Files
1. `.pre-commit-config.yaml` - Pre-commit hook configuration
2. `.secrets.baseline` - Audited secrets baseline
3. `SECURITY.md` - Security policy and secrets management

### Modified Files
1. `backend/pyproject.toml` - Add detect-secrets to dev dependencies
2. `.github/workflows/test.yml` - Add secrets scanning job
3. `CLAUDE.md` - Add pre-commit setup to development guide

## Testing Strategy

### Manual Testing
1. **Test Pre-commit Hook**
   ```bash
   # Try to commit a file with fake secret
   echo "api_key = 'sk-1234567890abcdef'" > test_secret.txt
   git add test_secret.txt
   git commit -m "test"  # Should fail
   rm test_secret.txt
   ```

2. **Test Baseline Updates**
   ```bash
   # Add legitimate test fixture
   # Update baseline
   detect-secrets scan --baseline .secrets.baseline
   # Commit should succeed
   ```

3. **Test CI Check**
   - Create PR with intentional secret
   - Verify CI fails
   - Remove secret
   - Verify CI passes

### Automated Testing
Create `backend/tests/test_security.py`:
```python
"""Tests for security measures."""
import subprocess
from pathlib import Path

def test_secrets_baseline_exists():
    """Verify secrets baseline file exists."""
    baseline = Path(__file__).parent.parent.parent / ".secrets.baseline"
    assert baseline.exists(), "Secrets baseline not found"

def test_secrets_scan_passes():
    """Verify current codebase passes secrets scan."""
    result = subprocess.run(
        ["detect-secrets", "scan", "--baseline", ".secrets.baseline"],
        capture_output=True,
        cwd=Path(__file__).parent.parent.parent
    )
    assert result.returncode == 0, "Secrets scan detected issues"

def test_precommit_config_exists():
    """Verify pre-commit configuration exists."""
    config = Path(__file__).parent.parent.parent / ".pre-commit-config.yaml"
    assert config.exists(), "Pre-commit config not found"

def test_security_policy_exists():
    """Verify security policy documentation exists."""
    security_md = Path(__file__).parent.parent.parent / "SECURITY.md"
    assert security_md.exists(), "SECURITY.md not found"
```

## Success Criteria

✅ **Configuration**
- [ ] detect-secrets installed as dev dependency
- [ ] .pre-commit-config.yaml created with detect-secrets hook
- [ ] .secrets.baseline created and audited
- [ ] SECURITY.md documents secrets policy

✅ **Functionality**
- [ ] Pre-commit hook blocks commits with secrets
- [ ] CI/CD pipeline includes secrets scanning
- [ ] Baseline allows legitimate test fixtures
- [ ] All current code passes secrets scan

✅ **Documentation**
- [ ] CLAUDE.md includes pre-commit setup instructions
- [ ] SECURITY.md clearly explains secrets management
- [ ] False positives documented in baseline

✅ **Testing**
- [ ] Manual testing verifies pre-commit hook works
- [ ] Automated tests in test_security.py pass
- [ ] CI test workflow includes secrets scanning

## Rollback Plan
If secrets scanning causes issues:
1. Disable pre-commit hook: `pre-commit uninstall`
2. Temporarily skip CI check (add skip flag)
3. Debug baseline issues
4. Re-enable after fixes

## Dependencies
- detect-secrets >= 1.4.0
- pre-commit (local development only)
- Python >= 3.8
- GitHub Actions (for CI)

## Estimated Time
- Implementation: 20 minutes
- Baseline auditing: 10 minutes
- Testing: 10 minutes
- Documentation: 10 minutes
- **Total**: ~50 minutes

## Notes
- Baseline should be committed to git
- False positives are expected and normal
- Regular baseline updates needed as code evolves
- Consider adding secrets rotation policy later
- May want to add additional secret types to scan (API keys, tokens, passwords)
