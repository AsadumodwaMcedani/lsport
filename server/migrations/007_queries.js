export async function up(knex) {
  await knex.schema.createTable('query_categories', (t) => {
    t.increments('id').unsigned();
    t.string('name', 100).notNullable();
    t.boolean('is_active').defaultTo(true);
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });
  await knex('query_categories').insert([
    { name: 'Marks / Grade Query' },
    { name: 'Submission Issue' },
    { name: 'Academic / Content Question' },
    { name: 'General / Other' },
  ]);

  await knex.schema.createTable('queries', (t) => {
    t.bigIncrements('id').unsigned();
    t.integer('student_id').unsigned().notNullable().references('id').inTable('students');
    t.integer('course_id').unsigned().notNullable().references('id').inTable('courses');
    t.integer('category_id').unsigned().notNullable().references('id').inTable('query_categories');
    t.string('subject', 300).notNullable();
    t.text('description').notNullable();
    t.enu('urgency', ['low', 'medium', 'high', 'urgent']).defaultTo('medium');
    t.enu('status', ['new', 'acknowledged', 'in_progress', 'resolved', 'closed']).defaultTo('new');
    t.string('initial_channel', 30).defaultTo('portal');
    t.string('file_path', 500).nullable();
    t.string('file_name', 255).nullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('updated_at').defaultTo(knex.fn.now());
    t.timestamp('closed_at').nullable();
    t.index(['status', 'created_at']);
    t.index('student_id');
  });
  await knex.raw('ALTER TABLE queries MODIFY updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

  await knex.schema.createTable('query_messages', (t) => {
    t.bigIncrements('id').unsigned();
    t.bigInteger('query_id').unsigned().notNullable().references('id').inTable('queries');
    t.enu('sender_type', ['admin', 'staff', 'tutor', 'student']).notNullable();
    t.integer('sender_id').unsigned().notNullable();
    t.text('message').notNullable();
    t.boolean('is_public').defaultTo(true);
    t.string('file_path', 500).nullable();
    t.string('file_name', 255).nullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.index('query_id');
  });

  await knex.schema.createTable('query_status_history', (t) => {
    t.bigIncrements('id').unsigned();
    t.bigInteger('query_id').unsigned().notNullable().references('id').inTable('queries');
    t.string('old_status', 30).nullable();
    t.string('new_status', 30).notNullable();
    t.integer('changed_by').unsigned().notNullable();
    t.text('notes').nullable();
    t.timestamp('changed_at').defaultTo(knex.fn.now());
    t.index('query_id');
  });

  await knex.schema.createTable('interaction_logs', (t) => {
    t.bigIncrements('id').unsigned();
    t.integer('student_id').unsigned().notNullable().references('id').inTable('students');
    t.bigInteger('query_id').unsigned().nullable().references('id').inTable('queries');
    t.enu('channel', ['whatsapp', 'email', 'blackboard', 'f2f', 'system_message']).notNullable();
    t.enu('direction', ['sent', 'received', 'n/a']).defaultTo('n/a');
    t.text('summary').notNullable();
    t.integer('logged_by').unsigned().notNullable();
    t.timestamp('logged_at').defaultTo(knex.fn.now());
    t.index('student_id');
    t.index('query_id');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('interaction_logs');
  await knex.schema.dropTableIfExists('query_status_history');
  await knex.schema.dropTableIfExists('query_messages');
  await knex.schema.dropTableIfExists('queries');
  await knex.schema.dropTableIfExists('query_categories');
}
