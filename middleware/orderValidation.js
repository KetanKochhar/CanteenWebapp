const validateOrderStatus = (req, res, next) => {
    const { status } = req.body;
    const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
    
    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ 
            error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') 
        });
    }
    
    next();
};

module.exports = { validateOrderStatus }; 