module.exports.up = function(knex) {
  return knex.schema.createTable('payments', function(table) {
    table.uuid('id', 40).primary();
    table.string('invoiceId', 40);
    table.string('payerId', 40);
    table.string('paymentMethodId', 40);
    table.string('foreignPaymentId');
    table.string('paymentProof');
    table.float('amount');
    table.datetime('datePaid', {precision: 2, useTz: false});
  });
};

module.exports.down = function(knex) {
  return knex.schema.dropTable('payments');
};
