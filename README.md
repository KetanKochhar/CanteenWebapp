# College Canteen Management System

A comprehensive web-based solution for managing college canteen operations, built with Express.js, SQLite, and EJS templating.

## Features

### For Customers
- User authentication and registration
- Browse menu items with images and descriptions
- Add items to cart
- Place and track orders
- View order history and status

### For Canteen Owner
- Secure admin dashboard
- Menu management (Add, Edit, Delete items)
- Order management
- Real-time order status updates
- Daily statistics and revenue tracking

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Template Engine**: EJS
- **Authentication**: express-session, bcrypt
- **File Upload**: multer
- **Styling**: Tailwind CSS

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd canteen_website
```
2. Install dependencies:
```bash
npm install
```
3. Start the server:
```bash
npm start
```
The server will run on `http://localhost:80`.

## Default Admin Credentials
- Username: owner
- Password: owner
 
## Project Structure
canteen_website/
```
├── config/
│ └── database.js # Database configuration
├── public/
│ └── uploads/ # Uploaded images
├── routes/
│ ├── auth.js # Authentication routes
│ ├── menu.js # Menu management
│ ├── orders.js # Order processing
│ └── owner.js # Admin routes
├── views/
│ ├── partials/ # Reusable template parts
│ ├── owner/ # Admin views
│ └── .ejs # Customer views
├── server.js # Application entry point
└── package.json
```

## Key Features Implementation

### Authentication
- Secure session-based authentication
- Role-based access control (Owner/Customer)
- Password hashing using bcrypt

### Menu Management
- CRUD operations for menu items
- Image upload support
- Category-based organization

### Order System
- Real-time order tracking
- Order status updates
- Order history

## License

This project is licensed under the ISC License.

## Acknowledgments

- Express.js team
- Tailwind CSS
- SQLite team