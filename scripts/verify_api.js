const fs = require('fs');

async function testIngest() {
    console.log('Testing Ingest API...');
    try {
        const payload = {
            subsession_id: 888888,
            track: {
                track_name: 'Verification Track',
                track_config_name: 'GP'
            },
            start_time: new Date().toISOString(),
            session_results: [
                {
                    simsession_name: 'RACE',
                    results: [
                        {
                            cust_id: 12345,
                            display_name: 'Verify Driver',
                            finish_position: 0,
                            starting_position: 0,
                            laps_complete: 10,
                            best_lap_time: 600000,
                            average_lap_time: 610000,
                            incidents: 0,
                            old_irating: 2000
                        }
                    ]
                }
            ]
        };

        const res = await fetch('http://localhost:3000/api/league/ingest', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer f21010'
            },
            body: JSON.stringify(payload)
        });

        const text = await res.text();
        console.log('Status:', res.status);
        console.log('Response:', text);

        fs.writeFileSync('verification_result.txt', `Status: ${res.status}\nResponse: ${text}`);

    } catch (e) {
        console.error('Error:', e);
        fs.writeFileSync('verification_result.txt', `Error: ${e.message}`);
    }
}

testIngest();
