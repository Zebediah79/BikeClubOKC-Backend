import bcrypt from "bcrypt";
import db from "#db/client";

export async function createVolunteer(
  email,
  password,
  firstName,
  lastName,
  birthdate,
  interest,
  phone,
  facilitator,
  preferredSchool,
  school_id,
  flexible,
  backgroundCheck,
  status
) {
  const SQL = `
    INSERT INTO volunteers (
      email,
      password,
      first_name,
      last_name,
      birthdate,
      interest,
      phone,
      facilitator,
      preferred_school,
      school_id,
      flexible,
      background_check,
      status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *`;

  const hashedPassword = await bcrypt.hash(password, 10);

  const {
    rows: [volunteer],
  } = await db.query(SQL, [
    email,
    hashedPassword,
    firstName,
    lastName,
    birthdate,
    interest,
    phone,
    facilitator,
    preferredSchool,
    school_id,
    flexible,
    backgroundCheck,
    status,
  ]);

  return volunteer;
}

export async function getVolunteers() {
  const SQL = `SELECT * FROM volunteers`;
  const { rows: volunteers } = await db.query(SQL);
  return volunteers;
}

export async function getVolunteerById(id) {
  const SQL = `SELECT * FROM volunteers WHERE id = $1`;
  const {
    rows: [volunteer],
  } = await db.query(SQL, [id]);
  return volunteer;
}

export async function getVolunteerByEmailAndPassword(email, password) {
  const SQL = `
  SELECT * FROM volunteers
  WHERE email = $1`;

  const {
    rows: [volunteer],
  } = await db.query(SQL, [email]);
  if (!volunteer) return null;

  const isValid = await bcrypt.compare(password, volunteer.password);
  if (!isValid) return null;

  return volunteer;
}

export async function getVolunteersBySchoolId(id) {
  if (!id) throw new Error("School ID is required.");

  const SQL = `
    SELECT school.name AS school_name,
           volunteer.id AS volunteer_id,
           volunteer.first_name AS volunteer_first_name,
           volunteer.last_name AS volunteer_last_name,
           volunteer.email AS volunteer_email,
           volunteer.phone AS volunteer_phone,
           volunteer.flexible AS volunteer_flexible,
           volunteer.background_check AS volunteer_background_check,
           volunteer.status AS volunteer_status
    FROM schools school
    LEFT JOIN volunteers volunteer ON volunteer.school_id = school.id
    WHERE school.id = $1
  `;

  const { rows } = await db.query(SQL, [id]);
  if (rows.length === 0) return null;

  const { school_name } = rows[0];

  const volunteers = rows
    .filter((r) => r.volunteer_id !== null)
    .map((r) => ({
      id: r.volunteer_id,
      first_name: r.volunteer_first_name,
      last_name: r.volunteer_last_name,
      email: r.volunteer_email,
      phone: r.volunteer_phone,
      flexible: r.volunteer_flexible,
      background_check: r.volunteer_background_check,
      status: r.volunteer_status,
    }));

  return {
    name: school_name,
    volunteers,
  };
}

export async function updateVolunteer(
  id,
  firstName,
  lastName,
  email,
  phone,
  interest,
  facilitator,
  preferredSchool,
  flexible,
  backgroundCheck,
  status
) {
  const SQL = `
  UPDATE volunteers
  SET
      first_name = $2,
      last_name = $3,
      email = $4,
      phone = $5,
      interest = $6,
      facilitator = $7,
      preferred_school = $8,
      flexible = $9,
      background_check = $10,
      status = $11
  WHERE id = $1
  RETURNING *`;

  const {
    rows: [volunteer],
  } = await db.query(SQL, [
    id,
    firstName,
    lastName,
    email,
    phone,
    interest,
    facilitator,
    preferredSchool,
    flexible,
    backgroundCheck,
    status,
  ]);

  return volunteer;
}

export async function deleteVolunteer(id) {
  if (!id) throw new Error("Volunteer ID is required.");
  const SQL = `DELETE FROM volunteers WHERE id = $1 RETURNING *`;
  const {
    rows: [volunteer],
  } = await db.query(SQL, [id]);
  return volunteer;
}
