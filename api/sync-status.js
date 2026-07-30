import { list } from '@vercel/blob';

export default async function handler(request, response) {
  try {
    const { blobs } = await list({ prefix: 'status.json' });
    if (blobs.length === 0) {
      return response.status(404).json({ status: 'error', lastRunAt: null, message: 'Status file not found.' });
    }
    const data = await fetch(blobs[0].url).then((res) => res.json());
    return response.status(200).json(data);
  } catch (error) {
    return response.status(500).json({ status: 'error', lastRunAt: null, message: error.message });
  }
}
