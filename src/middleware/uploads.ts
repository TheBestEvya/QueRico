import multer from 'multer';
import path from 'path';
import fs from 'fs';
import env from 'dotenv';

const uploadDir = 'public/uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
// הגדרת אחסון הקבצים
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
try{
    const { name, email, text } = req.body;
    if(text){
      cb(null, file.originalname);
    }
    else{
    
     // Sanitize name and email to prevent invalid filenames
     const sanitizedName = name.replace(/[^a-zA-Z0-9-_]/g, '');
     const sanitizedEmail = email.replace(/[^a-zA-Z0-9-_]/g, '');
     const fileName = `${sanitizedName}_${sanitizedEmail}_${path.extname(file.originalname)}`;
     cb(null, fileName);
    }
    } catch (error) {
      cb(error as Error, '');
    }
  }
});
// פילטר קבצים
const fileFilter = (req: any, file: any, cb: any) => {
  if (!file) {
    return cb(null, false); // Skip Multer processing if there's no file
  }
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};
export const uploadImage = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});