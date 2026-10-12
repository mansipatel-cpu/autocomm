export const successResponse = (res, data = null, message = null, statusCode = 200) => {
  const response = {
    success: true,
  };
  if (data !== null && data !== undefined) {
    response.data = data;
  }
  if (message) {
    response.message = message;
  }
  return res.status(statusCode).json(response);
};

export const createdResponse = (res, data, message = 'Resource created successfully') => {
  return successResponse(res, data, message, 201);
};
