const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // TTL index
  },
  isRevoked: {
    type: Boolean,
    default: false,
    index: true
  },
  deviceInfo: {
    userAgent: String,
    ipAddress: String,
    platform: String
  },
  lastUsedAt: Date,
  revokedAt: Date,
  revokedReason: {
    type: String,
    enum: ['logout', 'expired', 'replaced', 'suspicious'],
    default: 'logout'
  }
}, {
  timestamps: true
});

// Instance method to revoke token
// refreshTokenSchema.methods.revoke = async function(reason = 'logout') {
//   this.isRevoked = true;
//   this.revokedAt = new Date();
//   this.revokedReason = reason;
//   return await this.save();
// };

// Static method to revoke all user tokens
// refreshTokenSchema.statics.revokeAllUserTokens = async function(userId, reason = 'logout') {
//   return await this.updateMany(
//     { userId, isRevoked: false },
//     { isRevoked: true, revokedAt: new Date(), revokedReason: reason }
//   );
// };

// Static method to find valid token
// refreshTokenSchema.statics.findValidToken = async function(token, userId) {
//   return await this.findOne({
//     token,
//     userId,
//     isRevoked: false,
//     expiresAt: { $gt: new Date() }
//   });
// };

// Clean up expired tokens (runs automatically via TTL)
refreshTokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);