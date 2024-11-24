const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const db = new sqlite3.Database(path.join(__dirname, '../canteen.db'));

// Create all necessary tables
db.serialize(async () => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Menu items table
    db.run(`CREATE TABLE IF NOT EXISTS menu_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        category TEXT NOT NULL,
        image_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Orders table
    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Order items table
    db.run(`CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        item_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (item_id) REFERENCES menu_items(id)
    )`);

    // Create default owner account if it doesn't exist
    const hashedPassword = await bcrypt.hash('admin123', 10);
    db.get('SELECT id FROM users WHERE role = "owner"', [], (err, owner) => {
        if (err) {
            console.error('Error checking for owner:', err);
            return;
        }

        if (!owner) {
            db.run(`
                INSERT INTO users (username, email, password, role)
                VALUES (?, ?, ?, ?)
            `, ['admin', 'admin@example.com', hashedPassword, 'owner'], (err) => {
                if (err) {
                    console.error('Error creating owner account:', err);
                } else {
                    console.log('Owner account created successfully');
                }
            });
        }
    });

    // Insert some sample menu items if the menu is empty
    db.get('SELECT COUNT(*) as count FROM menu_items', [], (err, result) => {
        if (err) {
            console.error('Error checking menu items:', err);
            return;
        }

        if (result.count === 0) {
            const sampleItems = [
                {
                    name: 'Masala Dosa',
                    description: 'Crispy rice crepe filled with spiced potatoes',
                    price: 60.00,
                    category: 'South Indian',
                    image_path: '/uploads/masala-dosa.jpg'
                },
                {
                    name: 'Samosa',
                    description: 'Crispy pastry filled with spiced potatoes and peas',
                    price: 20.00,
                    category: 'Snacks',
                    image_path: '/uploads/samosa.jpg'
                },
                {
                    name: 'Butter Chicken',
                    description: 'Tender chicken in rich tomato-butter gravy',
                    price: 180.00,
                    category: 'Main Course',
                    image_path: '/uploads/butter-chicken.jpg'
                }
            ];

            const stmt = db.prepare(`
                INSERT INTO menu_items (name, description, price, category, image_path)
                VALUES (?, ?, ?, ?, ?)
            `);

            sampleItems.forEach(item => {
                stmt.run([
                    item.name,
                    item.description,
                    item.price,
                    item.category,
                    item.image_path
                ], (err) => {
                    if (err) {
                        console.error('Error inserting sample menu item:', err);
                    }
                });
            });

            stmt.finalize();
            console.log('Sample menu items created successfully');
        }
    });
});

// Handle database errors
db.on('error', (err) => {
    console.error('Database error:', err);
});

process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
});

module.exports = db; 