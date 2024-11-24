const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcrypt');

// Show login/register page
router.get('/auth', (req, res) => {
    if (req.session.user) {
        return res.redirect('/menu');
    }
    res.render('auth', { 
        user: null,
        error: req.query.error 
    });
});

// Login route
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
            if (err) {
                console.error('Database error:', err);
                return res.redirect('/auth?error=Database error');
            }

            if (!user) {
                return res.redirect('/auth?error=Invalid username or password');
            }

            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                return res.redirect('/auth?error=Invalid username or password');
            }

            req.session.user = {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            };

            if (user.role === 'owner') {
                res.redirect('/owner/dashboard');
            } else {
                res.redirect('/menu');
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.redirect('/auth?error=Login failed');
    }
});

// Register route
router.post('/register', async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;

    // Validate passwords match
    if (password !== confirmPassword) {
        return res.redirect('/auth?error=Passwords do not match');
    }

    try {
        // Check if username exists
        db.get('SELECT id FROM users WHERE username = ?', [username], async (err, existingUser) => {
            if (err) {
                console.error('Database error:', err);
                return res.redirect('/auth?error=Database error');
            }

            if (existingUser) {
                return res.redirect('/auth?error=Username already exists');
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert new user
            db.run(
                'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
                [username, email, hashedPassword, 'user'],
                function(err) {
                    if (err) {
                        console.error('Error creating user:', err);
                        return res.redirect('/auth?error=Failed to create account');
                    }

                    // Auto-login after registration
                    req.session.user = {
                        id: this.lastID,
                        username,
                        email,
                        role: 'user'
                    };

                    res.redirect('/menu');
                }
            );
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.redirect('/auth?error=Registration failed');
    }
});

// Logout route
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/auth');
    });
});

module.exports = router; 