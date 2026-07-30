import { Blob } from "@vercel/blob";

export default async function handler(request, response) {
  try {
    const { head } = await Blob.list({ prefix: "status.json" });
    if (head.length === 0) {
      return response.status(404).json({
        status: "error",
        lastRunAt: null,
        message: "Status file not found.",
      });
    }
    const { url } = head[0];
    const blob = await fetch(url).then((res) => res.json());
    return response.status(200).json(blob);
  } catch (error) {
    return response
      .status(500)
      .json({ status: "error", message: error.message });
  }
}
