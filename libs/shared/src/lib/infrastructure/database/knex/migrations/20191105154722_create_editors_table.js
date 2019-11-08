module.exports.up = function(knex) {
  return knex.schema.createTable('editors', function(table) {
    table.string('id', 40).primary();
    table.string('journalId', 40);
    table.string('name');
    table.string('email');
    table.string('roleLabel');
    table.string('roleType');
    table.dateTime('createdAt', {precision: 2, useTz: false});
    table.dateTime('updatedAt', {precision: 2, useTz: false});
  });
};

module.exports.down = function(knex) {
  return knex.schema.removeTable('editors');
};
