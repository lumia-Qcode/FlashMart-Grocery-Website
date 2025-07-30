const jwt = require("jsonwebtoken");


// Middleware to authenticate user //used to check if the token is valid

const authenticateUser = (req, res, next) => {
    const token = req.header("Authorization")?.split(" ")[1];
    
    if (!token) {
        return res.status(400).json({ success: false, message: "Token is missing from request." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Decoded Token:", decoded);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(400).json({ success: false, message: "Invalid or expired token." });
    }
};

// Middleware to authorize role (customer/admin)
const authorizeRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: "Access denied" });
        }
        next();
    };
};

module.exports = { authenticateUser, authorizeRole };

