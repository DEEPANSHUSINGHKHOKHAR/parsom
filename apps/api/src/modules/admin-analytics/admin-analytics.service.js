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
          SUM(oi.quantity) AS totalSold
        FROM order_items oi
        INNER JOIN orders o
          ON o.id = oi.order_id
        WHERE o.deleted_at IS NULL
          AND o.order_status <> 'cancelled'
        GROUP BY oi.product_name
        ORDER BY totalSold DESC
        LIMIT 5
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
      totalSold: Number(row.totalSold),
    })),
  };
}

module.exports = {
  getOverview,
};
