const { query } = require('../../config/db');
const { ensureStoreSchema } = require('../../utils/store-schema');

const VELOCITY_BANNER_KEY = 'velocity_banner_entries';

function parseBannerEntries(value) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => String(item || '').trim())
        .filter(Boolean)
        .slice(0, 12);
    }
  } catch {
    return [];
  }

  return [];
}

async function getStorefrontSettings() {
  await ensureStoreSchema();

  const rows = await query(
    `
      SELECT setting_key AS settingKey, setting_value AS settingValue
      FROM site_settings
      WHERE setting_key IN (?)
    `,
    [[VELOCITY_BANNER_KEY]]
  );

  const settingMap = new Map(rows.map((row) => [row.settingKey, row.settingValue]));
  const entries = parseBannerEntries(settingMap.get(VELOCITY_BANNER_KEY));

  return {
    velocityBanner: {
      entries:
        entries.length > 0
          ? entries
          : ['Archive Drop 001', 'Early Access Open', '5% Discount For Members'],
    },
  };
}

module.exports = {
  VELOCITY_BANNER_KEY,
  getStorefrontSettings,
  parseBannerEntries,
};
