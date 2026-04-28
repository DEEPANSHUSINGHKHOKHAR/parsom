const bcrypt = require('bcryptjs');
const fs = require('fs/promises');
const jwt = require('jsonwebtoken');
const path = require('path');
const { OAuth2Client } = require('google-auth-library');
const { pool, query } = require('../../config/db');
const env = require('../../config/env');
const { uploadsRoot } = require('../../config/paths');
const AppError = require('../../utils/app-error');

const googleOAuthClient = new OAuth2Client(env.GOOGLE_OAUTH_CLIENT_ID);

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

function parseStoredReviewMedia(value) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => item?.url)
        .filter(Boolean);
    }
  } catch {
    return [value];
  }

  return [value];
}

function resolveUploadFilePath(fileUrl) {
  const normalized = String(fileUrl || '').trim();

  if (!normalized) return null;

  const appOrigin = String(env.APP_URL || '').replace(/\/+$/, '');
  const relativePath = appOrigin && normalized.startsWith(appOrigin)
    ? normalized.slice(appOrigin.length)
    : normalized;

  if (!relativePath.startsWith('/uploads/')) {
    return null;
  }

  const resolvedPath = path.resolve(
    uploadsRoot,
    relativePath.replace(/^\/uploads\//, '').replace(/\//g, path.sep)
  );

  if (!resolvedPath.startsWith(path.resolve(uploadsRoot))) {
    return null;
  }

  return resolvedPath;
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

function splitGoogleName(fullName, fallbackEmail) {
  const cleanName = String(fullName || '').trim();

  if (!cleanName) {
    const localPart = String(fallbackEmail || '').split('@')[0] || 'Customer';
    return {
      firstName: localPart,
      lastName: '',
    };
  }

  const nameParts = cleanName.split(/\s+/);

  return {
    firstName: nameParts.shift() || cleanName,
    lastName: nameParts.join(' '),
  };
}

async function checkUserByPhone(payload) {
  const phone = payload.phone;

  return {
    phone,
  };
}

async function loginUserWithPhone(payload) {
  const { phone, password } = payload;

  const rows = await query(
    `
      SELECT *
      FROM users
      WHERE phone = ?
        AND deleted_at IS NULL
        AND account_status = 'active'
      LIMIT 1
    `,
    [phone]
  );

  const user = rows[0];

  if (!user || !user.password_hash) {
    throw new AppError(401, 'Invalid phone number or password.');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    throw new AppError(401, 'Invalid phone number or password.');
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
    token,
  };
}

async function loginWithGoogle(payload) {
  const { credential } = payload;

  if (!env.GOOGLE_OAUTH_CLIENT_ID) {
    throw new AppError(503, 'Google login is not configured.');
  }

  let ticket;

  try {
    ticket = await googleOAuthClient.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_OAUTH_CLIENT_ID,
    });
  } catch (error) {
    throw new AppError(401, 'Google login could not be verified.');
  }

  const googleProfile = ticket.getPayload();

  if (!googleProfile?.email || !googleProfile?.email_verified) {
    throw new AppError(401, 'Google account email must be verified.');
  }

  const email = googleProfile.email.toLowerCase();
  const googleSubject = googleProfile.sub;
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

  let user = rows[0];

  if (user) {
    if (user.google_sub && user.google_sub !== googleSubject) {
      throw new AppError(409, 'This email is already linked to another Google account.');
    }

    await query(
      `
        UPDATE users
        SET google_sub = COALESCE(google_sub, ?),
            is_email_verified = 1,
            last_login_at = NOW(),
            updated_at = NOW()
        WHERE id = ?
      `,
      [googleSubject, user.id]
    );
  } else {
    const { firstName, lastName } = splitGoogleName(
      googleProfile.name,
      email
    );

    const insertResult = await query(
      `
        INSERT INTO users (
          first_name,
          last_name,
          email,
          phone,
          password_hash,
          auth_provider,
          google_sub,
          is_email_verified,
          last_login_at
        )
        VALUES (?, ?, ?, NULL, NULL, 'google', ?, 1, NOW())
      `,
      [firstName, lastName, email, googleSubject]
    );

    const createdRows = await query(
      `
        SELECT id, first_name, last_name, email, phone, auth_provider
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
      [insertResult.insertId]
    );

    user = createdRows[0];
  }

  const refreshedRows = await query(
    `
      SELECT id, first_name, last_name, email, phone, auth_provider
      FROM users
      WHERE id = ?
      LIMIT 1
    `,
    [user.id]
  );

  const refreshedUser = refreshedRows[0];
  await linkGuestOrdersToUser(refreshedUser);

  const token = signToken(refreshedUser, 'user');

  return {
    user: sanitizeUser(refreshedUser),
    token,
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

async function changePassword(actor, payload) {
  if (!actor || actor.role !== 'user') {
    throw new AppError(403, 'Only users can change passwords.');
  }

  const { currentPassword, newPassword, skipCurrentPassword } = payload;

  const rows = await query(
    `
      SELECT id, password_hash AS passwordHash, google_sub AS googleSub
      FROM users
      WHERE id = ?
        AND deleted_at IS NULL
        AND account_status = 'active'
      LIMIT 1
    `,
    [actor.id]
  );

  const user = rows[0];

  if (!user) {
    throw new AppError(404, 'User not found.');
  }

  if (!newPassword) {
    throw new AppError(422, 'New password is required.');
  }

  const hasPassword = Boolean(user.passwordHash);
  const allowSkip = Boolean(skipCurrentPassword && user.googleSub);

  if (hasPassword && !allowSkip) {
    if (!currentPassword) {
      throw new AppError(422, 'Current password is required.');
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw new AppError(401, 'Current password is incorrect.');
    }
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

  return {
    updated: true,
  };
}

async function deleteAccount(actor, payload = {}) {
  if (!actor || actor.role !== 'user') {
    throw new AppError(403, 'Only users can delete their account.');
  }

  const { currentPassword, skipCurrentPassword } = payload;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute(
      `
        SELECT id, password_hash AS passwordHash, google_sub AS googleSub
        FROM users
        WHERE id = ?
          AND deleted_at IS NULL
          AND account_status = 'active'
        LIMIT 1
        FOR UPDATE
      `,
      [actor.id]
    );

    const user = rows[0];

    if (!user) {
      throw new AppError(404, 'User not found.');
    }

    const hasPassword = Boolean(user.passwordHash);
    const allowSkip = Boolean(skipCurrentPassword && user.googleSub);

    if (hasPassword && !allowSkip) {
      if (!currentPassword) {
        throw new AppError(422, 'Current password is required.');
      }

      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.passwordHash
      );

      if (!isPasswordValid) {
        throw new AppError(401, 'Current password is incorrect.');
      }
    }

    const [reviewRows] = await connection.execute(
      `
        SELECT image_path AS imagePath
        FROM reviews
        WHERE user_id = ?
          AND image_path IS NOT NULL
          AND image_path <> ''
      `,
      [user.id]
    );

    const reviewFiles = reviewRows
      .flatMap((row) => parseStoredReviewMedia(row.imagePath))
      .map((fileUrl) => resolveUploadFilePath(fileUrl))
      .filter(Boolean);

    await connection.execute(
      `
        DELETE FROM reviews
        WHERE user_id = ?
      `,
      [user.id]
    );

    await connection.execute(
      `
        DELETE FROM notify_requests
        WHERE user_id = ?
      `,
      [user.id]
    );

    await connection.execute(
      `
        DELETE FROM contact_submissions
        WHERE user_id = ?
      `,
      [user.id]
    );

    await connection.execute(
      `
        DELETE FROM order_items
        WHERE order_id IN (
          SELECT id
          FROM (
            SELECT id
            FROM orders
            WHERE user_id = ?
          ) owned_orders
        )
      `,
      [user.id]
    );

    await connection.execute(
      `
        DELETE FROM orders
        WHERE user_id = ?
      `,
      [user.id]
    );

    await connection.execute(
      `
        DELETE FROM users
        WHERE id = ?
      `,
      [user.id]
    );

    await connection.commit();

    await Promise.all(
      [...new Set(reviewFiles)].map(async (filePath) => {
        try {
          await fs.unlink(filePath);
        } catch (error) {
          if (error?.code !== 'ENOENT') {
            console.error('Failed to remove review upload:', filePath, error.message);
          }
        }
      })
    );

    return {
      deleted: true,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  registerUser,
  loginUser,
  checkUserByPhone,
  loginUserWithPhone,
  loginWithGoogle,
  loginAdmin,
  getCurrentActor,
  changePassword,
  deleteAccount,
};
