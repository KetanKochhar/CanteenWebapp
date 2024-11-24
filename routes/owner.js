const express = require('express');
const router = express.Router();
const db = require('../config/database');
const multer = require('multer');
const path = require('path');
const { isAuthenticated, isOwner } = require('../middleware/auth');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Main owner route - redirects to dashboard
router.get('/', isAuthenticated, isOwner, (req, res) => {
    res.redirect('/owner/dashboard');
});

// Owner dashboard
router.get('/dashboard', isAuthenticated, isOwner, (req, res) => {
    // Fetch menu items and pending orders count
    db.all('SELECT * FROM menu_items', [], (err, menuItems) => {
        if (err) {
            console.error('Error fetching menu items:', err);
            return res.status(500).render('error', { 
                error: 'Database error',
                user: req.session.user 
            });
        }

        db.get('SELECT COUNT(*) as pendingCount FROM orders WHERE status = "pending"', [], (err, result) => {
            if (err) {
                console.error('Error fetching pending orders:', err);
                return res.status(500).render('error', { 
                    error: 'Database error',
                    user: req.session.user 
                });
            }

            res.render('owner/dashboard', {
                user: req.session.user,
                menuItems: menuItems,
                pendingOrders: result ? result.pendingCount : 0
            });
        });
    });
});

// Menu management page
router.get('/menu', isAuthenticated, isOwner, (req, res) => {
    db.all('SELECT * FROM menu_items', [], (err, menuItems) => {
        if (err) {
            console.error('Error fetching menu items:', err);
            return res.status(500).render('error', { 
                error: 'Database error',
                user: req.session.user 
            });
        }

        res.render('owner/menu', {
            user: req.session.user,
            menuItems: menuItems
        });
    });
});

// Add menu item
router.post('/add-item', isAuthenticated, isOwner, upload.single('image'), (req, res) => {
    const { name, description, price, category } = req.body;
    const imagePath = req.file ? '/uploads/' + req.file.filename : null;

    db.run(`
        INSERT INTO menu_items (name, description, price, category, image_path)
        VALUES (?, ?, ?, ?, ?)
    `, [name, description, price, category, imagePath], (err) => {
        if (err) {
            console.error('Error adding menu item:', err);
            return res.json({ success: false, message: 'Failed to add item' });
        }
        res.json({ success: true, message: 'Item added successfully' });
    });
});

// Edit menu item
router.post('/edit-item', isAuthenticated, isOwner, upload.single('image'), (req, res) => {
    const { id, name, description, price, category } = req.body;
    
    if (req.file) {
        const imagePath = '/uploads/' + req.file.filename;
        db.run(`
            UPDATE menu_items 
            SET name = ?, description = ?, price = ?, category = ?, image_path = ?
            WHERE id = ?
        `, [name, description, price, category, imagePath, id], (err) => {
            if (err) {
                console.error('Error updating menu item:', err);
                return res.json({ success: false, message: 'Failed to update item' });
            }
            res.json({ success: true, message: 'Item updated successfully' });
        });
    } else {
        db.run(`
            UPDATE menu_items 
            SET name = ?, description = ?, price = ?, category = ?
            WHERE id = ?
        `, [name, description, price, category, id], (err) => {
            if (err) {
                console.error('Error updating menu item:', err);
                return res.json({ success: false, message: 'Failed to update item' });
            }
            res.json({ success: true, message: 'Item updated successfully' });
        });
    }
});

// Delete menu item
router.post('/delete-item/:id', isAuthenticated, isOwner, (req, res) => {
    const itemId = req.params.id;
    
    db.run('DELETE FROM menu_items WHERE id = ?', [itemId], (err) => {
        if (err) {
            console.error('Error deleting menu item:', err);
            return res.json({ success: false, message: 'Failed to delete item' });
        }
        res.json({ success: true, message: 'Item deleted successfully' });
    });
});

// Orders list page
router.get('/orders', isAuthenticated, isOwner, (req, res) => {
    db.all(`
        SELECT o.*, u.username, u.email,
            (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
        FROM orders o
        JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
    `, [], (err, orders) => {
        if (err) {
            console.error('Error fetching orders:', err);
            return res.status(500).render('error', { 
                error: 'Database error',
                user: req.session.user 
            });
        }

        res.render('owner/orders', {
            user: req.session.user,
            orders: orders
        });
    });
});

// Order details page
router.get('/order/:id', isAuthenticated, isOwner, (req, res) => {
    const orderId = req.params.id;

    // Get order details with customer info
    db.get(`
        SELECT o.*, u.username, u.email
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.id = ?
    `, [orderId], (err, order) => {
        if (err || !order) {
            console.error('Error fetching order:', err);
            return res.redirect('/owner/orders');
        }

        // Get order items
        db.all(`
            SELECT oi.*, m.name, m.price
            FROM order_items oi
            JOIN menu_items m ON oi.item_id = m.id
            WHERE oi.order_id = ?
        `, [orderId], (err, items) => {
            if (err) {
                console.error('Error fetching order items:', err);
                return res.redirect('/owner/orders');
            }

            res.render('owner/order-details', {
                user: req.session.user,
                order: order,
                items: items
            });
        });
    });
});

// Update order status
router.post('/update-order-status', isAuthenticated, isOwner, (req, res) => {
    const { orderId, status } = req.body;
    
    if (!['pending', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid status' 
        });
    }

    db.run(
        'UPDATE orders SET status = ? WHERE id = ?',
        [status, orderId],
        function(err) {
            if (err) {
                console.error('Error updating order status:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to update order status' 
                });
            }

            res.json({ 
                success: true, 
                message: 'Order status updated successfully' 
            });
        }
    );
});

module.exports = router; 