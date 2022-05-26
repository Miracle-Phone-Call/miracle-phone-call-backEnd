/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
 exports.up = function(knex) {
    return knex.schema.createTable('users', function (table) {
        table.increments("id").primary();
        table.string('first_name').notNullable();
        table.string('last_name').notNullable();
        table.string('username').unique().notNullable();
        table.string('bio').nullable();
        table.string('password').notNullable();
      })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable("users")
};
