/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */

module.exports.up = function (knex) {
  return knex.schema.table('invoices', function (table) {
    table.dropColumn('erpReference');
    table.dropColumn('revenueRecognitionReference');
    table.dropColumn('nsReference');
    table.dropColumn('nsRevRecReference');
    table.dropColumn('creditNoteReference');
  });
};

module.exports.down = function (knex) {
  // do nothing yet
};
