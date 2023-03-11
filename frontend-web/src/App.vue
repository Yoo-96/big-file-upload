<template>
  <div>
    <input type="file" @change="onChangeFile" />
    <button @click="handleStartUpload">开始上传</button>
    <button @click="handleMerge">合并分片</button>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { createFileChunk, getChunkFileHash } from '@/utils/file.js';
import uploadRequest from '@/utils/mapUpload.js';
import { fetchMergeChunks, fetchCheckFile } from '@/api/file.js';

export default defineComponent({
  name: 'App',
  setup() {
    const currentFile = ref();
    const fileHash = ref('42ce75db34b5b9c5f69b630aeaff6201');
    // const fileHash = ref();
    const uploading = ref(false);

    const onChangeFile = (e) => {
      currentFile.value = e.target.files[0];
    };

    // 开始上传
    const handleStartUpload = async () => {
      if (!currentFile.value) {
        return ElMessage({
          message: '请上传文件',
          type: 'error',
        })
      }

      if (uploading.value) {
        return ElMessage({
          message: '上传中，请稍后...',
          type: 'warning',
        })
      }

      try {
        uploading.value = true;

        // 创建文件分片
        const chunkList = createFileChunk(currentFile.value, 1 * 1024 * 1024);

        // 获取文件hash
        const hash = await getChunkFileHash(chunkList);
        fileHash.value = hash;

        // 检测文件是否已上传
        const checkRes = await fetchCheckFile({
          fileHash: fileHash.value,
          fileName: currentFile.value.name,
        });
        const { complete, completeChunks = [] } = checkRes.data.data;

        // 文件已上传完成
        if (complete) {
          return ElMessage({
            message: '文件已上传完成',
            type: 'success',
          })
        }

        // 需要上传的分片
        const needToUploadChunks = chunkList.filter(item => !completeChunks.some(c => item.sliceIndex === Number(c)));

        // 分片上传
        const mapRes = await uploadRequest(needToUploadChunks, hash, currentFile.value.name, 5, (progress) => {
          console.log('progress: ', progress)
        })

        // 判断全部分片上传成功
        const uploadSuccess = mapRes.every(item => item.data.success);
        console.log('uploadSuccess : ', uploadSuccess);

        if (uploadSuccess) {
          const mergeResult = await fetchMergeChunks({ fileHash: fileHash.value, fileName: currentFile.value.name });
          if (mergeResult.data.success) {
            ElMessage({
              message: '文件上传成功',
              type: 'success',
            })
          }
        }
      } catch (e) {
        console.log(e);
      } finally {
        uploading.value = false;
      }
    };

    const handleMerge = async () => {
      try {
        const res = await fetchMergeChunks({ fileHash: fileHash.value, fileName: currentFile.value.name });
        console.log('handleMerge res: ', res);
      } catch(e) {
        console.log(err);
      }
    }

    return {
      onChangeFile,
      handleStartUpload,
      handleMerge,
    };
  },
});
</script>
<style lang="less" scoped></style>
