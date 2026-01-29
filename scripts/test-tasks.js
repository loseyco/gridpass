
// const fetch = require('node-fetch'); // Native fetch

async function testTasks() {
    const baseUrl = 'http://localhost:3003/api';

    // 1. Auth Login
    console.log("1. Logging in...");
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'racer@gridpass.app', password: 'password123' })
    });

    if (!loginRes.ok) throw new Error("Login failed");
    const cookie = loginRes.headers.get('set-cookie');
    console.log("Login OK.");

    // 2. Post Task
    console.log("2. Creating Task...");
    const postRes = await fetch(`${baseUrl}/tasks`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': cookie
        },
        body: JSON.stringify({
            title: "Prep for Sebring",
            due_date: "2026-03-01",
            priority: "high"
        })
    });
    const postData = await postRes.json();
    console.log("POST Status:", postRes.status, postData);

    // 3. Get Tasks
    console.log("3. Listing Tasks...");
    const getRes = await fetch(`${baseUrl}/tasks`, {
        method: 'GET',
        headers: { 'Cookie': cookie }
    });
    const getData = await getRes.json();
    console.log("GET Status:", getRes.status);
    console.log("Tasks Found:", getData.data?.length);
    console.log(JSON.stringify(getData.data, null, 2));
}

testTasks().catch(console.error);
