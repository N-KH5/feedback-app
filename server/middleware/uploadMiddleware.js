const path = require("path");
const multer = require("multer");

const uploadDirectory = path.join(
  __dirname,
  "..",
  "uploads"
);

const storage = multer.diskStorage({
  destination: (
    req,
    file,
    callback
  ) => {
    callback(null, uploadDirectory);
  },

  filename: (
    req,
    file,
    callback
  ) => {
    const fileExtension =
      path.extname(
        file.originalname
      ).toLowerCase();

    const uniqueFileName =
      `${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}${fileExtension}`;

    callback(
      null,
      uniqueFileName
    );
  },
});

const allowedMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const fileFilter = (
  req,
  file,
  callback
) => {
  if (
    allowedMimeTypes.includes(
      file.mimetype
    )
  ) {
    callback(null, true);
    return;
  }

  const error = new Error(
    "Only PDF, JPG, JPEG, PNG and WEBP files are allowed"
  );

  error.status = 400;

  callback(error);
};

const uploadModuleMaterials =
  multer({
    storage,

    limits: {
      fileSize:
        10 * 1024 * 1024,
      files: 10,
    },

    fileFilter,
  }).array("materials", 10);

module.exports = {
  uploadModuleMaterials,
};