
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const crypto = require('crypto');

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

const base_url = process.env.base_url;
const storagePath = process.env.STORAGE_PATH || './uploads';
const absoluteStoragePath = path.resolve(storagePath);

async function ensureDirectoryExists() {
  try {
    await mkdir(absoluteStoragePath, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
}

ensureDirectoryExists();

async function uploadFile(fileBuffer, fileName, mimetype) {
  await ensureDirectoryExists();

  const filePath = path.join(absoluteStoragePath, fileName);
  await writeFile(filePath, fileBuffer);
  return { Key: fileName };
}

async function deleteFile(fileName) {
  const filePath = path.join(absoluteStoragePath, fileName);
  try {
    await unlink(filePath);
    return { success: true };
  } catch (error) {
    if (error.code === 'ENOENT') return { success: true };
    throw error;
  }
}

async function getObjectSignedUrl(key) {
  return `${base_url}/api/files/${key}`;
}

async function listFiles() {
  await ensureDirectoryExists();
  const files = await readdir(absoluteStoragePath);
  
  const fileDetails = await Promise.all(
    files.map(async (fileName) => {
      const filePath = path.join(absoluteStoragePath, fileName);
      const fileStats = await stat(filePath);
      
      // Get the signed URL for the file
      const fileUrl = await getObjectSignedUrl(fileName);
      
      return {
        fileName,
        lastModified: fileStats.mtime,
        size: fileStats.size,
        url: fileUrl, // Add the file URL to the response
      };
    })
  );
  
  return fileDetails;
}

async function cleanupOldFiles(maxAgeInDays = 30) {
  await ensureDirectoryExists();
  const files = await readdir(absoluteStoragePath);
  const now = new Date();

  for (const fileName of files) {
    const filePath = path.join(absoluteStoragePath, fileName);
    const fileStats = await stat(filePath);
    const fileAge = (now - fileStats.mtime) / (1000 * 60 * 60 * 24);
    if (fileAge > maxAgeInDays) await unlink(filePath);
  }

  return { success: true, message: 'Cleanup completed' };
}

module.exports = {
  uploadFile,
  deleteFile,
  getObjectSignedUrl,
  listFiles,
  cleanupOldFiles
};
