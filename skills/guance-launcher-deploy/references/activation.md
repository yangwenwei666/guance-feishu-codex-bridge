# License Activation

Use launcher API after the install is complete.

## Endpoint

```text
POST http://<launcher-host>:30001/api/v1/setting/activate
Content-Type: application/json
```

Typical launcher endpoint:

```text
http://<server-ip>:30001/api/v1/setting/activate
```

## Required Payload

```json
{
  "ak": "<AK>",
  "sk": "<SK>",
  "dataway_url": "http://<server-ip>:30928?token={}",
  "license": "<base64-license>"
}
```

## Guardrails

- Validate `dataway_url` format carefully.
- Do not introduce an extra slash before the port.
- Good:

```text
http://101.96.195.181:30928?token={}
```

- Bad:

```text
http://101.96.195.181/:30928?token={}
```

## Example Curl

```bash
curl -X POST "http://<server-ip>:30001/api/v1/setting/activate" \
  -H "Content-Type: application/json" \
  -d '{
    "ak": "<AK>",
    "sk": "<SK>",
    "dataway_url": "http://<server-ip>:30928?token={}",
    "license": "<base64-license>"
  }'
```

## When To Run It

- After launcher install reaches completion
- Before spending time debugging management login
- Before concluding that admin credentials are wrong

## Why It Matters

Without activation, the management API may return `ft.InvalidLicense`, and the UI can show `License 未激活或已失效`.
