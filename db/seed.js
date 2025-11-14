import db from "#db/client";
import { faker } from "@faker-js/faker";
import bcrypt from "bcrypt";

import { createParent } from "#db/queries/parents";
import { createStudent } from "#db/queries/students";
import { createVolunteer } from "#db/queries/volunteers";
import {
  createEvent,
  enrollStudentsForEvent,
  enrollVolunteersForEvent,
} from "#db/queries/events";
import { createSchool } from "#db/queries/schools";

async function seed() {
  console.log("Starting database seeding...");

  // Use same arrays as previous seed
  const shirtSizes = ["S", "M", "L"];
  const bikeSizes = ["XS", "S", "M", "L", "XL"];
  const statuses = ["active", "inactive"];
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  try {
    // connect DB client (seed runs standalone)
    await db.connect();

    //Create 5 schools using createSchool()
    const schoolIds = [];
    for (let i = 0; i < 5; i++) {
      const name = `${faker.location.city()} School`;
      const address = faker.location.streetAddress();
      const day = faker.helpers.arrayElement(days);
      const school = await createSchool(name, address, day);
      schoolIds.push(school.id);
    }

    //Create 30 parents
    const parents = [];
    for (let i = 0; i < 30; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const email = faker.internet.email({ firstName, lastName });
      const phone = faker.phone.number();
      const address = faker.location.streetAddress();
      const waiver = faker.datatype.boolean();

      const parent = await createParent(
        email,
        "password",
        firstName,
        lastName,
        phone,
        address,
        waiver
      );

      parents.push({ id: parent.id, childCount: 0, schoolId: null });
    }

    //Create 15 volunteers (5 facilitators).
    const volunteers = [];
    for (let i = 0; i < 15; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const email = faker.internet.email({ firstName, lastName });
      const phone = faker.phone.number();
      const birthdate = faker.date.birthdate({ min: 25, max: 65, mode: "age" });
      const facilitator = i < 5;
      const preferredSchoolId = faker.helpers.arrayElement(schoolIds);
      const preferredSchoolRow = await db.query(
        "SELECT name FROM schools WHERE id = $1",
        [preferredSchoolId]
      );
      const preferredSchoolName = preferredSchoolRow.rows?.[0]?.name || null;

      const volunteer = await createVolunteer(
        email,
        "password",
        firstName,
        lastName,
        birthdate,
        null, // interest
        phone,
        facilitator,
        preferredSchoolName,
        preferredSchoolId,
        faker.datatype.boolean(), // flexible
        faker.datatype.boolean(), // background check
        faker.helpers.arrayElement(statuses)
      );

      volunteers.push(volunteer.id);
    }

    // Helper to find a parent that can accept a child for the specified school
    function findParentForSchool(schoolId) {
      // prefer parents with 1 child already in the same school (to fill to 2)
      let p = parents.find(
        (pp) => pp.childCount === 1 && pp.schoolId === schoolId
      );
      if (p) return p;

      // otherwise find a parent with 0 children
      p = parents.find((pp) => pp.childCount === 0);
      if (p) return p;

      // otherwise find any parent with childCount < 2 whose schoolId is null or matches
      p = parents.find(
        (pp) =>
          pp.childCount < 2 &&
          (pp.schoolId === null || pp.schoolId === schoolId)
      );
      return p || null;
    }

    //Create 50 students, 10 per school, obey parent constraints
    const studentPromises = [];
    for (const schoolId of schoolIds) {
      for (let j = 0; j < 10; j++) {
        // pick or create parent for this student
        const parent = findParentForSchool(schoolId);
        if (!parent)
          throw new Error("Not enough parent capacity to assign students");

        // assign student to that parent
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const birthdate = faker.date.birthdate({
          min: 6,
          max: 14,
          mode: "age",
        });
        const bikeSize = faker.helpers.arrayElement(bikeSizes);
        const shirtSize = faker.helpers.arrayElement(shirtSizes);
        const earnedBike = faker.datatype.boolean();
        const status = faker.helpers.arrayElement(statuses);

        // create student using query method
        const student = await createStudent(
          firstName,
          lastName,
          birthdate,
          bikeSize,
          shirtSize,
          earnedBike,
          status,
          parent.id,
          schoolId
        );

        // update parent tracking
        parent.childCount += 1;
        if (!parent.schoolId) parent.schoolId = schoolId;

        studentPromises.push(student.id);
      }
    }

    // 5) Create 20 events (4 per school), link them to schools and enroll participants
    const eventTypes = ["Workshop", "Ride", "Maintenance", "Fundraiser"];

    for (const schoolId of schoolIds) {
      for (let k = 0; k < 4; k++) {
        const title = `${faker.hacker.phrase()} - ${faker.word.noun()}`;
        const type = faker.helpers.arrayElement(eventTypes);
        const date = faker.date.soon({ days: 90 });
        const startLocation = faker.location.streetAddress();
        const endLocation = faker.location.streetAddress();
        const startTime = "09:00:00";
        const endTime = "12:00:00";

        const event = await createEvent(
          title,
          type,
          date,
          startLocation,
          endLocation,
          startTime,
          endTime
        );

        // link event to school
        await db.query(
          "INSERT INTO schools_events (school_id, event_id) VALUES ($1, $2)",
          [schoolId, event.id]
        );

        // Enroll current students and volunteers from this school into the event
        // events.js provides separate enrollment helpers
        await enrollStudentsForEvent(schoolId, event.id);
        await enrollVolunteersForEvent(schoolId, event.id);
      }
    }

    console.log("Seeding completed successfully!");
  } catch (err) {
    console.error("Error during seeding:", err);
  } finally {
    // close DB pool
    try {
      await db.end();
    } catch (e) {
      // ignore close errors during CI or if connection already closed
    }
  }
}

seed();
