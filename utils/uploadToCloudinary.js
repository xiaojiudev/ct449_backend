const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRECT,
    secure: true,
})


const uploadImageToCloudinary = async (imagePath) => {

    const options = {
        use_filename: true,
        unique_filename: false,
        overwrite: true,
        quality: "auto:good",
        folder: process.env.CLOUDINARY_FOLDER
    };

    try {
        // Upload the image
        const result = await cloudinary.uploader.upload(imagePath, options);

        // const sampleResult = {
        //     asset_id: '3e1adf7872e211c6a850445c5cab6b40',
        //     public_id: 'avatar1',
        //     version: 1698571223,
        //     version_id: 'b93ea20ae09c54fbfd6fcd12d6fbfca5',
        //     signature: 'b372a586eb47b832c1621a399f491df64721f50d',
        //     width: 4096,
        //     height: 2730,
        //     format: 'jpg',
        //     resource_type: 'image',
        //     created_at: '2023-10-29T09:19:30Z',
        //     tags: [],
        //     bytes: 660360,
        //     type: 'upload',
        //     etag: '72b818444be6c4117f386a6402ef664f',
        //     placeholder: false,
        //     url: 'http://res.cloudinary.com/de8xbko8y/image/upload/v1698571223/avatar1.jpg',
        //     secure_url: 'https://res.cloudinary.com/de8xbko8y/image/upload/v1698571223/avatar1.jpg',
        //     folder: '',
        //     access_mode: 'public',
        //     overwritten: true,
        //     original_filename: 'avatar1',
        //     api_key: '935182757719512'
        // }

        // After successfully uploading, delete the temp file
        fs.unlink(imagePath, (err) => {
            if (err) {
                console.error(`Error deleting temp file: ${imagePath}`);
            } else {
                console.log(`Temp file deleted: ${imagePath}`);
            }
        });

        return result;
    } catch (error) {
        console.error(error);
    }
};

const deleteImageFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        // { result: 'ok' }
        return result;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

const extractPublicId = (url) => {
    const firstIndex = url.indexOf(process.env.CLOUDINARY_FOLDER);
    const lastIndex = url.lastIndexOf(".");

    if (url !== null) {
        return url.substring(firstIndex, lastIndex);
    }

    return null;
}

module.exports = {
    uploadImageToCloudinary,
    deleteImageFromCloudinary,
    extractPublicId,
}