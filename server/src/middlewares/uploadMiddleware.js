const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../public/uploads/avatars');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Save file as user_id_timestamp.extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'avatar-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
    req.fileValidationError = 'Only image files are allowed!';
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

const avatarUpload = multer({ 
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: fileFilter
});

const videoUploadDir = path.join(__dirname, '../../public/uploads/videos');
if (!fs.existsSync(videoUploadDir)) {
  fs.mkdirSync(videoUploadDir, { recursive: true });
}

const videoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, videoUploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'video-' + uniqueSuffix + ext);
  }
});

const videoFileFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(mp4|MP4|mov|MOV|avi|AVI|mkv|MKV|webm|WEBM)$/)) {
    req.fileValidationError = 'Only video files are allowed!';
    return cb(new Error('Only video files are allowed!'), false);
  }
  cb(null, true);
};

const videoUpload = multer({
  storage: videoStorage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2GB limit
  fileFilter: videoFileFilter
});

module.exports = { avatarUpload, videoUpload };
