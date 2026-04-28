const authService = require('./auth.service');

function adminCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

function setAdminAuthCookie(res, token) {
  res.cookie('parsom_admin_token', token, adminCookieOptions());
}

function clearAdminAuthCookie(res) {
  res.clearCookie('parsom_admin_token', {
    ...adminCookieOptions(),
    maxAge: undefined,
  });
}

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

async function googleLogin(req, res, next) {
  try {
    const result = await authService.loginWithGoogle(req.body);

    res.status(200).json({
      success: true,
      message: 'Google login successful.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function checkPhone(req, res, next) {
  try {
    const result = await authService.checkUserByPhone(req.body);

    res.status(200).json({
      success: true,
      message: 'Continue to the next sign-in step.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function phoneLogin(req, res, next) {
  try {
    const result = await authService.loginUserWithPhone(req.body);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function adminLogin(req, res, next) {
  try {
    const result = await authService.loginAdmin(req.body);
    setAdminAuthCookie(res, result.token);

    res.status(200).json({
      success: true,
      message: 'Admin login successful.',
      data: {
        admin: result.admin,
      }
    });
  } catch (error) {
    next(error);
  }
}

async function adminLogout(req, res, next) {
  try {
    clearAdminAuthCookie(res);

    res.status(200).json({
      success: true,
      message: 'Admin logout successful.',
      data: {
        loggedOut: true,
      },
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

async function changePassword(req, res, next) {
  try {
    const result = await authService.changePassword(req.user, req.body);

    res.status(200).json({
      success: true,
      message: 'Password updated successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteAccount(req, res, next) {
  try {
    const result = await authService.deleteAccount(req.user, req.body);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  checkPhone,
  phoneLogin,
  googleLogin,
  adminLogin,
  adminLogout,
  me,
  changePassword,
  deleteAccount,
};
