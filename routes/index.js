const express = require('express');
const router = express.Router();

// Root route with role-based redirects
router.get('/', (req, res) => {
    if (req.session.user) {
        if (req.session.user.role === 'owner') {
            res.redirect('/owner');
        } else {
            res.redirect('/menu');
        }
    } else {
        res.redirect('/auth/login');
    }
});

module.exports = router; 