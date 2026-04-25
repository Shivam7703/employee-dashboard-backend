const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../models/RefreshToken');

class TokenService {
  // Generate access token (15 minutes)
  generateAccessToken(userId, role) {
    return jwt.sign(
      { userId, role, type: 'access' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
  }

  // Generate refresh token (7 days)
  generateRefreshToken(userId, role) {
    return jwt.sign(
      { userId, role, type: 'refresh', jti: crypto.randomBytes(16).toString('hex') },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
  }

  // Generate both tokens
  async generateTokens(userId, role, deviceInfo = null) {
    const accessToken = this.generateAccessToken(userId, role);
    const refreshToken = this.generateRefreshToken(userId, role);
    
    // Store refresh token in database
    const decoded = jwt.decode(refreshToken);
    await RefreshToken.create({
      token: refreshToken,
      userId,
      expiresAt: new Date(decoded.exp * 1000),
      deviceInfo
    });
    
    return { accessToken, refreshToken };
  }

  // Refresh access token
  async refreshAccessToken(refreshToken, deviceInfo = null) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      
      // Check if token exists and is valid in database
      const storedToken = await RefreshToken.findOne({
        token: refreshToken,
        userId: decoded.userId,
        isRevoked: false,
        expiresAt: { $gt: new Date() }
      });
      
      if (!storedToken) {
        throw new Error('Invalid or expired refresh token');
      }
      
      // Update last used timestamp
      storedToken.lastUsedAt = new Date();
      await storedToken.save();
      
      // Generate new tokens
      const newAccessToken = this.generateAccessToken(decoded.userId, decoded.role);
      const newRefreshToken = this.generateRefreshToken(decoded.userId, decoded.role);
      
      // Revoke old refresh token
      await storedToken.revoke('replaced');
      
      // Store new refresh token
      const newDecoded = jwt.decode(newRefreshToken);
      await RefreshToken.create({
        token: newRefreshToken,
        userId: decoded.userId,
        expiresAt: new Date(newDecoded.exp * 1000),
        deviceInfo
      });
      
      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  // Verify access token
  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }
      return decoded;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  // Logout - revoke refresh token
  async logout(refreshToken) {
    const token = await RefreshToken.findOne({ token: refreshToken });
    if (token) {
      await token.revoke('logout');
    }
    return true;
  }

  // Generate password reset token
  generatePasswordResetToken() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    return { resetToken, resetTokenExpire };
  }

  // Hash reset token for storage
  hashResetToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

module.exports = new TokenService();