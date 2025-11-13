import bcrypt from "bcrypt";
import db from "#db/client";

export async function createVolunteer(
  email,
  password,
  firstName,
  lastName,
  birthdate,
  phone,
  interest,
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

  const { rows: volunteer } = db.query(SQL, [
    email,
    hashedPassword,
    firstName,
    lastName,
    birthdate,
    phone,
    interest,
    facilitator,
    preferredSchool,
    school_id,
    flexible,
    backgroundCheck,
    status,
  ]);
}
