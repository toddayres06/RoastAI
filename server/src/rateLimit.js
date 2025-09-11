const LIMITS = { anon: 3, authed: 15 };
const usage = new Map(); // key = `${YYYY-MM-DD}:${id}`, value = count

function day() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function whoKey(req) {
  if (req.user?.id) return { key: `user:${req.user.id}`, bucket: 'authed' };
  const clientId = req.headers['x-client-id'];
  if (!clientId) return null;
  return { key: `anon:${clientId}`, bucket: 'anon' };
}

export function rateLimit(req, res, next) {
  const who = whoKey(req);
  if (!who) {
    return res.status(400).json({
      error: 'Missing client identifier',
      hint: 'Anonymous requests must send header: X-Client-Id',
    });
  }

  const d = day();
  const fullKey = `${d}:${who.key}`;
  const current = usage.get(fullKey) ?? 0;
  const limit = LIMITS[who.bucket];

  if (current >= limit) {
    return res.status(429).json({
      error: 'Daily limit reached',
      bucket: who.bucket,
      used: current,
      limit,
      remaining: 0,
      reset: `${d}T23:59:59`,
    });
  }

  const used = current + 1;
  usage.set(fullKey, used);
  res.locals.rate = { bucket: who.bucket, used, limit, remaining: Math.max(0, limit - used) };
  next();
}
