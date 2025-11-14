import bcrypt from "bcrypt";
import db from "#db/client";

export async function createParent(
  email,
  password,
  firstName,
  lastName,
  phone,
  address,
  waiver
) {
  const SQL = `
  INSERT INTO parents
  (email, password, first_name, last_name, phone, address, waiver)
  VALUES ($1, $2, $3, $4, $5, $6, $7)
  RETURNING *
  `;
  const hashedPassword = await bcrypt.hash(password, 10);
  const {
    rows: [parent],
  } = await db.query(SQL, [
    email,
    hashedPassword,
    firstName,
    lastName,
    phone,
    address,
    waiver,
  ]);

  return parent;
}

export async function getParents() {
  const SQL = `
    SELECT first_name, last_name, email, phone, address, waiver
    FROM parents`;
  const { rows: parents } = await db.query(SQL);
  return parents;
}

export async function getParentById(id) {
  const SQL = `SELECT * FROM parents WHERE id = $1`;
  const {
    rows: [parent],
  } = await db.query(SQL, [id]);
  return parent;
}

export async function getParentByEmailAndPassword(email, password) {
  const SQL = `
    SELECT * FROM parents
    WHERE email = $1
  `;

  const {
    rows: [parent],
  } = await db.query(SQL, [email]);

  if (!parent) return null;

  const isValid = await bcrypt.compare(password, parent.password);
  if (!isValid) return null;

  return parent;
}

export async function getParentByStudentId(id) {
  const SQL = `
  SELECT parent.first_name, 
         parent.last_name, 
         parent.address, 
         parent.phone, 
         parent.email, 
         parent.waiver
  FROM parents parent
  JOIN students student
  ON parent.id = student.parent_id
  WHERE student.id = $1
  `;

  const {
    rows: [parent],
  } = await db.query(SQL, [id]);
  return parent;
}

export async function updateParentInfo(
  id,
  email,
  password,
  firstName,
  lastName,
  phone,
  address,
  waiver
) {
  if (!id) throw new Error("Parent ID is required.");

  const SQL = `
    UPDATE parents
    SET 
      email = $2, 
      password = $3, 
      first_name = $4, 
      last_name = $5, 
      phone = $6, 
      address = $7, 
      waiver = $8
    WHERE id = $1
    RETURNING *
  `;

  const hashedPassword = await bcrypt.hash(password, 10);

  const {
    rows: [parent],
  } = await db.query(SQL, [
    id,
    email,
    hashedPassword,
    firstName,
    lastName,
    phone,
    address,
    waiver,
  ]);

  return parent;
}

export async function deleteParent(id) {
  const SQL = `DELETE FROM parents WHERE id = $1 RETURNING *`;
  const {
    rows: [parent],
  } = await db.query(SQL, [id]);
  return parent;
}
