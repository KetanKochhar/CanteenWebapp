const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { isAuthenticated } = require('./auth');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'admin') {
    next();
  } else {
    res.status(403).redirect('/login');
  }
};

// Admin dashboard
router.get('/', isAuthenticated, isAdmin, (req, res) => {
  res.render('admin/dashboard', { user: req.session.user });
});

// Menu management
router.get('/menu', isAuthenticated, isAdmin, (req, res) => {
  db.all('SELECT * FROM menu_items', [], (err, items) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.render('admin/menu-management', { items, user: req.session.user });
  });
});

// Add new menu item
router.post('/menu/add', isAuthenticated, isAdmin, (req, res) => {
  const { name, price, description, category } = req.body;
  db.run(`
    INSERT INTO menu_items (name, price, description, category) 
    VALUES (?, ?, ?, ?)`,
    [name, price, description, category],
    (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.redirect('/admin/menu');
    });
});

// Update menu item
router.post('/menu/update/:id', isAuthenticated, isAdmin, (req, res) => {
  const { name, price, description, category } = req.body;
  db.run(`
    UPDATE menu_items 
    SET name = ?, price = ?, description = ?, category = ? 
    WHERE id = ?`,
    [name, price, description, category, req.params.id],
    (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.redirect('/admin/menu');
    });
});

// Order management
router.get('/orders', isAuthenticated, isAdmin, (req, res) => {
  db.all(`
    SELECT o.*, u.username 
    FROM orders o 
    JOIN users u ON o.user_id = u.id 
    ORDER BY o.created_at DESC`,
    [],
    (err, orders) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.render('admin/orders', { orders, user: req.session.user });
    });
});

// Update order status
router.post('/orders/:id/status', isAuthenticated, isAdmin, (req, res) => {
  const { status } = req.body;
  db.run(`
    UPDATE orders 
    SET status = ? 
    WHERE id = ?`,
    [status, req.params.id],
    (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true });
    });
});

module.exports = router; 