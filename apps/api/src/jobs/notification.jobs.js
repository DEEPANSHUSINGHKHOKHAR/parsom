const { appendOrderRow, appendNotifyRow } = require('../utils/google-sheets-sync');

async function enqueueOrderSheetJob(payload) {
  return appendOrderRow(payload);
}

async function enqueueNotifySheetJob(payload) {
  return appendNotifyRow(payload);
}

module.exports = {
  enqueueOrderSheetJob,
  enqueueNotifySheetJob,
};
