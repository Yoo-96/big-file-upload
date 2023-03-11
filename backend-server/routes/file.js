const express = require('express');
const router = express.Router();
const fs = require('fs');
const multiparty = require('multiparty');
const path = require('path');
const {
  DEFAULT_FILE_PATH,
  CHUNK_FOLDER_PREFIX,
  mergeChunks,
  getFileExtension,
  filterIsNotChunks,
} = require('../utils/file');

// 分片上传
router.post('/upload', function(req, res, next) {
  const form = new multiparty.Form({
    uploadDir: DEFAULT_FILE_PATH,
  })

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).send({
        success: false,
        message: err,
      })
    }

    const [fileHash] = fields.fileHash;
    const [fileName] = fields.fileName;
    const [sliceIndex] = fields.sliceIndex;
    const [file] = files.file;
    
    // 生成分片存放路径
    const chunkFolderPath = path.join(DEFAULT_FILE_PATH, `${CHUNK_FOLDER_PREFIX}${fileHash}`);

    // 判断存放文件夹是否存在
    if (!fs.existsSync(chunkFolderPath)) {
      fs.mkdirSync(chunkFolderPath)
    }

    await fs.renameSync(file.path, path.resolve(__dirname, `${chunkFolderPath}/${sliceIndex}`));

    res.send({
      success: true,
      message: '上传成功',
    })
  })
});

// 分片合并
router.post('/mergeChunks', async function(req, res, next) {
  const { fileHash, fileName } = req.body

  if (!fileHash || !fileName) {
    return res.status(500).send({
      success: false,
      message: '参数缺失',
    })
  }

  const result = await mergeChunks(fileHash, fileName);
  if (result.success) {
    return res.send({
      success: true,
      message: '合并成功',
    })
  }

  return res.status(500).send({
    success: false,
    message: result.message,
  })
});

// 检测文件是否已上传
router.get('/checkFile', async function(req, res, next) {
  const { fileHash, fileName } = req.query;
  console.log('query: ', fileHash, fileName);

  if (!fileHash || !fileName) {
    return res.status(500).send({
      success: false,
      message: '参数缺失',
    })
  }

  const extension = getFileExtension(fileName);
  const filePath = path.join(DEFAULT_FILE_PATH, `${fileHash}.${extension}`);

  // 判断存放文件夹是否存在
  if (fs.existsSync(filePath)) {
    return res.send({
      success: true,
      data: {
        completeChunks: [],
        complete: true,
      },
      message: '文件已上传完成',
    })
  }

  // 获取已经上传完成的分片
  const chunkFolderPath = path.join(DEFAULT_FILE_PATH, `${CHUNK_FOLDER_PREFIX}${fileHash}`);
  if (fs.existsSync(chunkFolderPath)) {
    const chunks = fs.readdirSync(chunkFolderPath);
    const completeChunks = filterIsNotChunks(chunks);
    return res.send({
      success: true,
      data: {
        completeChunks,
        complete: false,
      },
      message: '文件部分分片已上传',
    })
  }
  
  return res.send({
    success: true,
    message: '文件未上传过',
  })
});


module.exports = router;
