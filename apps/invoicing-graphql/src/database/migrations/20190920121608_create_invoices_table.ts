module.exports.up = async function(knex) {
  return knex.schema.createTable('invoices', function(table) {
    table
      .uuid('id', 36)
      .unique()
      .notNullable()
      .primary();
    table.string('transactionId', 40);
    table.integer('status').defaultTo(0);
    table.integer('deleted').defaultsTo(0);
    table.datetime('dateCreated', {precision: 2, useTz: false}); //.defaultTo(knex.fn.now(2));
  });
};

module.exports.down = async function(knex) {
  return knex.schema.dropTable('invoices');
};
