async function testAuthorizeUrl() {
  const clientId = "gridpass_app";
  const redirectUri = "https://gridpass.app/api/1.1/wf/oauth_callback";
  const scope = "iracing.auth";
  const state = "test_state_123";

  const url = `https://oauth.iracing.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${state}`;

  console.log("Testing URL:", url);

  const res = await fetch(url, { redirect: "manual" });
  console.log(`Response Status: ${res.status}`);
  console.log("Headers:", Object.fromEntries(res.headers.entries()));

  const text = await res.text();
  console.log("Body snippet:", text.substring(0, 300));
}

testAuthorizeUrl().then(() => setTimeout(() => process.exit(0), 500));
