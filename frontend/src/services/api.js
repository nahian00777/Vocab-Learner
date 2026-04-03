import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Mountains API
export const getMountains = () => api.get('/mountains');
export const getMountain = (id) => api.get(`/mountains/${id}`);
export const createMountain = (data) => api.post('/mountains', data);
export const updateMountain = (id, data) => api.put(`/mountains/${id}`, data);
export const deleteMountain = (id) => api.delete(`/mountains/${id}`);

// Words API
export const addWord = (mountainId, groupNumber, wordData) => 
  api.post(`/words/${mountainId}/${groupNumber}`, wordData);
export const updateWord = (mountainId, groupNumber, wordIndex, wordData) => 
  api.put(`/words/${mountainId}/${groupNumber}/${wordIndex}`, wordData);
export const deleteWord = (mountainId, groupNumber, wordIndex) => 
  api.delete(`/words/${mountainId}/${groupNumber}/${wordIndex}`);

// Progress API
export const getProgress = (mountainId) => api.get(`/progress/${mountainId}`);
export const updateDay = (mountainId, currentDay) => 
  api.patch(`/progress/${mountainId}/day`, { currentDay });
export const updateWordStatus = (mountainId, word, status, dayLearned) => 
  api.patch(`/progress/${mountainId}/word-status`, { word, status, dayLearned });
export const resetWord = (mountainId, word) => 
  api.patch(`/progress/${mountainId}/reset-word`, { word });
export const resetDay = (mountainId, day) => 
  api.patch(`/progress/${mountainId}/reset-day`, { day });
export const resetAll = (mountainId) => 
  api.patch(`/progress/${mountainId}/reset-all`);
export const updateSettings = (mountainId, settings) => 
  api.patch(`/progress/${mountainId}/settings`, settings);

export default api;
