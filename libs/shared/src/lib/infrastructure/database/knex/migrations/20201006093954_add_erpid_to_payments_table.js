/* eslint-disable no-undef */

module.exports.up = function (knex) {
  return knex.schema.table('payments', function (table) {
    table.string('foreignPaymentId', 40);
  });
};

module.exports.down = function (knex) {
  return knex.schema.table('payments', function (table) {
    table.dropColumn('foreignPaymentId');
  });
};
