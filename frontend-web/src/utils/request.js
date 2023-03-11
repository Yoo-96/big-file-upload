import axios from "axios";

const service = axios.create({
  baseURL: "",
  timeout: 60000,
  transformRequest(data) {
    return Qs.stringify(data);
  },
  headers: {
    "Cache-Control": "no-cache",
    "Content-Type": "application/x-www-form-urlencoded",
    "X-Requested-With": "XMLHttpRequest",
  },
});

service.interceptors.request.use(
  (config) => {
    if (config.method === "get") {
      config.params = {
        _t: new Date().getTime(),
        ...config.params,
      };
    }

    return config;
  },
  (error) => Promise.reject(error)
);

service.interceptors.response.use(
  (res) => {
    const { data, config } = res;
    if ((!data.success || data.success === "false") && data.code !== 200) {
      const message = data.errorMessage || data.message || "系统异常";

      ElMessage({
        message,
        type: 'error',
      })

      return Promise.reject(new Error("请求失败"));
    }

    return data || {};
  },
  (error) => {
    ElMessage({
      message: '系统异常',
      type: 'error',
    })
    return Promise.reject(error);
  }
);

export default service;
