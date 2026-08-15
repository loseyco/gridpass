import * as crypto from "crypto";

function mask(secret: string, id: string): string {
  const normalizedId = id.trim().toLowerCase();
  const hasher = crypto.createHash("sha256");
  hasher.update(secret + normalizedId);
  return hasher.digest("base64");
}

async function testLoseyCoAuth() {
  const email = "pjlosey@outlook.com";
  const password = "!Google1!";
  const clientId = "losey_co";
  const clientSecret = "Tableware-EQUIVOCAL-Ice-DEPRIVE-dice-tartness";

  console.log("Testing Password Limited Grant for client:", clientId);

  const maskedSecret = mask(clientSecret, clientId);
  const maskedPassword = mask(password, email);

  console.log("Masked Secret:", maskedSecret);
  console.log("Masked Password:", maskedPassword);

  const params = new URLSearchParams();
  params.append("grant_type", "password_limited");
  params.append("client_id", clientId);
  params.append("client_secret", maskedSecret);
  params.append("username", email);
  params.append("password", maskedPassword);
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

  if (data.access_token) {
    console.log("🎉 SUCCESS! ACCESS TOKEN RECEIVED!");
    
    // Fetch Career Stats
    const statsUrl = "https://members-ng.iracing.com/data/stats/member_career?cust_id=21596";
    const sRes = await fetch(statsUrl, {
      headers: { "Authorization": `Bearer ${data.access_token}` }
    });
    console.log("Stats Step 1:", await sRes.json());
  }
}

testLoseyCoAuth().then(() => setTimeout(() => process.exit(0), 500));
