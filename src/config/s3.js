const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');

// Configure AWS
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'ap-south-1',
  signatureVersion: 'v4'
});

// Check if using local storage instead of S3
const useS3 = process.env.STORAGE_TYPE === 's3' && process.env.AWS_ACCESS_KEY_ID;

// Local storage configuration (fallback)
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads';
    if (!require('fs').existsSync(dir)) {
      require('fs').mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// S3 storage configuration
const s3Storage = multerS3({
  s3: s3,
  bucket: process.env.AWS_S3_BUCKET_NAME,
  acl: 'private',
  metadata: (req, file, cb) => {
    cb(null, { fieldName: file.fieldname });
  },
  key: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const folder = req.user?.role === 'admin' ? 'payslips' : 'uploads';
    cb(null, `${folder}/${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Multer configuration
const upload = multer({
  storage: useS3 ? s3Storage : localStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDF, and DOC files are allowed'));
    }
  }
});

// Generate signed URL for private files
const getSignedUrl = async (key, expiresIn = 3600) => {
  if (!useS3) {
    // Return local URL if using local storage
    return `${process.env.BASE_URL || 'https://employee-dashboard-backend-7h53.onrender.com/'}/uploads/${key.split('/').pop()}`;
  }
  
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
    Expires: expiresIn
  };
  
  try {
    const url = await s3.getSignedUrlPromise('getObject', params);
    return url;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw error;
  }
};

// Delete file from S3
const deleteFile = async (key) => {
  if (!useS3) {
    // Delete local file
    const fs = require('fs');
    const filePath = path.join('./uploads', key.split('/').pop());
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return true;
  }
  
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key
  };
  
  try {
    await s3.deleteObject(params).promise();
    return true;
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    return false;
  }
};

module.exports = {
  upload,
  s3,
  getSignedUrl,
  deleteFile,
  useS3
};