import db from "#db/client";

export async function createEvent(
  title,
  type,
  date,
  startLocation,
  endLocation,
  startTime,
  endTime
) {
  const SQL = `INSERT INTO events (
      title,
      type,
      date,
      start_location,
      end_location,
      start_time,
      end_time
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`;

  const {
    rows: [event],
  } = await db.query(SQL, [
    title,
    type,
    date,
    startLocation,
    endLocation,
    startTime,
    endTime,
  ]);

  return event;
}

export async function getEvents() {
  const SQL = `SELECT * FROM events`;
  const { rows: events } = await db.query(SQL);
  return events;
}

export async function getEventById(id) {
  const SQL = `SELECT * FROM events WHERE id = $1`;
  const {
    rows: [event],
  } = await db.query(SQL, [id]);
  return event;
}

export async function getEventsBySchoolId(id) {
  const SQL = `
    SELECT event.* FROM events event
    INNER JOIN schools_events schoolEvent on event.id = schoolEvent.event_id
    WHERE schoolEvent.school_id = $1
    `;
  const { rows: events } = await db.query(SQL, [id]);
  return events;
}

export async function getEventsByVolunteerId(id) {
  const SQL = `
    SELECT event.* FROM events event
    INNER JOIN schools_events schoolEvent ON event.id = schoolEvent.event_id
    INNER JOIN volunteers volunteer ON schoolEvent.school_id = volunteer.school_id
    WHERE volunteer.id = $1
    `;

  const { rows: events } = await db.query(SQL, [id]);
  return events;
}

export async function getEventsByStudentId(id) {
  const SQL = `
    SELECT event.* FROM events event
    INNER JOIN  schools_events schoolEvent ON event.id = schoolEvent.event_id
    INNER JOIN students student ON schoolEvent.school_id = student.school_id
    WHERE student.id = $1`;

  const { rows: events } = await db.query(SQL, [id]);
  return events;
}

export async function setStudentAbsence(eventId, studentId, absent) {
  const SQL = `
    UPDATE students_events 
    SET absent = $3
    WHERE event_id = $1 
    AND student_id = $2
    RETURNING *
    `;

  const {
    rows: [result],
  } = await db.query(SQL, [eventId, studentId, absent]);
  return result;
}

export async function setVolunteerAbsence(eventId, volunteerId, absent) {
  const SQL = `
    UPDATE volunteers_events
    SET absent = $3
    WHERE event_id = $1
    AND volunteer_id = $2
    RETURNING *
    `;

  const {
    rows: [result],
  } = await db.query(SQL, [eventId, volunteerId, absent]);
  return result;
}

// Bulk enrollment of all students at a school into
// each newly created event.
export async function enrollStudentsForEvent(schoolId, eventId) {
  const SQL = `
  INSERT INTO students_events (student_id, event_id) 
  SELECT id, $1
  FROM students
  WHERE school_id = $2`;
  await db.query(SQL, [eventId, schoolId]);
}

// Bulk enrollment of all volunteers at a school into
// each newly created event.
export async function enrollVolunteersForEvent(schoolId, eventId) {
  const SQL = `
  INSERT INTO volunteers_events (volunteer_id, event_id) SELECT id, $1 
  FROM volunteers
  WHERE school_id = $2`;
  await db.query(SQL, [eventId, schoolId]);
}

// Get students names participating in an event (exclude those marked absent) and include parent contact
export async function getStudentsByEventId(id) {
  const SQL = `
    SELECT 
     student.first_name AS student_first_name,
     student.last_name AS student_last_name,
     parent.first_name AS parent_first_name, 
     parent.last_name AS parent_last_name, 
     parent.phone AS parent_phone
    FROM students_events studentEvent
    INNER JOIN students student ON studentEvent.student_id = student.id
    INNER JOIN parents parent ON student.parent_id = parent.id
    WHERE studentEvent.event_id = $1 AND studentEvent.absent = FALSE`;
  const { rows: students } = await db.query(SQL, [id]);
  return students;
}

// Get volunteers participating in an event (exclude those marked absent)
export async function getVolunteersByEventId(id) {
  const SQL = `
    SELECT 
    volunteer.first_name AS volunteer_first_name, 
    volunteer.last_name AS volunteer_last_name,
    volunteer.phone AS volunteer_phone
    FROM volunteers_events volunteerEvent
    INNER JOIN volunteers volunteer ON volunteerEvent.volunteer_id = volunteer.id
    WHERE volunteerEvent.event_id = $1 AND volunteerEvent.absent = FALSE
  `;
  const { rows: volunteers } = await db.query(SQL, [id]);
  return volunteers;
}

export async function updateEvent(
  id,
  title,
  type,
  date,
  startLocation,
  endLocation,
  startTime,
  endTime
) {
  const SQL = `
    UPDATE events
    SET
        title = $2,
        type = $3,
        date = $4,
        start_location = $5,
        end_location = $6,
        start_time = $7,
        end_time = $8
      WHERE id = $1
    RETURNING *`;

  const {
    rows: [event],
  } = await db.query(SQL, [
    id,
    title,
    type,
    date,
    startLocation,
    endLocation,
    startTime,
    endTime,
  ]);

  return event;
}

export async function deleteEvent(id) {
  const SQL = `DELETE FROM events WHERE id = $1`;
  const {
    rows: [event],
  } = await db.query(SQL, [id]);
  return event;
}
