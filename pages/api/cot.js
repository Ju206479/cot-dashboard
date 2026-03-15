// pages/api/cot.js
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: "Missing code" });

  const data = await redis.get(`cot:${code}`);
  if (!data || data.length === 0) {
    return res.status(404).json({ error: "No data yet — cron not run yet" });
  }

  res.setHeader("Cache-Control", "s-maxage=3600");
  res.status(200).json({ value: data });
}
