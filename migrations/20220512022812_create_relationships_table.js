/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
 exports.up = function(knex) {
    return knex.schema.createTable('relationships', function (table) {
        table.increments("id").primary();
        table.integer('user_id').references('id').inTable("users");
        table.integer('friend_id').references('id').inTable("users");
      })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable("relationships")
};
