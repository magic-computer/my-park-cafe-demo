import { DEMO_KEYS } from '../src/config/demoAccess.js';

export default function handler(req: any, res: any) {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const key = url.searchParams.get('key');

    if (!key) {
      return res.status(400).json({
        active: false,
        reason: 'invalid_key',
        daysLeft: 0
      });
    }

    const found = DEMO_KEYS.find(k => k.key === key);

    if (!found) {
      return res.status(200).json({
        active: false,
        reason: 'invalid_key',
        daysLeft: 0
      });
    }

    const now = new Date();
    const expiry = new Date(found.expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs <= 0) {
      return res.status(200).json({
        active: false,
        reason: 'expired',
        daysLeft: 0,
        label: found.label
      });
    }

    return res.status(200).json({
      active: true,
      reason: 'ok',
      daysLeft: daysLeft > 0 ? daysLeft : 1,
      label: found.label
    });
  } catch (err: any) {
    return res.status(500).json({
      active: false,
      reason: 'error',
      daysLeft: 0
    });
  }
}
