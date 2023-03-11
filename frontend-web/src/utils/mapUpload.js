import mapLimit from 'async/mapLimit';
import { uploadFile } from '@/api/file.js';

/**
 * 分片并发上传
 * @param {array} chunkList 分片数据
 * @param {string} fileHash 文件hash
 * @param {string} fileName 文件原始名称
 * @param {number} limit 最大上传并发
 * @param {functon=} upadteProgress 上传进度
 * @returns 
 */
const mapUpload = (chunkList, fileHash, fileName, limit = 5, upadteProgress) => {
  return new Promise((resolve, reject) => {
    mapLimit(
      chunkList,
      limit,
      ({ sliceIndex, file }, callback) => {
        const formData = new FormData();
        formData.append('fileHash', fileHash);
        formData.append('fileName', fileName);
        formData.append('sliceIndex', sliceIndex);
        formData.append('file', file);

        uploadFile({
          formData,
          onUploadProgress: (progressEvent) => {
            upadteProgress(progressEvent);
          },
          callback: (_, res) => {
            callback(_, {
              sliceIndex,
              ...res,
            });
          },
        })
      },
      (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      }
    )
  })
}

export default mapUpload;
