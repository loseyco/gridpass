async function testVariations() {
  const variations = [
    { client_id: "gridpass_app", redirect_uri: "https://gridpass.app/api/1.1/wf/oauth_callback" },
    { client_id: "gridpass_app", redirect_uri: "https://gridpass.app/version-test/api/1.1/wf/oauth_callback" },
    { client_id: "losey_co", redirect_uri: "https://losey.co/api/1.1/wf/oauth_callback" },
    { client_id: "losey_co", redirect_uri: "https://losey.co/version-test/api/1.1/wf/oauth_callback" },
    { client_id: "losey_co", redirect_uri: "https://losey.co" },
  ];

  for (const v of variations) {
    const url = `https://oauth.iracing.com/oauth2/authorize?client_id=${v.client_id}&redirect_uri=${encodeURIComponent(v.redirect_uri)}&response_type=code&scope=iracing.auth&state=test_123`;
    const res = await fetch(url, { redirect: "manual" });
    const text = await res.text();
    console.log(`[${res.status}] client_id=${v.client_id} redirect_uri=${v.redirect_uri}`);
    console.log(`Snippet: ${text.substring(0, 150)}\n`);
  }
}

testVariations().then(() => setTimeout(() => process.exit(0), 500));
