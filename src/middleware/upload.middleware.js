const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Créer les dossiers uploads s'ils n'existent pas
const uploadDir = path.join(__dirname, '../../public/uploads/products');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
const serviceUploadDir = path.join(__dirname, '../../public/uploads/services');
if (!fs.existsSync(serviceUploadDir)) {
    fs.mkdirSync(serviceUploadDir, { recursive: true });
}
const blogUploadDir = path.join(__dirname, '../../public/uploads/blog');
if (!fs.existsSync(blogUploadDir)) {
    fs.mkdirSync(blogUploadDir, { recursive: true });
}

// Configuration du stockage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `product-${uniqueSuffix}${ext}`);
    }
});

// Filtrer les types de fichiers
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Seules les images (JPEG, JPG, PNG, WEBP) sont autorisées'));
    }
};

// Configuration multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
    },
    fileFilter: fileFilter
});

// Configuration stockage services
const serviceStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, serviceUploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `service-${uniqueSuffix}${ext}`);
    }
});

const serviceUpload = multer({
    storage: serviceStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter
});

// Configuration stockage blog
const blogStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, blogUploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `blog-${uniqueSuffix}${ext}`);
    }
});

const blogUpload = multer({
    storage: blogStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter
});

module.exports = {
    uploadSingle: upload.single('image'),
    uploadMultiple: upload.array('images', 6),
    uploadServiceImage: serviceUpload.single('image'),
    uploadBlogImage: blogUpload.single('image')
};
