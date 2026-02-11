// Middleware de autenticação para o sistema de Reparos B2B
// Semelhante ao middleware do app_tmr

function b2bAuth(req, res, next) {
  if (!req.session.usuario) {
    const redirect = encodeURIComponent(req.originalUrl);
    return res.redirect(`/login?redirect=${redirect}`);
  }
  next();
}

module.exports = b2bAuth;