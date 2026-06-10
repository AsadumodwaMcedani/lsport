import jwt from 'jsonwebtoken';

export function issueToken(payload, expiresIn) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

export function setAuthCookie(res, token, maxAgeMs) {
  res.cookie('ls_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: maxAgeMs
  });
}

export function requireAuth(req, res, next) {
  const token = req.cookies?.ls_token;
  if (!token) return res.status(401).json({ ok: false, error: { code: 'UNAUTHENTICATED', message: 'Login required' } });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ ok: false, error: { code: 'TOKEN_INVALID', message: 'Session expired — log in again' } });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ ok: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
    }
    next();
  };
}
