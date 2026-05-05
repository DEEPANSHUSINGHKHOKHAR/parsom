function sanitizeValue(value, key) {
  if (typeof value === 'string') {
    const sanitized = value.replace(/\0/g, '');

    if (key && /password/i.test(key)) {
      return sanitized;
    }

    return sanitized.trim();
  }

  if (Buffer.isBuffer(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, key));
  }

  if (value && typeof value === 'object') {
    return Object.keys(value).reduce((acc, key) => {
      acc[key] = sanitizeValue(value[key], key);
      return acc;
    }, {});
  }

  return value;
}

function sanitizeInput(req, res, next) {
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }

  if (req.query) {
    req.query = sanitizeValue(req.query);
  }

  if (req.params) {
    req.params = sanitizeValue(req.params);
  }

  next();
}

module.exports = sanitizeInput;
