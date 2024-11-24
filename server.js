const express = require('express');
const session = require('express-session');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');
const ownerRoutes = require('./routes/owner');
const cartRoutes = require('./routes/cart');
const paymentRoutes = require('./routes/payment');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Session middleware
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Simple request logger middleware
app.use((req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const port = req.socket.localPort;
    console.log(`\x1b[36m${ip}:${port} ==> ${req.url}\x1b[0m`); // Cyan color
    next();
});

// Redirect root to auth
app.get('/', (req, res) => {
    res.redirect('/auth');
});

// Use routes
app.use('/', authRoutes);
app.use('/menu', menuRoutes);
app.use('/orders', orderRoutes);
app.use('/owner', ownerRoutes);
app.use('/cart', cartRoutes);
app.use('/payment', paymentRoutes);

const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
    console.log(`\x1b[32mServer running on port ${PORT}\x1b[0m`); // Green color
});