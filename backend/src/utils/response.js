function success(response, data, message = 'Operation reussie', statusCode = 200, meta) {
  const payload = { success: true, message, data };
  if (meta) payload.meta = meta;
  return response.status(statusCode).json(payload);
}

function created(response, data, message = 'Ressource creee') {
  return success(response, data, message, 201);
}

module.exports = { success, created };
