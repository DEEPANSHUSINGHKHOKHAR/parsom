const { query } = require('../../config/db');

async function getOverview() {
  const [
    totalOrdersRows,
    pendingOrdersRows,
    grossRevenueRows,
    activeProductsRows,
    lowStockRows,
    pendingNotifyRows,
    monthlySalesRows,
    statusRows,
    topProductsRows,
    categoryBreakdownRows,
    couponTrackingRows,
  ] = await Promise.all([
    query(`SELECT COUNT(*) AS totalOrders FROM orders WHERE deleted_at IS NULL`),
    query(
      `SELECT COUNT(*) AS pendingOrders FROM orders WHERE deleted_at IS NULL AND order_status = 'pending'`
    ),
    query(
      `SELECT COALESCE(SUM(total_amount), 0) AS grossRevenue FROM orders WHERE deleted_at IS NULL AND order_status <> 'cancelled'`
    ),
    query(
      `SELECT COUNT(*) AS activeProducts FROM products WHERE deleted_at IS NULL AND is_active = 1`
    ),
    query(
      `
        SELECT COUNT(*) AS lowStockProducts
        FROM (
          SELECT
            pv.product_id,
            SUM(GREATEST(stock_qty - reserved_qty, 0)) AS availableStock,
            MIN(low_stock_threshold) AS thresholdValue
          FROM size_stock
          INNER JOIN product_variants pv
            ON pv.id = size_stock.product_variant_id
          WHERE pv.deleted_at IS NULL
            AND pv.is_active = 1
          GROUP BY pv.product_id
        ) stock_summary
        WHERE availableStock <= thresholdValue
      `
    ),
    query(
      `SELECT COUNT(*) AS pendingNotify FROM notify_requests WHERE deleted_at IS NULL AND status IN ('pending', 'read')`
    ),
    query(
      `
        SELECT
          DATE_FORMAT(ordered_at, '%Y-%m') AS monthLabel,
          COALESCE(SUM(total_amount), 0) AS revenue
        FROM orders
        WHERE deleted_at IS NULL
          AND order_status <> 'cancelled'
          AND ordered_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(ordered_at, '%Y-%m')
        ORDER BY monthLabel ASC
      `
    ),
    query(
      `
        SELECT
          order_status AS status,
          COUNT(*) AS total
        FROM orders
        WHERE deleted_at IS NULL
        GROUP BY order_status
      `
    ),
    query(
      `
        SELECT
          oi.product_name AS productName,
          MAX(c.name) AS categoryName,
          SUM(oi.quantity) AS totalSold
        FROM order_items oi
        LEFT JOIN products p
          ON p.id = oi.product_id
          AND p.deleted_at IS NULL
        LEFT JOIN categories c
          ON c.id = p.category_id
          AND c.deleted_at IS NULL
        INNER JOIN orders o
          ON o.id = oi.order_id
        WHERE o.deleted_at IS NULL
          AND o.order_status <> 'cancelled'
        GROUP BY oi.product_name
        ORDER BY totalSold DESC
        LIMIT 5
      `
    ),
    query(
      `
        SELECT
          c.id,
          c.name,
          c.slug,
          c.is_active AS isActive,
          COUNT(p.id) AS productCount
        FROM categories c
        LEFT JOIN products p
          ON p.category_id = c.id
          AND p.deleted_at IS NULL
          AND p.is_active = 1
        WHERE c.deleted_at IS NULL
        GROUP BY c.id, c.name, c.slug, c.is_active
        ORDER BY c.created_at DESC
      `
    ),
    query(
      `
        SELECT
          c.id,
          c.code,
          c.usage_limit AS usageLimit,
          c.usage_per_user AS perUserLimit,
          c.used_count AS totalUsed,
          COUNT(o.id) AS orderUsageCount,
          COALESCE(SUM(CASE WHEN o.order_status <> 'cancelled' THEN o.discount_amount ELSE 0 END), 0) AS totalDiscountGiven
        FROM coupons c
        LEFT JOIN orders o
          ON o.coupon_id = c.id
          AND o.deleted_at IS NULL
        WHERE c.deleted_at IS NULL
        GROUP BY c.id
        ORDER BY orderUsageCount DESC, c.created_at DESC
        LIMIT 6
      `
    ),
  ]);

  return {
    cards: {
      totalOrders: Number(totalOrdersRows[0].totalOrders),
      pendingOrders: Number(pendingOrdersRows[0].pendingOrders),
      grossRevenue: Number(grossRevenueRows[0].grossRevenue),
      activeProducts: Number(activeProductsRows[0].activeProducts),
      lowStockProducts: Number(lowStockRows[0].lowStockProducts),
      pendingNotify: Number(pendingNotifyRows[0].pendingNotify),
    },
    monthlySales: monthlySalesRows.map((row) => ({
      monthLabel: row.monthLabel,
      revenue: Number(row.revenue),
    })),
    orderStatusBreakdown: statusRows.map((row) => ({
      status: row.status,
      total: Number(row.total),
    })),
    topProducts: topProductsRows.map((row) => ({
      productName: row.productName,
      categoryName: row.categoryName,
      totalSold: Number(row.totalSold),
    })),
    categoryBreakdown: categoryBreakdownRows.map((row) => ({
      id: Number(row.id),
      name: row.name,
      slug: row.slug,
      isActive: Boolean(row.isActive),
      productCount: Number(row.productCount || 0),
    })),
    couponTracking: couponTrackingRows.map((row) => ({
      id: row.id,
      code: row.code,
      usageLimit: row.usageLimit !== null ? Number(row.usageLimit) : null,
      perUserLimit: row.perUserLimit !== null ? Number(row.perUserLimit) : null,
      totalUsed: Number(row.totalUsed || 0),
      orderUsageCount: Number(row.orderUsageCount || 0),
      totalDiscountGiven: Number(row.totalDiscountGiven || 0),
    })),
  };
}

module.exports = {
  getOverview,
};
