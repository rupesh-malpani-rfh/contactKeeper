const jwt = require('jsonwebtoken');
const config = require('config');

// This is only going to pretend to protected routes
// routes that we choose to protext
module.exports = function (req, res, next) {
    // Get the token from header

    const token = req.header('x-auth-token');

    // Check if no token
    if (!token) {
        return res.status(401).json({ msg: 'No token - authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, config.get('jwtSecret'));

        // pulling out the decoded which has user as we need user.id and assigning that
        // to req.user
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
}