import * as crypto from "crypto";

function mask(secret: string, id: string): string {
  const normalizedId = id.trim().toLowerCase();
  const hasher = crypto.createHash("sha256");
  hasher.update(secret + normalizedId);
  return hasher.digest("base64");
}

async function testMaskedAuth() {
  const clientId = "gridpass_app";
  const clientSecret = "TRIMMER-SCOURED-THEORIZE-SKILLET-VENEERING-Simple";

  // Test with both raw secret and masked secret
  const maskedSecret = mask(clientSecret, clientId);
  console.log("Client ID:", clientId);
  console.log("Masked Secret:", maskedSecret);

  // Let's test the Password Limited Grant
  // Note: Password limited grant requires your iRacing username (pjlosey@outlook.com) and iRacing password.
  // We will check if client_credentials or authorization_code with masked secret works!
  
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", clientId);
  params.append("client_secret", maskedSecret);
  params.append("scope", "iracing.auth");

  const res = await fetch("https://oauth.iracing.com/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });

  console.log(`Response Status: ${res.status}`);
  const data = await res.json();
  console.log("Response data:", data);
}

testMaskedAuth().then(() => setTimeout(() => process.exit(0), 500));
