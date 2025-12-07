const axios = require('axios');

async function main() {
    try {
        // 1. Login
        console.log('Logging in...');
        const loginResponse = await axios.post('http://localhost:3001/auth/login', {
            email: 'admin@empresa.com',
            password: 'password123'
        });
        const token = loginResponse.data.access_token;
        console.log('✅ Login successful. Token obtained.');

        // 2. Get Agent
        console.log('Fetching agents...');
        const agentsResponse = await axios.get('http://localhost:3001/playground/agents', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (agentsResponse.data.length === 0) {
            console.error('❌ No agents found. Please create an agent first.');
            // Create agent if none exists
            console.log('Creating test agent...');
            const createAgentResponse = await axios.post('http://localhost:3001/playground/agents', {
                name: 'Test Agent API',
                prompt: 'You are a test agent'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            agentsResponse.data.push(createAgentResponse.data);
        }

        const agentId = agentsResponse.data[0].id;
        console.log('✅ Agent found:', agentId);

        // 3. Create Session
        console.log('Creating session...');
        const sessionResponse = await axios.post('http://localhost:3001/playground/sessions', {
            agentId: agentId
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Session created successfully:', sessionResponse.data);

    } catch (error) {
        if (error.response) {
            console.error('❌ API Error:', error.response.status, error.response.statusText);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('❌ Error:', error.message);
        }
    }
}

main();
