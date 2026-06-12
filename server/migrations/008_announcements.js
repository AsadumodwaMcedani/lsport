export async function up(knex) {
  await knex.schema.createTable('announcements', t => {
    t.increments('id');
    t.string('title', 300).notNullable();
    t.text('content').notNullable();
    t.enum('target_type', ['all', 'course', 'student']).notNullable().defaultTo('all');
    t.boolean('is_pinned').notNullable().defaultTo(false);
    t.datetime('expires_at').nullable();
    t.integer('created_by').unsigned().nullable();
    t.timestamps(true, true);
  });

  await knex.schema.createTable('announcement_targets', t => {
    t.increments('id');
    t.integer('announcement_id').unsigned().notNullable()
      .references('id').inTable('announcements').onDelete('CASCADE');
    t.integer('target_id').unsigned().notNullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.unique(['announcement_id', 'target_id']);
  });

  await knex.schema.createTable('announcement_read_receipts', t => {
    t.increments('id');
    t.integer('announcement_id').unsigned().notNullable()
      .references('id').inTable('announcements').onDelete('CASCADE');
    t.integer('student_id').unsigned().notNullable()
      .references('id').inTable('students').onDelete('CASCADE');
    t.timestamp('read_at').defaultTo(knex.fn.now());
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.unique(['announcement_id', 'student_id']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('announcement_read_receipts');
  await knex.schema.dropTableIfExists('announcement_targets');
  await knex.schema.dropTableIfExists('announcements');
}
