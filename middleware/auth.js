function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect('/login');
}

function isOwner(req, res, next) {
    if (req.session && req.session.user && req.session.user.role === 'owner') {
        return next();
    }
    res.status(403).render('error', { 
        error: 'Access denied. Owner privileges required.',
        user: req.session.user 
    });
}

module.exports = {
    isAuthenticated,
    isOwner
}; 