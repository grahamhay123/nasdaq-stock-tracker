export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  const correctPassword = process.env.APP_PASSWORD;

  if (!correctPassword) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  if (password === correctPassword) {
    res.status(200).json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
}