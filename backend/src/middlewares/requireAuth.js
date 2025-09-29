import jwt from 'jsonwebtoken';

export default function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const [scheme, token] = auth.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ code: 'NO_TOKEN', error: 'Falta token Bearer' });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: String(payload.id), email: payload.email };
    return next();
  } catch {
    return res.status(401).json({ code: 'BAD_TOKEN', error: 'Token inválido' });
  }
}