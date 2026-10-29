import axios from 'axios';
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', withCredentials: true, headers: { 'Content-Type': 'application/json' } });
api.interceptors.response.use(response => response, error => {
  const message = error.response?.data?.error?.message || error.message || 'Unable to reach the server.';
  return Promise.reject(Object.assign(error, { userMessage: message }));
});
export const getData = (response) => response.data.data;
