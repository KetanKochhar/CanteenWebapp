const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.get('/', (req, res) => {
    db.all('SELECT * FROM menu_items', [], (err, menuItems) => {
        if (err) {
            console.error('Error fetching menu items:', err);
            return res.status(500).render('error', { 
                error: 'Failed to load menu',
                user: req.session.user 
            });
        }

        res.render('menu', {
            user: req.session.user,
            menuItems: menuItems,
            cart: req.session.cart || []
        });
    });
});

module.exports = router; 