const jwt = require('jsonwebtoken');

// Générer access token (1h)
const genererAccessToken = (utilisateur) => {
    return jwt.sign(
        {
            id: utilisateur.id,
            email: utilisateur.email,
            role: utilisateur.role
        },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRY || '1h' }
    );
};

// Générer refresh token (7j)
const genererRefreshToken = (utilisateur) => {
    return jwt.sign(
        {
            id: utilisateur.id,
            type: 'refresh'
        },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
    );
};

// Vérifier refresh token
const verifierRefreshToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
        throw new Error('Refresh token invalide');
    }
};

module.exports = {
    genererAccessToken,
    genererRefreshToken,
    verifierRefreshToken
};
