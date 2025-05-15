
require('dotenv').config()

const { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')

const bucketName = process.env.AWS_BUCKET
const region = process.env.AWS_REGION
const accessKeyId = process.env.AWS_ACCESS_KEY_ID
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
})

function uploadFile(fileBuffer, fileName, mimetype) {
  const uploadParams = {
    Bucket: bucketName,
    Body: fileBuffer,
    Key: fileName,
    ContentType: mimetype,
    ACL: 'public-read'
  }

  return s3Client.send(new PutObjectCommand(uploadParams))
}

function deleteFile(fileName) {
  const deleteParams = {
    Bucket: bucketName,
    Key: fileName,
  };

  return s3Client.send(new DeleteObjectCommand(deleteParams));
}

async function getObjectSignedUrl(key) {
  const params = {
    Bucket: bucketName,
    Key: key,
  }

  const command = new GetObjectCommand(params)
  const url = await getSignedUrl(s3Client, command)

  return url
}

async function listFiles() {
  const params = {
    Bucket: bucketName,
  }

  try {
    const data = await s3Client.send(new ListObjectsV2Command(params))

    if (!data.Contents || data.Contents.length === 0) {
      console.log('No files found in the bucket')
      return { message: 'No files found in the bucket' } 
    }

    return data.Contents.map((file) => ({
      fileName: file.Key,
      lastModified: file.LastModified,
      size: file.Size,
    }))

  } catch (error) {
    console.error('Error listing files:', error)
    throw error
  }
}

module.exports = { 
    uploadFile,
    deleteFile, 
    getObjectSignedUrl, 
    listFiles 
}
