import * as https from "https";

async function testFetch(url: string) {
  try {
    const res = await fetch(url);
    console.log(`[${res.status}] ${url}`);
    if (res.ok) {
      const text = await res.text();
      console.log("Response snippet:", text.substring(0, 500));
    }
  } catch (err: any) {
    console.log(`Error fetching ${url}:`, err.message);
  }
}

async function run() {
  const custId = "21596";
  console.log(`🔍 Testing iRacing Data Lookup for Customer ID: ${custId}...`);

  // Test various known public lookup services
  await testFetch(`https://iracing-stats.com/api/driver/${custId}`);
  await testFetch(`https://api.garage61.net/v1/drivers/${custId}`);
  await testFetch(`https://simracingstats.com/api/driver/${custId}`);
  await testFetch(`https://members.iracing.com/membersite/member/CareerStats.do?custid=${custId}`);

  process.exit(0);
}

run();
