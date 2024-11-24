const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Import middleware properly
const { isAuthenticated } = require('../middleware/auth');

// Get single order
router.get('/:orderId', isAuthenticated, (req, res) => {
    const orderId = req.params.orderId;
    const userId = req.session.user.id;

    db.get(`
        SELECT * FROM orders 
        WHERE id = ? AND user_id = ?
    `, [orderId, userId], (err, order) => {
        if (err || !order) {
            console.error('Error fetching order:', err);
            return res.redirect('/menu');
        }

        // Get order items
        db.all(`
            SELECT oi.*, mi.name, mi.image_path
            FROM order_items oi
            JOIN menu_items mi ON oi.item_id = mi.id
            WHERE oi.order_id = ?
        `, [orderId], (err, orderItems) => {
            if (err) {
                console.error('Error fetching order items:', err);
                return res.redirect('/menu');
            }

            res.render('orders', {
                order: order,
                orderItems: orderItems,
                user: req.session.user
            });
        });
    });
});

// Get all orders for user
router.get('/', isAuthenticated, (req, res) => {
    const userId = req.session.user.id;

    db.all(`
        SELECT * FROM orders 
        WHERE user_id = ?
        ORDER BY created_at DESC
    `, [userId], (err, orders) => {
        if (err) {
            console.error('Error fetching orders:', err);
            return res.redirect('/menu');
        }

        res.render('orders-list', {
            orders: orders,
            user: req.session.user
        });
    });
});

module.exports = router; 