export const createResponse = (success = true, data = null, error = null) => {
  return {
    success,
    ...(data && { data }),
    ...(error && { error: {
      message: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    }})
  }
} 