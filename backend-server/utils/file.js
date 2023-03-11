const fs = require('fs');
const path = require('path');

// 文件默认存放路径
const DEFAULT_FILE_PATH = path.resolve(__dirname, '../temp');

// 分片前缀
const CHUNK_FOLDER_PREFIX = 'chunk-';

/**
 * 分片写入
 * @param {*} currentReadStream 分片文件写入流
 * @returns 
 */
const merge = (currentReadStream, currentChunkIndex) => {
  return new Promise((resolve, reject) => {
    // 监听error事件
    currentReadStream.on('error', err => {
      currentReadStream.destroy();
      resolve({
        success: false,
        message: err,
      })
    });

    // 监听写入完成事件
    currentReadStream.on('end', () => {
      resolve({
        success: true,
      })
    });
  })
}

/**
 * 合并分片
 * @param {string} fileHash 文件hash
 * @param {string} fileName 源文件名
 * @returns 
 */
const mergeChunks = (fileHash, fileName) => {
  let currentChunkIndex = 0;

  return new Promise(async (resolve, reject) => {

    // 分片所在文件夹
    const chunkFolder = `${CHUNK_FOLDER_PREFIX}${fileHash}`;
    const chunkFolderPath = path.join(DEFAULT_FILE_PATH, chunkFolder);

    if (!fs.existsSync(chunkFolderPath)) {
      return resolve({
        success: false,
        message: '文件不存在',
      })
    }

    // 所有分片合并成功标示
    let mergeSuccess = false;
    let mergeMessage = '合并成功';

    // 获取所有分片名称
    const chunks = filterIsNotChunks(fs.readdirSync(chunkFolderPath));

    const extension = getFileExtension(fileName);
    const writerFileName = `${fileHash}.${extension}`;

    // 创建文件写入流
    const writerStream = fs.createWriteStream(path.resolve(DEFAULT_FILE_PATH, writerFileName));
    console.log('currentChunkIndex: ', currentChunkIndex, chunks.length, chunks);

    while (currentChunkIndex < chunks.length) {
      // 当前分片路径
      const currentChunk = path.join(DEFAULT_FILE_PATH, chunkFolder, currentChunkIndex.toString());

      // 获取当前分片文件流
      const currentReadStream = fs.createReadStream(currentChunk);
      currentReadStream.pipe(writerStream, { end: false });

      const mergeResult = await merge(currentReadStream);
      if (mergeResult.success) {
        currentChunkIndex++;
        mergeSuccess = true;
      } else {
        mergeSuccess = false;
        mergeMessage = mergeResult.message;
        currentChunkIndex = chunks.length;
      }
    }

    if (mergeSuccess) {
      removeChunksFolder(chunkFolder);
    } else {
      fs.unlinkSync(path.resolve(DEFAULT_FILE_PATH, writerFileName));
    }

    resolve({
      success: mergeSuccess,
      message: mergeMessage,
    })
  })
}

/**
 * 删除分片文件夹
 * @param {string} chunkFolder 文件夹名称
 */
const removeChunksFolder = (chunkFolder) => {
  const chunkFolderPath = path.join(DEFAULT_FILE_PATH, chunkFolder);
  const chunks = fs.readdirSync(chunkFolderPath)
  for (let i = 0; i < chunks.length; i++) {
    fs.unlinkSync(path.resolve(DEFAULT_FILE_PATH, chunkFolder, chunks[i]));
  }
  fs.rmdirSync(path.resolve(DEFAULT_FILE_PATH, chunkFolder));
}

/**
 * 获取文件后缀名
 * @param {string} fileName 
 * @returns 
 */
const getFileExtension = (fileName) => {
  if (fileName) {
    return fileName.substring(fileName.lastIndexOf('.') + 1);
  }
  return '';
}

/**
 * 排序过滤非分片文件
 * @param {array} chunks 分片名称数组
 * @returns 
 */
const filterIsNotChunks = (chunks) => {
  return chunks.sort((a, b) => a - b).filter(item => !isNaN(Number(item)))
}

module.exports = {
  DEFAULT_FILE_PATH,
  CHUNK_FOLDER_PREFIX,
  mergeChunks,
  getFileExtension,
  filterIsNotChunks,
}