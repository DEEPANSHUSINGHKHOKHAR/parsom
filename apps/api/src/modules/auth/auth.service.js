const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../../config/db');
const env = require('../../config/env');
const AppError = require('../../utils/app-error');
const crypto = require('crypto');
const { enqueueEmailJob } = require('../../jobs/notification.jobs');
const { sendWhatsappOtp } = require('../../utils/whatsapp-cloud');

function signToken(actor, role) {
  return jwt.sign(
    {
      sub: actor.id,
      role,
      email: actor.email
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

function sanitizeUser(user) {
  return {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    phone: user.phone,
    authProvider: user.auth_provider,
    role: 'user'
  };
}

function sanitizeAdmin(admin) {
  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role
  };
}

async function linkGuestOrdersToUser(user) {
  if (!user?.id || (!user.email && !user.phone)) {
    return;
  }

  await query(
    `
      UPDATE orders
      SET user_id = ?,
          updated_at = NOW()
      WHERE deleted_at IS NULL
        AND user_id IS NULL
        AND (
          (? IS NOT NULL AND LOWER(customer_email) = LOWER(?))
          OR
          (? IS NOT NULL AND customer_phone = ?)
        )
    `,
    [
      user.id,
      user.email || null,
      user.email || null,
      user.phone || null,
      user.phone || null,
    ]
  );
}

async function registerUser(payload) {
  const { firstName, lastName, email, phone, password } = payload;

  const existing = await query(
    `
      SELECT id
      FROM users
      WHERE deleted_at IS NULL
        AND (email = ? OR phone = ?)
      LIMIT 1
    `,
    [email, phone || null]
  );

  if (existing.length > 0) {
    throw new AppError(409, 'Email or phone already exists.');
  }

  const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

  const insertResult = await query(
    `
      INSERT INTO users (
        first_name,
        last_name,
        email,
        phone,
        password_hash,
        auth_provider
      )
      VALUES (?, ?, ?, ?, ?, 'email')
    `,
    [firstName, lastName, email, phone || null, passwordHash]
  );

  const rows = await query(
    `
      SELECT id, first_name, last_name, email, phone, auth_provider
      FROM users
      WHERE id = ?
      LIMIT 1
    `,
    [insertResult.insertId]
  );

  const user = rows[0];
  await linkGuestOrdersToUser(user);

  const token = signToken(user, 'user');

  return {
    user: sanitizeUser(user),
    token
  };
}

async function loginUser(payload) {
  const { email, password } = payload;

  const rows = await query(
    `
      SELECT *
      FROM users
      WHERE email = ?
        AND deleted_at IS NULL
        AND account_status = 'active'
      LIMIT 1
    `,
    [email]
  );

  const user = rows[0];

  if (!user || !user.password_hash) {
    throw new AppError(401, 'Invalid email or password.');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    throw new AppError(401, 'Invalid email or password.');
  }

  await query(
    `
      UPDATE users
      SET last_login_at = NOW()
      WHERE id = ?
    `,
    [user.id]
  );

  await linkGuestOrdersToUser(user);

  const token = signToken(user, 'user');

  return {
    user: sanitizeUser(user),
    token
  };
}

async function loginAdmin(payload) {
  const { email, password } = payload;

  const rows = await query(
    `
      SELECT
        id,
        full_name AS name,
        email,
        password_hash,
        role
      FROM admins
      WHERE email = ?
        AND deleted_at IS NULL
        AND account_status = 'active'
      LIMIT 1
    `,
    [email]
  );

  const admin = rows[0];

  if (!admin) {
    throw new AppError(401, 'Invalid admin credentials.');
  }

  const isPasswordValid = await bcrypt.compare(password, admin.password_hash);

  if (!isPasswordValid) {
    throw new AppError(401, 'Invalid admin credentials.');
  }

  await query(
    `
      UPDATE admins
      SET last_login_at = NOW()
      WHERE id = ?
    `,
    [admin.id]
  );

  const token = signToken(admin, admin.role);

  return {
    admin: sanitizeAdmin(admin),
    token
  };
}

async function getCurrentActor(actor) {
  if (actor.role === 'user') {
    const rows = await query(
      `
        SELECT id, first_name, last_name, email, phone, auth_provider
        FROM users
        WHERE id = ?
          AND deleted_at IS NULL
          AND account_status = 'active'
        LIMIT 1
      `,
      [actor.id]
    );

    if (!rows[0]) {
      throw new AppError(404, 'User not found.');
    }

    await linkGuestOrdersToUser(rows[0]);

    return sanitizeUser(rows[0]);
  }

  const rows = await query(
    `
      SELECT id, full_name AS name, email, role
      FROM admins
      WHERE id = ?
        AND deleted_at IS NULL
        AND account_status = 'active'
      LIMIT 1
    `,
    [actor.id]
  );

  if (!rows[0]) {
    throw new AppError(404, 'Admin not found.');
  }

  return sanitizeAdmin(rows[0]);
}

function createOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

async function requestPasswordResetOtp(payload) {
  const { email } = payload;

  const rows = await query(
    `
      SELECT id, first_name, last_name, email
      FROM users
      WHERE email = ?
        AND deleted_at IS NULL
        AND account_status = 'active'
      LIMIT 1
    `,
    [email]
  );

  const user = rows[0];

  if (!user) {
    return {
      sent: true,
    };
  }

  const otp = createOtpCode();
  const otpHash = hashOtp(otp);

  await query(
    `
      INSERT INTO password_reset_otps (
        user_id,
        email,
        otp_hash,
        expires_at
      )
      VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))
    `,
    [user.id, user.email, otpHash]
  );

  await enqueueEmailJob({
    to: user.email,
    subject: 'Parsom Brand Password Reset OTP',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Password Reset OTP</h2>
        <p>Hello ${user.first_name} ${user.last_name},</p>
        <p>Your OTP is:</p>
        <h1 style="letter-spacing: 4px;">${otp}</h1>
        <p>This OTP expires in 10 minutes.</p>
      </div>
    `,
  });

  return {
    sent: true,
  };
}

async function resetPasswordWithOtp(payload) {
  const { email, otp, newPassword } = payload;

  const userRows = await query(
    `
      SELECT id, email
      FROM users
      WHERE email = ?
        AND deleted_at IS NULL
        AND account_status = 'active'
      LIMIT 1
    `,
    [email]
  );

  const user = userRows[0];

  if (!user) {
    throw new AppError(422, 'Invalid email or OTP.');
  }

  const otpRows = await query(
    `
      SELECT id, otp_hash AS otpHash, expires_at AS expiresAt, used_at AS usedAt
      FROM password_reset_otps
      WHERE user_id = ?
        AND email = ?
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [user.id, email]
  );

  const resetRecord = otpRows[0];

  if (!resetRecord) {
    throw new AppError(422, 'Invalid email or OTP.');
  }

  if (resetRecord.usedAt) {
    throw new AppError(422, 'This OTP has already been used.');
  }

  if (new Date(resetRecord.expiresAt).getTime() < Date.now()) {
    throw new AppError(422, 'OTP has expired.');
  }

  if (hashOtp(otp) !== resetRecord.otpHash) {
    throw new AppError(422, 'Invalid email or OTP.');
  }

  const passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);

  await query(
    `
      UPDATE users
      SET password_hash = ?,
          updated_at = NOW()
      WHERE id = ?
    `,
    [passwordHash, user.id]
  );

  await query(
    `
      UPDATE password_reset_otps
      SET used_at = NOW()
      WHERE id = ?
    `,
    [resetRecord.id]
  );

  return {
    reset: true,
  };
}
async function requestWhatsappLoginOtp(payload) {
  const phone = payload.phone;

  const rows = await query(
    `
      SELECT id, first_name, last_name, email, phone, auth_provider
      FROM users
      WHERE phone = ?
        AND deleted_at IS NULL
        AND account_status = 'active'
      LIMIT 1
    `,
    [phone]
  );

  const user = rows[0];

  if (!user) {
    throw new AppError(404, 'No account found for this phone number.');
  }

  const otp = createOtpCode();
  const otpHash = hashOtp(otp);

  await query(
    `
      INSERT INTO whatsapp_login_otps (
        user_id,
        phone,
        otp_hash,
        expires_at
      )
      VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))
    `,
    [user.id, phone, otpHash]
  );

  await sendWhatsappOtp(phone, otp);

  return {
    sent: true,
    phone,
  };
}

async function verifyWhatsappLoginOtp(payload) {
  const phone = payload.phone;
  const otp = payload.otp;

  const rows = await query(
    `
      SELECT id, first_name, last_name, email, phone, auth_provider
      FROM users
      WHERE phone = ?
        AND deleted_at IS NULL
        AND account_status = 'active'
      LIMIT 1
    `,
    [phone]
  );

  const user = rows[0];

  if (!user) {
    throw new AppError(404, 'No account found for this phone number.');
  }

  const otpRows = await query(
    `
      SELECT id, otp_hash AS otpHash, expires_at AS expiresAt, used_at AS usedAt
      FROM whatsapp_login_otps
      WHERE user_id = ?
        AND phone = ?
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [user.id, phone]
  );

  const loginOtp = otpRows[0];

  if (!loginOtp || loginOtp.usedAt) {
    throw new AppError(422, 'Invalid or expired OTP.');
  }

  if (new Date(loginOtp.expiresAt).getTime() < Date.now()) {
    throw new AppError(422, 'Invalid or expired OTP.');
  }

  if (hashOtp(otp) !== loginOtp.otpHash) {
    throw new AppError(422, 'Invalid or expired OTP.');
  }

  await query(
    `
      UPDATE users
      SET last_login_at = NOW(),
          is_phone_verified = 1
      WHERE id = ?
    `,
    [user.id]
  );

  await query(
    `
      UPDATE whatsapp_login_otps
      SET used_at = NOW()
      WHERE id = ?
    `,
    [loginOtp.id]
  );

  await linkGuestOrdersToUser(user);

  const token = signToken(user, 'user');

  return {
    user: sanitizeUser(user),
    token,
  };
}

module.exports = {
  registerUser,
  loginUser,
  loginAdmin,
  getCurrentActor,
  requestPasswordResetOtp,
  resetPasswordWithOtp,
  requestWhatsappLoginOtp,
  verifyWhatsappLoginOtp,
};
