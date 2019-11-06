module.exports.up = function(knex) {
  return knex.schema.createTable('journals', function(table) {
    table.uuid('id').primary();
    table.string('name');
    table.integer('apc');
    table.string('code');
    table.string('email');
    table.string('issn');
    table.integer('isActive');
    table.dateTime('activationDate', {precision: 2, useTz: false});
  });
};

module.exports.down = function(knex) {
  return knex.schema.removeTable('journals');
};
