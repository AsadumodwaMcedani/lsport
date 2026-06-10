export async function up(knex) {
  await knex.schema.createTable('academic_years', (t) => {
    t.increments('id').unsigned();
    t.specificType('year', 'YEAR').notNullable().unique();
    t.boolean('is_active').defaultTo(true);
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('semesters', (t) => {
    t.increments('id').unsigned();
    t.integer('academic_year_id').unsigned().notNullable().references('id').inTable('academic_years').onDelete('CASCADE');
    t.specificType('semester_number', 'TINYINT').notNullable();
    t.date('start_date').nullable();
    t.date('end_date').nullable();
    t.boolean('is_active').defaultTo(true);
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.unique(['academic_year_id', 'semester_number']);
  });

  await knex.schema.createTable('courses', (t) => {
    t.increments('id').unsigned();
    t.string('code', 20).notNullable();
    t.string('name', 200).notNullable();
    t.integer('semester_id').unsigned().notNullable().references('id').inTable('semesters').onDelete('RESTRICT');
    t.text('description').nullable();
    t.boolean('is_active').defaultTo(true);
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.unique(['code', 'semester_id']);
  });

  await knex.schema.createTable('students', (t) => {
    t.increments('id').unsigned();
    t.string('student_number', 20).unique().notNullable();
    t.string('id_number', 20).nullable();
    t.string('surname', 100).notNullable();
    t.string('names', 150).notNullable();
    t.string('email', 200).nullable();
    t.string('phone', 20).nullable();
    t.string('course_name', 200).nullable();
    t.string('qualification', 200).nullable();
    t.string('password_hash', 255).notNullable();
    t.boolean('is_active').defaultTo(true);
    t.boolean('force_pw_change').defaultTo(true);
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.date('data_expires_at').notNullable();
  });

  await knex.schema.createTable('course_enrollments', (t) => {
    t.increments('id').unsigned();
    t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
    t.integer('course_id').unsigned().notNullable().references('id').inTable('courses').onDelete('CASCADE');
    t.timestamp('enrolled_at').defaultTo(knex.fn.now());
    t.unique(['student_id', 'course_id']);
  });

  await knex.schema.createTable('tutor_assignments', (t) => {
    t.increments('id').unsigned();
    t.integer('user_id').unsigned().notNullable();
    t.integer('course_id').unsigned().notNullable().references('id').inTable('courses').onDelete('CASCADE');
    t.timestamp('assigned_at').defaultTo(knex.fn.now());
    t.unique(['user_id', 'course_id']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('tutor_assignments');
  await knex.schema.dropTableIfExists('course_enrollments');
  await knex.schema.dropTableIfExists('students');
  await knex.schema.dropTableIfExists('courses');
  await knex.schema.dropTableIfExists('semesters');
  await knex.schema.dropTableIfExists('academic_years');
}
