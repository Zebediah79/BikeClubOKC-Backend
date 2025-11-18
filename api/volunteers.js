import express from "express";
const router = express.Router();
export default router;

import db from "#db/client";
import { createStudent } from "#db/queries/students";
import { createParent } from "#db/queries/parents";
import {
  createVolunteer,
  getVolunteerById,
  updateVolunteer,
} from "#db/queries/volunteers";
import {
  createEvent,
  getEventById,
  getEventsByVolunteerId,
  updateEvent,
  deleteEvent,
  enrollStudentsForEvent,
  enrollVolunteersForEvent,
  setVolunteerAbsence,
  getStudentsByEventId,
  getVolunteersByEventId,
} from "#db/queries/events";
import requireUser from "#middleware/requireUser";
import requireBody from "#middleware/requireBody";
import requireFacilitator from "#middleware/requireFacilitator";

import {
  getVolunteerFromToken,
  checkUserRole,
  reRouteVolunteer,
} from "#middleware/getUserFromToken";

router.use(getVolunteerFromToken);
router.use(requireUser);

// Mounting point for volunteer routes.
router.get("/", getVolunteerFromToken, checkUserRole, reRouteVolunteer);

// Middleware to validate volunteerId and load profile and events
router.param("id", async (req, res, next, id) => {
  const volunteerId = parseInt(id, 10);

  if (req.user.id !== volunteerId) {
    return res.status(403).send("Access denied.");
  }
  const profile = await getVolunteerById(volunteerId);
  const events = await getEventsByVolunteerId(volunteerId);
  req.profile = profile;
  req.events = events;
  next();
});

// Get volunteer profile
router.get("/volunteer/:id", async (req, res) => {
  res.status(201).send(req.profile);
});

// Update volunteer profile info
router.put("/volunteer/:id", requireBody([]), async (req, res) => {
  const existing = req.profile;
  if (!existing) return res.status(404).send("Volunteer not found.");
  // Destructure with existing values
  const {
    first_name = existing.first_name,
    last_name = existing.last_name,
    email = existing.email,
    password = existing.password,
    phone = existing.phone,
    interest = existing.interest,
    facilitator = existing.facilitator,
    preferred_school = existing.preferred_school,
    flexible = existing.flexible,
    background_check = existing.background_check,
    active_status = existing.status,
  } = req.body;
  const volunteerId = parseInt(req.params.id, 10);
  const updatedVolunteer = await updateVolunteer(
    volunteerId,
    first_name,
    last_name,
    email,
    password,
    phone,
    interest,
    facilitator,
    preferred_school,
    flexible,
    background_check,
    active_status
  );
  if (!updatedVolunteer)
    return res.status(404).send("Volunteer not found to update.");
  res.status(200).send(updatedVolunteer);
});

// All events for a volunteer
router.get("/volunteer/:id/events", async (req, res) => {
  res.status(201).send(req.events);
});

// Param middleware for eventId for specific events
router.param("eventId", async (req, res, next, id) => {
  const eventId = parseInt(id, 10);

  // Ensure req.events exists and is an array
  if (!Array.isArray(req.events)) {
    console.error("No array of events found.", req.events);
    return res.status(400).send("No events available.");
  }

  // Find the event in the volunteer's events
  const eventExist = req.events.find((e) => e.id === eventId);

  if (!eventExist) {
    console.error(
      `Event ${eventId} not found in volunteer's events:`,
      req.events.map((e) => e.id)
    );
    return res.status(400).send("Event Not Found.");
  }

  const event = await getEventById(eventId);
  req.event = event;
  next();
});

router.get("/volunteer/:id/events/:eventId", async (req, res) => {
  res.status(201).send(req.event);
});

// Get students for an event (volunteer access) — returns student's name, parent's name, parent's phone, absent flag
router.get("/volunteer/:id/events/:eventId/students", async (req, res) => {
  try {
    const students = await getStudentsByEventId(req.event.id);
    // normalize shape: student_first_name, student_last_name, parent_first_name, parent_last_name, parent_phone, absent
    res.status(200).send(students);
  } catch (err) {
    console.error("Error fetching students for event:", err);
    res.status(500).send({ error: "Failed to fetch students for event" });
  }
});

// Get volunteers attendance for an event (volunteer access) — returns volunteer name and absent status.
router.get("/volunteer/:id/events/:eventId/volunteers", async (req, res) => {
  try {
    const vols = await getVolunteersByEventId(req.event.id);
    res.status(200).send(vols);
  } catch (err) {
    console.error("Error fetching volunteers for event:", err);
    res.status(500).send({ error: "Failed to fetch volunteers for event" });
  }
});

// Allow a volunteer to report their own absence for an event
router.put("/volunteer/:id/events/:eventId/absence", async (req, res) => {
  const volunteerId = parseInt(req.params.id, 10);
  if (req.user.id !== volunteerId)
    return res.status(403).send("Access denied.");

  const eventId = parseInt(req.params.eventId, 10);
  const { absent = true } = req.body;

  const result = await setVolunteerAbsence(eventId, volunteerId, absent);
  res.status(200).send({ message: "Volunteer absence updated.", result });
});

/*=======================================================
                      facilitator                        
=========================================================*/

// Mounting point for facilitator routes.
router.get("/facilitator", requireFacilitator);

// Get facilitator profile
router.get("/facilitator/:id", async (req, res) => {
  res.status(201).send(req.profile);
});

// Update facilitator profile info
router.put("/facilitator/:id", requireBody([]), async (req, res) => {
  const existing = req.profile;
  if (!existing) return res.status(404).send("Volunteer not found.");
  // Destructure with existing values
  const {
    first_name = existing.first_name,
    last_name = existing.last_name,
    email = existing.email,
    password = existing.password,
    phone = existing.phone,
    interest = existing.interest,
    facilitator = existing.facilitator,
    preferred_school = existing.preferred_school,
    flexible = existing.flexible,
    background_check = existing.background_check,
    active_status = existing.status,
  } = req.body;
  const volunteerId = parseInt(req.params.id, 10);
  const updatedVolunteer = await updateVolunteer(
    volunteerId,
    first_name,
    last_name,
    email,
    password,
    phone,
    interest,
    facilitator,
    preferred_school,
    flexible,
    background_check,
    active_status
  );
  if (!updatedVolunteer)
    return res.status(404).send("Volunteer not found to update.");
  res.status(200).send(updatedVolunteer);
});

// All events for a facilitator
router.get("/facilitator/:id/events", async (req, res) => {
  res.status(201).send(req.events);
});

// Get specific event for facilitator
router.get(
  "/facilitator/:id/events/:eventId",
  requireFacilitator,
  async (req, res) => {
    res.status(201).send(req.event);
  }
);

// Facilitator: get students for an event (includes absent status and parent contact)
router.get("/facilitator/:id/events/:eventId/students", async (req, res) => {
  try {
    const students = await getStudentsByEventId(req.event.id);
    res.status(200).send(students);
  } catch (err) {
    console.error("Error fetching students for event:", err);
    res.status(500).send({ error: "Failed to fetch students for event" });
  }
});

// Facilitator: get volunteers attendance for an event (names + absent status)
router.get("/facilitator/:id/events/:eventId/volunteers", async (req, res) => {
  try {
    const vols = await getVolunteersByEventId(req.event.id);
    res.status(200).send(vols);
  } catch (err) {
    console.error("Error fetching volunteers for event:", err);
    res.status(500).send({ error: "Failed to fetch volunteers for event" });
  }
});

// Middleware to validate parentId and create parents and students
router.param("parentId", async (req, res, next, id) => {
  const parentId = parseInt(id, 10);
  req.parentId = parentId;
  next();
});

// Create a new student under a parent
router.post(
  "/facilitator/:id/parents/:parentId/students",
  requireBody([
    "first_name",
    "last_name",
    "birthdate",
    "bike_size",
    "shirt_size",
  ]),
  async (req, res) => {
    const parentId = parseInt(req.params.parentId, 10);
    const { first_name, last_name, birthdate, bike_size, shirt_size } =
      req.body;
    const earned_bike = false;
    const status = "active";
    const schoolId = req.profile.school_id;
    try {
      const newStudent = await createStudent(
        first_name,
        last_name,
        birthdate,
        bike_size,
        shirt_size,
        earned_bike,
        status,
        parentId,
        schoolId
      );
      res
        .status(201)
        .send({ message: "New students created.", student: newStudent });
    } catch (err) {
      console.error("Error creating student:", err);
      res.status(500).send("Failed to create student");
    }
  }
);

// Create a new parent under the facilitator's school
router.post(
  "/facilitator/:id/parents",
  requireBody([
    "email",
    "first_name",
    "last_name",
    "phone",
    "address",
    "waiver",
  ]),
  async (req, res) => {
    try {
      const { first_name, last_name, email, phone, address, waiver } = req.body;

      // Auto-generated password for facilitator-created parents
      const password = req.body.last_name;
      const newParent = await createParent(
        email,
        password,
        first_name,
        last_name,
        phone,
        address,
        waiver
      );
      res
        .status(201)
        .send({ message: "New parent created", parent: newParent });
    } catch (err) {
      console.error("Error creating parent:", err);
      res.status(500).send("Failed to create parent");
    }
  }
);

// Create a new volunteer under the facilitator's school
router.post(
  "/facilitator/:id/volunteers",
  requireBody([
    "email",
    "password",
    "first_name",
    "last_name",
    "birthdate",
    "interest",
    "phone",
    "facilitator",
    "preferred_school",
    "flexible",
    "background_check",
  ]),
  async (req, res) => {
    const {
      email,
      password,
      first_name,
      last_name,
      birthdate,
      interest,
      phone,
      facilitator,
      preferred_school,
      flexible,
      background_check,
    } = req.body;
    // Use the facilitator's school and create the volunteer under that school
    const schoolId = req.profile.school_id;
    const active_status = "active";
    const newVolunteer = await createVolunteer(
      email,
      password,
      first_name,
      last_name,
      birthdate,
      interest,
      phone,
      facilitator,
      preferred_school,
      schoolId,
      flexible,
      background_check,
      active_status
    );
    res
      .status(201)
      .send({ message: "New volunteer created.", volunteer: newVolunteer });
  }
);

// Create a new event under the facilitator's school
router.post(
  "/facilitator/:id/events",
  requireBody([
    "title",
    "type",
    "date",
    "startLocation",
    "endLocation",
    "startTime",
    "endTime",
  ]),
  async (req, res) => {
    const {
      title,
      type,
      date,
      startLocation,
      endLocation,
      startTime,
      endTime,
    } = req.body;

    const event = await createEvent(
      title,
      type,
      date,
      startLocation,
      endLocation,
      startTime,
      endTime
    );
    // Use the facilitator's school and enroll participants
    const schoolId = req.profile.school_id;
    if (schoolId) {
      await db.query(
        `INSERT INTO schools_events (school_id, event_id) VALUES ($1, $2)`,
        [schoolId, event.id]
      );

      // Automatically enroll students and volunteers for that school into the event
      await enrollStudentsForEvent(schoolId, event.id);
      await enrollVolunteersForEvent(schoolId, event.id);
    }

    res.status(201).send({ message: "New event added.", event });
  }
);

// Update an event under the facilitator's school
router.put(
  "/facilitator/:id/events/:eventId",
  requireBody([]),
  async (req, res) => {
    const existing = req.event;
    if (!existing) return res.status(404).send("Event not found.");
    const {
      id = existing.id,
      title = existing.title,
      type = existing.type,
      date = existing.date,
      start_location = existing.start_location,
      end_location = existing.end_location,
      start_time = existing.start_time,
      end_time = existing.end_time,
    } = req.body;

    const eventId = parseInt(req.params.eventId, 10);

    const updatedEvent = await updateEvent(
      eventId,
      title,
      type,
      date,
      start_location,
      end_location,
      start_time,
      end_time
    );

    if (!updatedEvent)
      return res.status(404).send("Event not found to update.");
    res.status(200).send({ message: "Event updated", event: updatedEvent });
  }
);

// Delete a volunteer under the facilitator's school
router.delete("/facilitator/:id/volunteers/:volunteerId", async (req, res) => {
  const volunteerId = req.volunteerId;
  await db.query(`DELETE FROM volunteers WHERE id = $1`, [volunteerId]);
  res.status(204).send();
});

// Delete a student under the facilitator's school
router.delete("/facilitator/:id/students/:studentId", async (req, res) => {
  const studentId = req.studentId;
  await db.query(`DELETE FROM students WHERE id = $1`, [studentId]);
  res.status(204).send();
});

// Delete a parent under the facilitator's school
router.delete("/facititator/:id/parents/:parentId", async (req, res) => {
  const parentId = req.parentId;
  await db.query(`DELETE FROM parents WHERE id = $1`, [parentId]);
  res.status(204).send();
});

// Delete an event under the facilitator's school
router.delete("/facilitator/:id/events/:eventId", async (req, res) => {
  await deleteEvent(req.event.id);
  res.status(204).send();
});
