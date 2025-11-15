import express from "express";
const router = express.Router();
export default router;

import {
  getEventsBySchoolId,
  getEventById,
  getEventsByStudentId,
} from "#db/queries/events";
import { getParentById, updateParentInfo } from "#db/queries/parents";
import {
  getStudentsByParentId,
  getStudentById,
  updateStudent,
} from "#db/queries/students";
import { setStudentAbsence } from "#db/queries/events";
import requireUser from "#middleware/requireUser";
import requireBody from "#middleware/requireBody";
import { getParentFromToken } from "#middleware/getUserFromToken";

router.use(getParentFromToken);
router.use(requireUser);

router.param("id", async (req, res, next, id) => {
  const parentId = parseInt(id, 10);

  if (req.user.id !== parentId) {
    return res.status(403).send("Access denied.");
  }
  const profile = await getParentById(parentId);
  const students = await getStudentsByParentId(parentId);
  if (!profile) return res.status(404).send("Profile not found");
  req.profile = profile;
  req.students = students;
  next();
});

router.get("/:id", async (req, res) => {
  res.status(201).send(req.profile);
});

router.get("/:id/students", async (req, res) => {
  res.status(201).send(req.students);
});

router.param("studentId", async (req, res, next, id) => {
  const studentId = parseInt(id, 10);
  // req.students is an array of student objects returned by getStudentsByParentId
  const parentStudents = Array.isArray(req.students) ? req.students : [];

  // Verify the student belongs to the parent
  const belongs = parentStudents.find((s) => s.id === studentId);
  if (!belongs) return res.status(403).send("Access denied.");

  // Load up-to-date student and their events
  const student = await getStudentById(studentId);
  const events = await getEventsByStudentId(studentId);

  req.student = student;
  req.events = events;
  next();
});

router.get("/:id/students/:studentId", async (req, res) => {
  res.status(201).send(req.student);
});

router.put("/:id/students/:studentId", requireBody, async (req, res) => {
  const parentId = parseInt(req.params.id, 10);
  if (req.user.id !== parentId) return res.status(403).send("Access denied.");

  const studentId = parseInt(req.params.studentId, 10);

  // Ensure req.student was loaded by the param middleware
  const existing = req.student;
  if (!existing) return res.status(404).send("Student not found.");

  //Update fields with existing values
  const {
    first_name = existing.first_name,
    last_name = existing.last_name,
    birthdate = existing.birthdate,
    bike_size = existing.bike_size,
    shirt_size = existing.shirt_size,
    earned_bike = existing.earned_bike,
    status = existing.status,
    parent_id = existing.parent_id,
    school_id = existing.school_id,
  } = req.body;

  const updated = await updateStudent(
    studentId,
    first_name,
    last_name,
    birthdate,
    bike_size,
    shirt_size,
    earned_bike,
    status,
    parent_id,
    school_id
  );

  if (!updated) return res.status(404).send("Student not found to update.");
  res.status(200).send(updated);
});

router.get("/:id/students/:studentId/events", async (req, res) => {
  res.status(201).send(req.events);
});

router.param("eventId", async (req, res, next, id) => {
  const eventId = parseInt(id, 10);

  if (!Array.isArray(req.events)) {
    console.error("No array of events found.", req.events);
    return res.status(400).send("No events available for this student.");
  }

  const eventExist = req.events.find((e) => e.id === eventId);
  if (!eventExist) {
    console.error(
      `Event ${eventId} not found in student's events:`,
      req.events.map((e) => e.id)
    );
    return res.status(400).send("Event Not Found.");
  }
  const event = await getEventById(eventId);
  req.event = event;
  next();
});

// Parent reports child's absence (or un-reports) for an event
router.put(
  "/:id/students/:studentId/events/:eventId/absence",
  async (req, res) => {
    const parentId = parseInt(req.params.id, 10);
    if (req.user.id !== parentId) return res.status(403).send("Access denied.");

    const studentId = parseInt(req.params.studentId, 10);
    const eventId = parseInt(req.params.eventId, 10);
    const { absent = true } = req.body;

    // req.student is set by the studentId param middleware and already verified
    if (!req.student) return res.status(404).send("Student not found.");

    const result = await setStudentAbsence(eventId, studentId, absent);
    res.status(200).send({ message: "Student absence updated.", result });
  }
);
