// Using native fetch (available in Node 18+)


exports.handler = async (event, context) => {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
  const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
  const NTFY_TOPIC = process.env.NTFY_TOPIC || "jackson-garden-remind";

  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Storage not configured. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN." })
    };
  }

  const key = "last_reminder_sent";

  try {
    // Check last trigger time
    const checkRes = await fetch(`${UPSTASH_URL}/get/${key}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
    });
    const checkData = await checkRes.json();
    const lastSent = checkData.result ? parseInt(checkData.result) : 0;
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000; // 24 hours

    if (now - lastSent < cooldown) {
      const remainingMs = cooldown - (now - lastSent);
      return {
        statusCode: 429,
        body: JSON.stringify({
          error: "Too soon!",
          remainingMs,
          nextAvailable: lastSent + cooldown
        })
      };
    }

    // Trigger Notification
    await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
      method: "POST",
      body: "Hey! Someone is stuck in your cave and needs help. Go help them find a way out!"
    });

    // Update last trigger time with 24h expiration
    await fetch(`${UPSTASH_URL}/set/${key}/${now}/EX/${86400}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Success",
        nextAvailable: now + cooldown
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
