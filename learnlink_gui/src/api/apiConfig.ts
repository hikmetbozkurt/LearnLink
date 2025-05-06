// learnlink_gui/src/api/apiConfig.ts
// Temporarily use local API for testing
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? "http://localhost:5001"
  : (process.env.REACT_APP_API_URL || "https://api.golearnlink.com");

console.log('Using API base URL:', API_BASE_URL);

export default API_BASE_URL;