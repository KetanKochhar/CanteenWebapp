const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const db = require('../config/database');
const QRCode = require('qrcode');
const paymentConfig = require('../config/payment-config');

router.get('/', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const cart = req.session.cart || [];

        if (!cart || cart.length === 0) {
            return res.redirect('/cart');
        }

        const itemIds = cart.map(item => item.id);
        const placeholders = itemIds.map(() => '?').join(',');

        db.all(`SELECT * FROM menu_items WHERE id IN (${placeholders})`, itemIds, async (err, menuItems) => {
            if (err) {
                console.error('Database error:', err);
                return res.redirect('/cart');
            }

            const items = menuItems.map(menuItem => {
                const cartItem = cart.find(item => item.id === menuItem.id);
                return {
                    ...menuItem,
                    quantity: cartItem.quantity
                };
            });

            // Calculate total with GST
            const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const gst = subtotal * 0.05; // 5% GST
            const total = (subtotal + gst).toFixed(2);

            // Generate UPI payment URL
            const upiUrl = `upi://pay?pa=${paymentConfig.upiId}&pn=${encodeURIComponent(
                paymentConfig.payeeName
            )}&am=${total}&cu=${paymentConfig.currency}`;

            // Generate QR code
            const qrCode = await QRCode.toDataURL(upiUrl);

            res.render('payment', {
                items: items,
                subtotal: subtotal.toFixed(2),
                gst: gst.toFixed(2),
                total: total,
                qrCode: qrCode,
                upiUrl: upiUrl,
                upiId: paymentConfig.upiId,
                payeeName: paymentConfig.payeeName,
                user: req.session.user
            });
        });
    } catch (error) {
        console.error('Error in payment route:', error);
        res.redirect('/cart');
    }
});

router.post('/complete', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const cart = req.session.cart || [];

        if (!cart || cart.length === 0) {
            return res.json({ 
                success: false, 
                message: 'Cart is empty' 
            });
        }

        // Calculate total
        const itemIds = cart.map(item => item.id);
        const placeholders = itemIds.map(() => '?').join(',');

        db.all(`SELECT * FROM menu_items WHERE id IN (${placeholders})`, itemIds, (err, menuItems) => {
            if (err) {
                console.error('Database error:', err);
                return res.json({ 
                    success: false, 
                    message: 'Database error' 
                });
            }

            const items = menuItems.map(menuItem => {
                const cartItem = cart.find(item => item.id === menuItem.id);
                return {
                    ...menuItem,
                    quantity: cartItem.quantity
                };
            });

            const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const total = (subtotal * 1.05).toFixed(2); // Including 5% GST

            // Create order in database
            db.run(`
                INSERT INTO orders (user_id, total_amount, status, created_at)
                VALUES (?, ?, 'pending', datetime('now'))
            `, [userId, total], function(err) {
                if (err) {
                    console.error('Error creating order:', err);
                    return res.json({ 
                        success: false, 
                        message: 'Failed to create order' 
                    });
                }

                const orderId = this.lastID;

                // Insert order items
                const orderItemsValues = items.map(item => 
                    `(${orderId}, ${item.id}, ${item.quantity}, ${item.price})`
                ).join(',');

                db.run(`
                    INSERT INTO order_items (order_id, item_id, quantity, price)
                    VALUES ${orderItemsValues}
                `, [], (err) => {
                    if (err) {
                        console.error('Error creating order items:', err);
                        return res.json({ 
                            success: false, 
                            message: 'Failed to create order items' 
                        });
                    }

                    // Clear the cart
                    req.session.cart = [];
                    
                    res.json({ 
                        success: true, 
                        orderId: orderId 
                    });
                });
            });
        });
    } catch (error) {
        console.error('Error completing payment:', error);
        res.json({ 
            success: false, 
            message: 'Error processing payment' 
        });
    }
});

module.exports = router; 