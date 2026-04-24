const { pool, query } = require('../../config/db');
const AppError = require('../../utils/app-error');

function normalizeAddressType(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return ['home', 'work', 'other'].includes(normalized) ? normalized : 'other';
}

async function getMyAddresses(actor) {
  const rows = await query(
    `
      SELECT
        id,
        full_name AS fullName,
        phone,
        address_line_1 AS addressLine1,
        address_line_2 AS addressLine2,
        city,
        state,
        postal_code AS postalCode,
        address_type AS label,
        is_default AS isDefault,
        created_at AS createdAt
      FROM addresses
      WHERE user_id = ?
        AND deleted_at IS NULL
      ORDER BY is_default DESC, created_at DESC
    `,
    [actor.id]
  );

  return rows.map((row) => ({
    ...row,
    isDefault: Boolean(row.isDefault),
  }));
}

async function createAddress(payload, actor) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [countRows] = await connection.execute(
      `
        SELECT COUNT(*) AS total
        FROM addresses
        WHERE user_id = ?
          AND deleted_at IS NULL
      `,
      [actor.id]
    );

    const shouldSetDefault =
      Boolean(payload.isDefault) || Number(countRows[0].total) === 0;

    if (shouldSetDefault) {
      await connection.execute(
        `
          UPDATE addresses
          SET is_default = 0
          WHERE user_id = ?
            AND deleted_at IS NULL
        `,
        [actor.id]
      );
    }

    const [insertResult] = await connection.execute(
      `
        INSERT INTO addresses (
          user_id,
          full_name,
          phone,
          address_line_1,
          address_line_2,
          city,
          state,
          postal_code,
          address_type,
          is_default
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        actor.id,
        payload.fullName,
        payload.phone,
        payload.addressLine1,
        payload.addressLine2 || null,
        payload.city,
        payload.state,
        payload.postalCode,
        normalizeAddressType(payload.label),
        shouldSetDefault ? 1 : 0,
      ]
    );

    await connection.commit();

    return {
      addressId: insertResult.insertId,
      isDefault: shouldSetDefault,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updateAddress(addressId, payload, actor) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [existingRows] = await connection.execute(
      `
        SELECT *
        FROM addresses
        WHERE id = ?
          AND user_id = ?
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [addressId, actor.id]
    );

    const existing = existingRows[0];

    if (!existing) {
      throw new AppError(404, 'Address not found.');
    }

    const nextIsDefault =
      payload.isDefault !== undefined ? Boolean(payload.isDefault) : Boolean(existing.is_default);

    if (nextIsDefault) {
      await connection.execute(
        `
          UPDATE addresses
          SET is_default = 0
          WHERE user_id = ?
            AND deleted_at IS NULL
        `,
        [actor.id]
      );
    }

    await connection.execute(
      `
        UPDATE addresses
        SET full_name = ?,
            phone = ?,
            address_line_1 = ?,
            address_line_2 = ?,
            city = ?,
            state = ?,
            postal_code = ?,
            address_type = ?,
            is_default = ?,
            updated_at = NOW()
        WHERE id = ?
      `,
      [
        payload.fullName ?? existing.full_name,
        payload.phone ?? existing.phone,
        payload.addressLine1 ?? existing.address_line_1,
        payload.addressLine2 ?? existing.address_line_2,
        payload.city ?? existing.city,
        payload.state ?? existing.state,
        payload.postalCode ?? existing.postal_code,
        payload.label !== undefined
          ? normalizeAddressType(payload.label)
          : existing.address_type,
        nextIsDefault ? 1 : 0,
        addressId,
      ]
    );

    await connection.commit();

    return {
      addressId: Number(addressId),
      isDefault: nextIsDefault,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function setDefaultAddress(addressId, actor) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [existingRows] = await connection.execute(
      `
        SELECT id
        FROM addresses
        WHERE id = ?
          AND user_id = ?
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [addressId, actor.id]
    );

    if (!existingRows[0]) {
      throw new AppError(404, 'Address not found.');
    }

    await connection.execute(
      `
        UPDATE addresses
        SET is_default = 0
        WHERE user_id = ?
          AND deleted_at IS NULL
      `,
      [actor.id]
    );

    await connection.execute(
      `
        UPDATE addresses
        SET is_default = 1,
            updated_at = NOW()
        WHERE id = ?
      `,
      [addressId]
    );

    await connection.commit();

    return { addressId: Number(addressId) };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function deleteAddress(addressId, actor) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [existingRows] = await connection.execute(
      `
        SELECT id, is_default
        FROM addresses
        WHERE id = ?
          AND user_id = ?
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [addressId, actor.id]
    );

    const existing = existingRows[0];

    if (!existing) {
      throw new AppError(404, 'Address not found.');
    }

    await connection.execute(
      `
        UPDATE addresses
        SET deleted_at = NOW(),
            is_default = 0
        WHERE id = ?
      `,
      [addressId]
    );

    if (Number(existing.is_default) === 1) {
      const [nextRows] = await connection.execute(
        `
          SELECT id
          FROM addresses
          WHERE user_id = ?
            AND deleted_at IS NULL
          ORDER BY created_at DESC
          LIMIT 1
        `,
        [actor.id]
      );

      if (nextRows[0]) {
        await connection.execute(
          `
            UPDATE addresses
            SET is_default = 1,
                updated_at = NOW()
            WHERE id = ?
          `,
          [nextRows[0].id]
        );
      }
    }

    await connection.commit();

    return { addressId: Number(addressId) };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  getMyAddresses,
  createAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
};
