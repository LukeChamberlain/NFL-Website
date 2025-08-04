import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
const app = express();
app.use(cors());

app.get('/proxy', async (req, res) => {
    const teamName = req.query.team;
    const apiKey = process.env.SPORTS_API_KEY;
    const apiUrl = `https://api.sportsblaze.com/nfl/v1/rosters/2024.json?key=${apiKey}&team=${encodeURIComponent(teamName)}`;
    
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching data:', error.message);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

app.listen(3000, () => console.log('Proxy server running on port 3000'));