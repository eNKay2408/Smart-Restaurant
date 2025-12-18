import jwt from 'jsonwebtoken';

// JWT Configuration - use getters to ensure env vars are read AFTER dotenv.config()
export const jwtConfig = {
    get secret() {
        return process.env.JWT_SECRET;
    },
    get refreshSecret() {
        return process.env.JWT_REFRESH_SECRET;
    },
    get accessTokenExpire() {
        return process.env.JWT_EXPIRE || '7d';
    },
    get refreshTokenExpire() {
        return process.env.JWT_REFRESH_EXPIRE || '30d';
    },
};

// Generate Access Token
export const generateAccessToken = (userId) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }
    return jwt.sign({ id: userId }, secret, {
        expiresIn: jwtConfig.accessTokenExpire,
    });
};

// Generate Refresh Token
export const generateRefreshToken = (userId) => {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
        throw new Error('JWT_REFRESH_SECRET is not defined in environment variables');
    }
    return jwt.sign({ id: userId }, secret, {
        expiresIn: jwtConfig.refreshTokenExpire,
    });
};

// Verify Access Token
export const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, jwtConfig.secret);
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
};

// Verify Refresh Token
export const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, jwtConfig.refreshSecret);
    } catch (error) {
        throw new Error('Invalid or expired refresh token');
    }
};

// Generate QR Code Token (for table QR codes)
export const generateQRToken = (tableId, restaurantId) => {
    return jwt.sign(
        {
            tableId,
            restaurantId,
            type: 'qr_table'
        },
        process.env.QR_CODE_SECRET,
        { expiresIn: '365d' } // QR codes valid for 1 year
    );
};

// Verify QR Code Token
export const verifyQRToken = (token) => {
    try {
        return jwt.verify(token, process.env.QR_CODE_SECRET);
    } catch (error) {
        throw new Error('Invalid or expired QR code');
    }
};

export default {
    jwtConfig,
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    generateQRToken,
    verifyQRToken,
};
