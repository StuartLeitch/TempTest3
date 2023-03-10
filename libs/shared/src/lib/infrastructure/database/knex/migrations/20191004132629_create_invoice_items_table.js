module.exports.up = function(knex) {
  return knex.schema.createTable('invoice_items', function(table) {
    table.string('id', 40).primary();
    table.string('invoiceId', 40);
    table.string('manuscriptId', 40);
    table.string('type').defaultTo('APC');
    table.string('name', 40);
    table.float('price');
    table.integer('deleted').defaultTo(1);
    table.datetime('dateCreated', { precision: 2, useTz: false });
  });
};

module.exports.down = function(knex) {
  return knex.schema.dropTable('invoice_items');
};
