/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
 exports.up = function(knex) {
    return knex.schema.createTable('messages', function (table) {
        table.increments("id").primary();
        table.integer('conversation_id').references('id').inTable('conversations')
        table.string('message').notNullable();
        table.integer('sender_id').references('id').inTable("users");
      })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable("messages")
};
