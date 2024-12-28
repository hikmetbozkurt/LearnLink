export const handleApiError = (error: any) => {
  if (error.response?.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
    return;
  }
  
  return error.response?.data?.message || 'An error occurred';
}; 