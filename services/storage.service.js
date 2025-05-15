require('dotenv').config()

const s3Storage = require('./s3.service.js')
const localFileStorage = require('./localFileStorage.service.js')

const storageDriver = process.env.STORAGE_DRIVER || (process.env.NODE_ENV === 'development' ? 'local' : 's3')

if (storageDriver === 's3') {
  const requiredS3Vars = ['AWS_BUCKET', 'AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY']
  const missingVars = requiredS3Vars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    console.error(`Error: Missing required S3 environment variables: ${missingVars.join(', ')}`)
    console.error('Please set these variables in your .env file or environment')
    process.exit(1) 
  }
}

const storage = storageDriver === 's3' ? s3Storage : localFileStorage

console.log(`Using ${storageDriver.toUpperCase()} storage driver`)

module.exports = storage