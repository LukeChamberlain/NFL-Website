import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json()); 


app.get('/proxy', async (req, res) => {
    const teamName = req.query.team;
    const SportsBlazeAPI = process.env.SportsBlazeAPI;
    const apiUrl = `https://api.sportsblaze.com/nfl/v1/rosters/2025.json?key=${SportsBlazeAPI}&team=${encodeURIComponent(teamName)}`;
    
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

app.post("/redeploy", async (req, res) => {
    const apiUrl = "https://api.render.com/deploy/srv-d28f8tre5dus73d73450?key=xhZ_1bBYPf8";
    try {
      const response = await fetch(apiUrl, { method: "POST" });
      res.status(response.status).send(await response.text());
    } catch (error) {
      res.status(500).send("Redeploy failed: " + error.message);
    }
});


app.post('/ai', async (req, res) => {
    const { messages } = req.body;
    const HF_TOKEN = process.env.HF_TOKEN;
  
    try {
      const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b:fireworks-ai",
          messages,
        }),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`AI API error response: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`AI API error: ${response.status} ${response.statusText} - ${errorText}`);
      }
  
      const data = await response.json();
      res.json(data);
  
    } catch (error) {
      console.error("Error calling AI API:", error);
      res.status(500).json({ error: "AI API call failed", details: error.message });
    }
  });
  
app.listen(3000, () => console.log('Proxy server running on port 3000'));