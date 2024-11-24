const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { isAuthenticated } = require('../middleware/auth');

// View cart
router.get('/', isAuthenticated, (req, res) => {
    if (!req.session.cart) {
        req.session.cart = [];
    }

    // Get details of items in cart
    const cart = req.session.cart;
    if (cart.length === 0) {
        return res.render('cart', {
            user: req.session.user,
            items: [],
            total: 0
        });
    }

    // Get item details from database
    const itemIds = cart.map(item => item.id);
    const placeholders = itemIds.map(() => '?').join(',');
    
    db.all(`SELECT * FROM menu_items WHERE id IN (${placeholders})`, itemIds, (err, menuItems) => {
        if (err) {
            console.error('Error fetching cart items:', err);
            return res.status(500).render('error', { 
                error: 'Failed to load cart',
                user: req.session.user 
            });
        }

        // Combine menu items with quantities from cart
        const items = menuItems.map(menuItem => {
            const cartItem = cart.find(item => item.id === menuItem.id);
            return {
                ...menuItem,
                quantity: cartItem.quantity
            };
        });

        // Calculate total
        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        res.render('cart', {
            user: req.session.user,
            items: items,
            total: total
        });
    });
});

// Add to cart
router.post('/add', isAuthenticated, async (req, res) => {
    try {
        console.log('Received request body:', req.body);
        const { item_id, quantity } = req.body;
        
        // Initialize cart if it doesn't exist
        if (!req.session.cart) {
            req.session.cart = [];
        }

        // Validate input
        if (!item_id || !quantity || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: 'Invalid input: Please provide valid item ID and quantity'
            });
        }

        // Check if item exists in database
        db.get('SELECT * FROM menu_items WHERE id = ?', [item_id], (err, item) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error'
                });
            }

            if (!item) {
                return res.status(404).json({
                    success: false,
                    message: 'Item not found'
                });
            }

            // Check if item is already in cart
            const existingItemIndex = req.session.cart.findIndex(
                cartItem => cartItem.id === item_id
            );

            if (existingItemIndex !== -1) {
                // Update quantity if item exists
                req.session.cart[existingItemIndex].quantity += quantity;
            } else {
                // Add new item to cart
                req.session.cart.push({
                    id: item_id,
                    quantity: quantity
                });
            }

            // Calculate total items in cart
            const cartCount = req.session.cart.reduce(
                (sum, item) => sum + item.quantity, 0
            );

            // Save session
            req.session.save((err) => {
                if (err) {
                    console.error('Session save error:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to save cart'
                    });
                }

                res.json({
                    success: true,
                    message: 'Item added to cart successfully',
                    cartCount: cartCount
                });
            });
        });
    } catch (error) {
        console.error('Cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Update quantity
router.post('/update', isAuthenticated, (req, res) => {
    const { itemId, quantity } = req.body;
    
    if (!req.session.cart) {
        return res.status(400).json({
            success: false,
            message: 'Cart is empty'
        });
    }

    const item = req.session.cart.find(item => item.id === parseInt(itemId));
    if (!item) {
        return res.status(400).json({
            success: false,
            message: 'Item not in cart'
        });
    }

    if (parseInt(quantity) <= 0) {
        req.session.cart = req.session.cart.filter(item => item.id !== parseInt(itemId));
    } else {
        item.quantity = parseInt(quantity);
    }

    res.json({
        success: true,
        message: 'Cart updated'
    });
});

// Remove from cart
router.post('/remove', isAuthenticated, (req, res) => {
    const { itemId } = req.body;
    
    if (!req.session.cart) {
        return res.status(400).json({
            success: false,
            message: 'Cart is empty'
        });
    }

    req.session.cart = req.session.cart.filter(item => item.id !== parseInt(itemId));

    res.json({
        success: true,
        message: 'Item removed from cart'
    });
});

module.exports = router; 