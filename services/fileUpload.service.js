const { v4: uuidv4 } = require('uuid')
const sharp = require('sharp')
const path = require('path');
const { uploadFile } = require('./storage.service')

const handleFilesUpload = async (files) => {
    const uploadedFiles = {
        image: [],
        other: []
    };

    for (let file of files) {
        if (!file || !file.buffer || !file.mimetype) {
            // Skip invalid file objects
            continue;
        }

        const { buffer, mimetype, originalname } = file;

        if (mimetype.startsWith('image/')) {
            const uniqueFileName = `${uuidv4()}.webp`;

            const webpBuffer = await sharp(buffer)
                .resize(1028, 768, {
                    fit: sharp.fit.inside,
                    withoutEnlargement: true
                })
                .webp()
                .toBuffer();

            await uploadFile(webpBuffer, uniqueFileName, 'image/webp');
            uploadedFiles.image.push(uniqueFileName);
        } else {
            const ext = path.extname(originalname || '') || '';
            const uniqueFileName = `${uuidv4()}${ext}`;

            await uploadFile(buffer, uniqueFileName, mimetype);
            uploadedFiles.other.push(uniqueFileName);
        }
    }

    return uploadedFiles;
};

module.exports = {
    handleFilesUpload
}