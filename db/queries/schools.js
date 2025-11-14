import db from "#db/client";

export async function createSchool(name, address, day) {
  const SQL = `
    INSERT INTO schools (name, address, day)
    VALUES ($1, $2, $3)
    RETURNING *`;

  const {
    rows: [school],
  } = await db.query(SQL, [name, address, day]);

  return school;
}

export async function getSchools() {
  return await db.query(`SELECT * FROM schools`);
}

export async function getSchoolById(id) {
  return await db.query(`SELECT * FROM schools WHERE id = $1`, [id]);
}

export async function updatedSchool(id, name, address, day) {
  const SQL = `
    UPDATE schools
    SET
        name = $2,
        address = $3,
        day = $4
    WHERE id = $1
    RETURNING *`;

  const {
    rows: [school],
  } = await db.query(SQL, [id, name, address, day]);

  return school;
}

export async function deleteSchool(id) {
  return await db.query(`DELETE FROM schools WHERE id = $1`, [id]);
}
