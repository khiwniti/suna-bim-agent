# Cloudflare Configuration via CLI

This guide helps you configure Cloudflare security settings to allow access to `carbon-bim.ensimu.space` without being blocked.

## Prerequisites

1. **Cloudflare API Token** with `Zone:Edit` permissions
   - Get it here: https://dash.cloudflare.com/profile/api-tokens
   - Create Token → Use template "Edit zone DNS" or custom with `Zone:Edit` permission

2. **Zone ID** for `ensimu.space`
   - Find it in: Cloudflare Dashboard → ensimu.space → Overview (right sidebar under "API")

## Quick Setup

### Option 1: Automated Script (Recommended)

```bash
# Set your credentials
export CF_API_TOKEN="your-cloudflare-api-token"
export CF_ZONE_ID="your-zone-id"

# Run the configuration script
bash /tmp/cloudflare_setup.sh
```

### Option 2: Manual Configuration via API

#### 1. Disable Bot Fight Mode
```bash
export CF_API_TOKEN="your-token"
export CF_ZONE_ID="your-zone-id"

# Check current bot settings
curl -X GET "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/bot_management" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json"
```

#### 2. Lower Security Level
```bash
# Set security to "essentially_off" for development
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/settings/security_level" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"value":"essentially_off"}'

# Available values: "off", "essentially_off", "low", "medium", "high", "under_attack"
```

#### 3. Check WAF Rules
```bash
# List all firewall rules
curl -X GET "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/firewall/rules" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" | jq .
```

#### 4. Whitelist Your IP (Optional)
```bash
# Get your current IP
MY_IP=$(curl -s https://api.ipify.org)

# Create IP whitelist rule
curl -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/firewall/rules" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "action": "allow",
    "priority": 1,
    "description": "Allow my development IP",
    "filter": {
      "expression": "ip.src eq '"$MY_IP"'",
      "description": "Development IP whitelist"
    }
  }'
```

## Troubleshooting

### Still Getting Blocked?

1. **Check Cloudflare Security Events**
   ```bash
   # View recent security events
   curl -X GET "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/security/events" \
     -H "Authorization: Bearer $CF_API_TOKEN" \
     -H "Content-Type: application/json" | jq '.result[0:5]'
   ```

2. **Verify DNS Settings**
   ```bash
   # Check DNS records
   curl -X GET "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records" \
     -H "Authorization: Bearer $CF_API_TOKEN" \
     -H "Content-Type: application/json" | jq '.result[] | {name, type, content, proxied}'
   ```

3. **Test Direct Access** (Bypass Cloudflare)
   ```bash
   # Access Azure VM directly
   curl http://20.55.21.69
   ```

4. **Clear Browser State**
   - Clear cookies for `ensimu.space`
   - Clear browser cache
   - Try in incognito/private mode

### Common Issues

#### "API Token Invalid"
- Verify token has `Zone:Edit` permission
- Check token hasn't expired
- Ensure you're using the correct Zone ID

#### "Still Getting Challenged"
- Wait 5 minutes for settings to propagate globally
- Try accessing from different browser/device
- Check if Bot Fight Mode is truly disabled (Free plan may have limitations)

#### "403 Forbidden"
- Check WAF rules aren't blocking legitimate traffic
- Verify Rate Limiting rules
- Review Security Events for specific block reasons

## Production Recommendations

For production environments, instead of disabling security:

1. **Use Cloudflare Access** for admin/internal tools
2. **Configure custom WAF rules** for legitimate traffic patterns
3. **Enable Rate Limiting** with appropriate thresholds
4. **Use Cloudflare Waiting Room** for high-traffic scenarios
5. **Keep Bot Fight Mode** but whitelist known good bots

## Additional Resources

- [Cloudflare API Docs](https://developers.cloudflare.com/api/)
- [Security Settings](https://developers.cloudflare.com/waf/)
- [Bot Management](https://developers.cloudflare.com/bots/)
- [Firewall Rules](https://developers.cloudflare.com/firewall/)

## Support

If you continue experiencing issues:
1. Check Cloudflare Status: https://www.cloudflarestatus.com/
2. Review Security Events in Dashboard
3. Contact Cloudflare Support with Ray ID from block page
