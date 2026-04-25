// Helper functions for common operations

// Format date to YYYY-MM-DD
const formatDate = (date) => {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

// Calculate working days between two dates
const calculateWorkingDays = (startDate, endDate) => {
  let count = 0;
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude weekends
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
};

// Calculate age from date of birth
const calculateAge = (dob) => {
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Generate random password
const generateRandomPassword = (length = 8) => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Format currency
const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Get month name from month number
const getMonthName = (month) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month - 1];
};

// Calculate task completion rate
const calculateCompletionRate = (tasks) => {
  if (!tasks.length) return 0;
  const completed = tasks.filter(t => t.status === 'completed').length;
  return Math.round((completed / tasks.length) * 100);
};

// Pagination helper
const paginate = (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return {
    skip,
    limit: parseInt(limit),
    page: parseInt(page)
  };
};

// Generate pagination metadata
const paginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
};

// Sanitize HTML input
const sanitizeHtml = (html) => {
  return html.replace(/<[^>]*>/g, '').trim();
};

// Validate phone number
const validatePhoneNumber = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

// Get IP address from request
const getIpAddress = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.socket?.remoteAddress || 
         req.ip;
};

// Get user agent details
const parseUserAgent = (userAgent) => {
  const ua = userAgent || '';
  const isMobile = /mobile/i.test(ua);
  const isTablet = /tablet/i.test(ua);
  const isDesktop = !isMobile && !isTablet;
  
  let platform = 'Unknown';
  if (/windows/i.test(ua)) platform = 'Windows';
  else if (/mac/i.test(ua)) platform = 'MacOS';
  else if (/linux/i.test(ua)) platform = 'Linux';
  else if (/android/i.test(ua)) platform = 'Android';
  else if (/ios|iphone|ipad/i.test(ua)) platform = 'iOS';
  
  return { platform, isMobile, isTablet, isDesktop };
};

module.exports = {
  formatDate,
  calculateWorkingDays,
  calculateAge,
  generateRandomPassword,
  formatCurrency,
  getMonthName,
  calculateCompletionRate,
  paginate,
  paginationMeta,
  sanitizeHtml,
  validatePhoneNumber,
  getIpAddress,
  parseUserAgent
};