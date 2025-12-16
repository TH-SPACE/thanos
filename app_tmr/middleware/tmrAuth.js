// Middleware de autenticação para o sistema de TMR
// Semelhante ao middleware do app_he

function tmrAuth(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/login?redirect=/tmr');
    }
    next();
}

module.exports = tmrAuth;