const authService = require('./auth.service');

async function register(req, res, next) {
  try {
    const result = await authService.registerUser(req.body);

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.loginUser(req.body);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function adminLogin(req, res, next) {
  try {
    const result = await authService.loginAdmin(req.body);

    res.status(200).json({
      success: true,
      message: 'Admin login successful.',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function me(req, res, next) {
  try {
    const actor = await authService.getCurrentActor(req.user);

    res.status(200).json({
      success: true,
      message: 'Current actor fetched successfully.',
      data: actor
    });
  } catch (error) {
    next(error);
  }
}

async function requestPasswordResetOtp(req, res, next) {
  try {
    const result = await authService.requestPasswordResetOtp(req.body);

    res.status(200).json({
      success: true,
      message: 'If the email exists, an OTP has been sent.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function resetPasswordWithOtp(req, res, next) {
  try {
    const result = await authService.resetPasswordWithOtp(req.body);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function requestWhatsappLoginOtp(req, res, next) {
  try {
    const result = await authService.requestWhatsappLoginOtp(req.body);

    res.status(200).json({
      success: true,
      message: 'WhatsApp OTP sent successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function verifyWhatsappLoginOtp(req, res, next) {
  try {
    const result = await authService.verifyWhatsappLoginOtp(req.body);

    res.status(200).json({
      success: true,
      message: 'WhatsApp login successful.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  adminLogin,
  me,
  requestPasswordResetOtp,
  resetPasswordWithOtp,
  requestWhatsappLoginOtp,
  verifyWhatsappLoginOtp,
};
