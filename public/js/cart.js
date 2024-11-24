async function addToCart(itemId, quantity = 1) {
    try {
        const response = await fetch('/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                item_id: itemId,
                quantity: quantity
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            // Show success message
            showNotification('Item added to cart!', 'success');
            updateCartCount();
        } else {
            showNotification(data.error || 'Failed to add item to cart', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error adding item to cart', 'error');
    }
}

async function updateCartCount() {
    try {
        const response = await fetch('/cart/count');
        const data = await response.json();
        
        // Update cart count in header
        const cartBadge = document.getElementById('cart-count');
        if (cartBadge) {
            cartBadge.textContent = data.count;
            cartBadge.style.display = data.count > 0 ? 'block' : 'none';
        }
    } catch (error) {
        console.error('Error updating cart count:', error);
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-md ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
} 