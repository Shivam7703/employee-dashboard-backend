const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  registerEmployee,
  login,
  refreshToken,
  logout,
  changePassword
} = require('../controllers/authController');

router.post('/register', protect, adminOnly, registerEmployee);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.post('/change-password', protect, changePassword);
// Add this route for profile update
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phoneNumber, address } = req.body
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phoneNumber, address },
      { new: true }
    ).select('-password')
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
});
module.exports = router;

