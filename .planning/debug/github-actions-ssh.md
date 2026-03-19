# Debug: GitHub Actions SSH Deployment Failure

**Issue ID:** github-actions-ssh
**Status:** IN_PROGRESS  
**Created:** 2026-03-18

## Symptoms

From GitHub Actions log:
```
ssh.ParsePrivateKey: ssh: no key found
dial tcp ***:22: connect: connection timed out
Error: Process completed with exit code 1
```

## Root Cause Analysis

### Error 1: `ssh: no key found`
**The SSH private key secret (`AZURE_VM_SSH_KEY`) is not being parsed correctly.**

Common causes:
1. **Empty secret** - Secret not set or empty value
2. **Wrong format** - Missing `-----BEGIN OPENSSH PRIVATE KEY-----` header
3. **Extra whitespace** - Trailing newlines or spaces corrupting the key
4. **Wrong key type** - Using public key instead of private key

### Error 2: `connection timed out`  
**Secondary effect** - appleboy/ssh-action falls back to password auth when key fails, then times out.

Also possible:
- Azure VM is stopped/deallocated
- Network Security Group (NSG) doesn't allow port 22 from GitHub Actions IPs
- Firewall blocking connection

## Required Secrets

The workflow expects these GitHub secrets:
- `AZURE_VM_HOST` - VM IP address or hostname
- `AZURE_VM_USERNAME` - SSH username
- `AZURE_VM_SSH_KEY` - **Private** SSH key (PEM format)

## Verification Steps

1. **Check secrets are configured:**
   - Go to: GitHub repo → Settings → Secrets and variables → Actions
   - Verify `AZURE_VM_SSH_KEY` exists and is not empty

2. **Verify SSH key format:**
   The key should look like:
   ```
   -----BEGIN OPENSSH PRIVATE KEY-----
   b3BlbnNzaC1rZXktdjEAAAAABG5vbm...
   ...multiple lines of base64...
   -----END OPENSSH PRIVATE KEY-----
   ```
   OR for older RSA format:
   ```
   -----BEGIN RSA PRIVATE KEY-----
   MIIEpAIBAAKCAQEA...
   -----END RSA PRIVATE KEY-----
   ```

3. **Check VM is running:**
   ```bash
   az vm show -g <resource-group> -n <vm-name> --show-details --query powerState
   ```

4. **Check NSG allows SSH:**
   - Azure Portal → VM → Networking → Inbound port rules
   - Should have rule allowing TCP port 22

## Fix Options

### Option A: Re-add SSH key secret (most likely fix)
1. Generate new SSH key pair if needed:
   ```bash
   ssh-keygen -t ed25519 -C "github-actions-deploy" -f deploy_key
   ```
2. Copy **entire** private key including headers:
   ```bash
   cat deploy_key  # This goes in GitHub secret
   ```
3. Add public key to VM:
   ```bash
   cat deploy_key.pub >> ~/.ssh/authorized_keys
   ```
4. Update GitHub secret `AZURE_VM_SSH_KEY` with private key content

### Option B: Use existing Azure credentials
If you have Azure CLI service principal configured, consider using:
- `azure/login@v1` + Azure CLI instead of SSH
- Or use Azure Container Instances / App Service deployment

