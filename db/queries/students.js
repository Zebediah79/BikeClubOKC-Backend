import db from "#db/client";

export async function createStudent(
  firstName,
  lastName,
  birthdate,
  bikeSize,
  shirtSize,
  earnedBike,
  status,
  parent_id,
  school_id
) {
  const SQL = `
    INSERT INTO students (
    first_name,
    last_name,
    birthdate,
    bike_size,
    shirt_size,
    earned_bike,
    status,
    parent_id,
    school_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
    `;

  const {
    rows: [student],
  } = await db.query(SQL, [
    firstName,
    lastName,
    birthdate,
    bikeSize,
    shirtSize,
    earnedBike,
    status,
    parent_id,
    school_id,
  ]);

  return student;
}

export async function getStudents() {
  const { rows: students } = await db.query("SELECT * FROM students");
  return students;
}

export async function getStudentById(id) {
  const {
    rows: [student],
  } = await db.query("SELECT * FROM students WHERE id = $1", [id]);
  return student;
}

export async function getStudentsByParentId(id) {
  const SQL = `
    SELECT 
      parent.id AS parent_id,
      parent.first_name AS parent_first_name,
      parent.last_name AS parent_last_name,
      student.id AS student_id,
      student.first_name AS student_first_name,
      student.last_name AS student_last_name,
      student.birthdate,
      student.bike_size,
      student.shirt_size,
      student.earned_bike,
      student.status AS student_status
    FROM parents parent
    LEFT JOIN students student ON student.parent_id = parent.id
    WHERE parent.id = $1
    `;

  const { rows: students } = await db.query(SQL, [id]);

  return students;
}

export async function getStudentsBySchoolId(id) {
  const SQL = `
    SELECT 
        student.first_name AS student_first_name,
        student.last_name AS student_last_name
    FROM students student
    LEFT JOIN schools school 
      ON student.school_id = school.id
    WHERE school.id = $1
    `;
  const { rows: students } = await db.query(SQL, [id]);
  return students;
}

export async function updateStudent(
  id,
  firstName,
  lastName,
  birthdate,
  bikeSize,
  shirtSize,
  earnedBike,
  status,
  parent_id,
  school_id
) {
  const SQL = `
    UPDATE students
    SET
        first_name = $2,
        last_name = $3,
        birthdate = $4,
        bike_size = $5,
        shirt_size = $6,
        earned_bike = $7,
        status = $8,
        parent_id = $9,
        school_id = $10
    WHERE id = $1
    RETURNING *`;

  const {
    rows: [student],
  } = await db.query(SQL, [
    id,
    firstName,
    lastName,
    birthdate,
    bikeSize,
    shirtSize,
    earnedBike,
    status,
    parent_id,
    school_id,
  ]);

  return student;
}

export async function deleteStudent(id) {
  return await db.query(`DELETE FROM students WHERE id = $1`, [id]);
}
