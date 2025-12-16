// Middleware de autenticação para o sistema de TMR
// Semelhante ao middleware do app_he

function tmrAuth(req, res, next) {
  if (!req.session.user) {
    const redirect = encodeURIComponent(req.originalUrl);
    return res.redirect(`/login?redirect=${redirect}`);
  }
  next();
}

module.exports = tmrAuth;
