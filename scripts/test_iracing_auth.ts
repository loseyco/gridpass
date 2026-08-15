async function testIRacingAuth() {
  const clientId = "gridpass_app";
  const clientSecret = "TRIMMER-SCOURED-THEORIZE-SKILLET-VENEERING-Simple";

  console.log("🏎️ Testing iRacing OAuth Token Retrieval for client:", clientId);

  try {
    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    params.append("client_id", clientId);
    params.append("client_secret", clientSecret);
    params.append("audience", "https://members-ng.iracing.com/data");

    const tokenRes = await fetch("https://oauth.iracing.com/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });

    console.log(`OAuth Token Response Status: ${tokenRes.status}`);
    const tokenData = await tokenRes.json();
    console.log("Token response payload:", tokenData);

    if (tokenData.access_token) {
      console.log("✅ ACCESS TOKEN OBTAINED SUCCESSFULLY!");
      
      // Step 2: Fetch Member Career Stats for Customer ID 21596
      const statsUrl = "https://members-ng.iracing.com/data/stats/member_career?cust_id=21596";
      console.log(`Fetching stats from: ${statsUrl}`);

      const statsRes = await fetch(statsUrl, {
        headers: {
          "Authorization": `Bearer ${tokenData.access_token}`
        }
      });

      console.log(`Stats Response Status: ${statsRes.status}`);
      const statsJson = await statsRes.json();
      console.log("Stats Step 1 Response (S3 Link):", statsJson);

      if (statsJson.link) {
        const s3Res = await fetch(statsJson.link);
        const careerData = await s3Res.json();
        console.log("🏆 REAL IRACING CAREER DATA FROM S3:");
        console.log(JSON.stringify(careerData, null, 2));
      }
    }
  } catch (err: any) {
    console.error("Auth test failed:", err);
  }
}

testIRacingAuth().then(() => {
  setTimeout(() => process.exit(0), 1000);
});
