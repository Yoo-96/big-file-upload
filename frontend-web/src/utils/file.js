import SparkMD5 from 'spark-md5';

/**
 * 创建文件分片
 * @param {*} file 文件
 * @param {number} chunkSize 分片大小
 * @returns 分片数据
 */
const createFileChunk = (file, chunkSize) => {
  const chunkResult = [];
  let sliceIndex = 0;
  for (let i = 0; i < file.size; i+=chunkSize) {
    chunkResult.push({
      sliceIndex,
      file: file.slice(i, i + chunkSize),
    });
    sliceIndex += 1;
  }
  return chunkResult;
}

/**
 * 获取文件hash
 * @param {*} file 文件
 * @returns 文件hash
 */
const getFileHash = (file) => {
  return new Promise((resolve, reject) => {
    console.log('开始计算');

    const spark = new SparkMD5();
    const time = new Date().getTime();

    const fileReader = new FileReader();
    fileReader.readAsBinaryString(file);

    fileReader.onload = () => {
      const fileHash = spark.end()
      console.log(`计算结束，耗时：${new Date().getTime() - time} ms`);
      spark.destroy();
      resolve(fileHash);
    }

    fileReader.onerror = error => {
      reject(error);
    }
  })
}

/**
 * 根据分片获取文件hash
 * @param {array} chunks 文件分片
 * @returns 文件hash
 */
const getChunkFileHash = (chunks) => {
  return new Promise((resolve, reject) => {
    console.log('开始计算');

    const spark = new SparkMD5();
    const time = new Date().getTime();
  
    function read(i) {
      if (i >= chunks.length) {
        const fileHash = spark.end();
        console.log(`计算结束，耗时：${new Date().getTime() - time} ms`);
        resolve(fileHash);
        return;
      };
  
      const fileReader = new FileReader();
      const blob = chunks[i].file;
  
      fileReader.onload = e => {
        spark.append(e.target.result);
  
        read(i + 1)
      }
  
      fileReader.onerror = error => {
        reject(error);
      }
  
      fileReader.readAsArrayBuffer(blob);
    }
  
    read(0);
  })
};


export {
  createFileChunk,
  getFileHash,
  getChunkFileHash,
}
