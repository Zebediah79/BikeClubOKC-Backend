import express from "express";
const router = express.Router();
export default router;

import { getVolunteerById } from "#db/queries/volunteers";
import {
  createEvent,
  getEventById,
  getEventsByVolunteerId,
  updateEvent,
  deleteEvent,
  enrollParticipantsForEvent,
  setVolunteerAbsence,
  getStudentsAttendanceByEventId,
  getVolunteersAttendanceByEventId,
} from "#db/queries/events";
import db from "#db/client";
import { createVolunteer } from "#db/queries/volunteers";
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

router.get("/", getVolunteerFromToken, checkUserRole, reRouteVolunteer);

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

router.get("/volunteer/:id", async (req, res) => {
  res.status(201).send(req.profile);
});

router.get("/volunteer/:id/events", async (req, res) => {
  res.status(201).send(req.events);
});

// Param middleware for eventId (used on routes that operate on a specific event)
router.param("eventId", async (req, res, next, id) => {
  const eventId = parseInt(id, 10);

  // Ensure req.events exists and is an array
  if (!Array.isArray(req.events)) {
    console.error("No array of events found.", req.events);
    return res.status(400).send("No events available for this volunteer.");
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
    const students = await getStudentsAttendanceByEventId(req.event.id);
    // normalize shape: student_first_name, student_last_name, parent_first_name, parent_last_name, parent_phone, absent
    res.status(200).send(students);
  } catch (err) {
    console.error("Error fetching students for event:", err);
    res.status(500).send({ error: "Failed to fetch students for event" });
  }
});

// Get volunteers attendance for an event (volunteer access) — returns volunteer name and absent flag
router.get("/volunteer/:id/events/:eventId/volunteers", async (req, res) => {
  try {
    const vols = await getVolunteersAttendanceByEventId(req.event.id);
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

  const result = await setVolunteerAbsence(eventId, volunteerId, !!absent);
  res.status(200).send({ message: "Volunteer absence updated.", result });
});

/*--------------------facilitator--------------------*/
router.get("/facilitator/:id", requireFacilitator, async (req, res) => {
  res.status(201).send(req.profile);
});

router.get("/facilitator/:id/events", requireFacilitator, async (req, res) => {
  res.status(201).send(req.events);
});

// Facilitator: get students for an event (includes absent status and parent contact)
router.get(
  "/facilitator/:id/events/:eventId/students",
  requireFacilitator,
  async (req, res) => {
    try {
      const students = await getStudentsAttendanceByEventId(req.event.id);
      res.status(200).send(students);
    } catch (err) {
      console.error("Error fetching students for event:", err);
      res.status(500).send({ error: "Failed to fetch students for event" });
    }
  }
);

// Facilitator: get volunteers attendance for an event (names + absent flag)
router.get(
  "/facilitator/:id/events/:eventId/volunteers",
  requireFacilitator,
  async (req, res) => {
    try {
      const vols = await getVolunteersAttendanceByEventId(req.event.id);
      res.status(200).send(vols);
    } catch (err) {
      console.error("Error fetching volunteers for event:", err);
      res.status(500).send({ error: "Failed to fetch volunteers for event" });
    }
  }
);

router.post(
  "/facilitator/:id/events",
  requireFacilitator,
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
    // Link the event to the facilitator's school and enroll participants
    const schoolId = req.profile.school_id;
    if (schoolId) {
      // insert into schools_events
      await db.query(
        `INSERT INTO schools_events (school_id, event_id) VALUES (?, ?)`,
        [schoolId, event.id]
      );

      // enroll students and volunteers for that school into the event
      await enrollParticipantsForEvent(schoolId, event.id);
    }

    res.status(201).send({ message: "New event added.", event });
  }
);

router.put(
  "/facilitator/:id/events/:eventId",
  requireFacilitator,
  requireBody([
    "id",
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
      id,
      title,
      type,
      date,
      startLocation,
      endLocation,
      startTime,
      endTime,
    } = req.body;

    const eventId = parseInt(req.params.eventId, 10) || id;

    const updated = await updateEvent(
      eventId,
      title,
      type,
      date,
      startLocation,
      endLocation,
      startTime,
      endTime
    );

    if (!updated) return res.status(404).send("Event not found to update.");
    res.status(200).send(updated);
  }
);

router.delete(
  "/facilitator/:id/events/:eventId",
  requireFacilitator,
  async (req, res) => {
    await deleteEvent(req.event.id);
    res.status(204).send();
  }
);
