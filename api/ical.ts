import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const icalUrl = process.env.VITE_AIRBNB_ICAL_URL;

  if (!icalUrl) {
    return res.status(500).json({ error: 'VITE_AIRBNB_ICAL_URL not configured' });
  }

  try {
    const response = await fetch(icalUrl);

    if (!response.ok) {
      return res.status(response.status).json({ error: `Airbnb returned ${response.status}` });
    }

    const text = await response.text();
    res.setHeader('Content-Type', 'text/calendar');
    return res.status(200).send(text);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch iCal feed' });
  }
}
