export default async function handler(req, res) {
    const { q, lat, lon } = req.query;
    const apiKey = process.env.OPENWEATHER_API_KEY;
    const apiUrl = process.env.OPENWEATHER_API_URL || 'https://api.openweathermap.org/data/2.5/weather';

    if (!apiKey) {
        return res.status(500).json({ 
            error: 'API key not configured on server' 
        });
    }

    let url;
    if (lat && lon) {
        url = `${apiUrl}?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    } else if (q) {
        url = `${apiUrl}?q=${encodeURIComponent(q)}&appid=${apiKey}&units=metric`;
    } else {
        return res.status(400).json({ 
            error: 'Please provide city name or coordinates' 
        });
    }

    try {
        const response = await fetch(url);
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({ 
            error: 'Weather service unavailable' 
        });
    }
}