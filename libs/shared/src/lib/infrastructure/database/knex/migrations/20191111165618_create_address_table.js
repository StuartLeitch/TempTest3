module.exports.up = function(knex) {
  return knex.schema.createTable('addresses', function(table) {
    table.string('id', 40).primary();
    table.string('country', 80);
    table.string('city');
    table.string('addressLine1');
    table.string('addressLine2');
    table.string('postalCode');
    table.dateTime('dateCreated', {precision: 2, useTz: false});
    table.dateTime('dateUpdated', {precision: 2, useTz: false});
  });
};

module.exports.down = function(knex) {
  return knex.schema.removeTable('address');
};
