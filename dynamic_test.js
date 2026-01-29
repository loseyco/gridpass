const { fetch } = 'fetch';

async function main() {
    // First API call
    const response = await fetch('https://api.org/api/orgs', {
        headers: {
            'Content-Type': 'application/json'
        }
    });

    // Parse JSON response
    const organizations = await response.json();

    if (Array.isArray(organizations) && organizations.length > 0) {
        const orgId = String(organizations[0].id);
        
        // Second API call with the organization ID
        const membersResponse = await fetch(`https://api.org/api/orgs/${orgId}/members`, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const members = await membersResponse.json();

        console.log('Organizations:', organizations);
        console.log('Members:', members);
    } else {
        console.log('No organizations found or empty array');
    }
}

main();