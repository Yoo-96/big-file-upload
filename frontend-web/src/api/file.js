import axios from 'axios';

// 文件上传
export const uploadFile = ({ formData, onUploadProgress, callback }) => {
  axios.post('/api/file/upload', formData, {
    onUploadProgress,
  }).then((res) => {
    callback(null, {
      data: res.data,
    })
  }).catch(function (error) {
    callback(null, {
      data: error.response.data,
    })
  });
}

// 合并分片
export const fetchMergeChunks = async (data) => {
  return new Promise((resolve, reject) => {
    axios.post('/api/file/mergeChunks', data).then((res) => {
      resolve(res);
    }).catch(function (error) {
      reject(error);
    });
  })
}

// 检测文件是否已上传
export const fetchCheckFile = async (params) => {
  return new Promise((resolve, reject) => {
    axios.get('/api/file/checkFile', { params }).then((res) => {
      resolve(res);
    }).catch(function (error) {
      reject(error);
    });
  })
}
