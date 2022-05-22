/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
 exports.up = function(knex) {
    return knex.schema.createTable('messages', function (table) {
        table.increments("id").primary();
        table.string('message').notNullable();
        table.integer('sender_id').references('id').inTable("users");
        table.integer('room_id').references('id').inTable('chat_room');
      })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable("messages")
};
