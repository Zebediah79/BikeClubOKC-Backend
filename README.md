# BikeClubOKC-Backend

## API Endpoints

This document lists the API endpoints implemented in the `api/` folder, the expected request bodies, example responses, and the expected HTTP status codes. Mount points assumed:

- `POST /users/...` maps to `api/users.js`
- `GET|PUT /parents/...` maps to `api/parents.js` (mounted at `/parents`)
- `GET|POST|PUT|DELETE /volunteers/...` maps to `api/volunteers.js` (mounted at `/volunteers`)

## Authentication

### POST /users/parents/login

- Request headers: `Content-Type: application/json`
- Request body:

```json
{
  "email": "parent@example.com",
  "password": "password123"
}
```

- Successful response: `200 OK` — body: JWT token string

Example:

```json
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Failure: `401 Unauthorized` (invalid credentials)

---

### POST /users/volunteers/login

- Request headers: `Content-Type: application/json`
- Request body: same shape as parent login
- Successful response: `200 OK` — body: JWT token string
- Failure: `401 Unauthorized`

---

## Parents routes (mount: `/parents`)

All parent routes expect an `Authorization: Bearer <token>` header (token created by parent login). `:id` path parameter is the parent id and access is restricted — tokens must match the `:id`.

### GET /parents/:id

- Request body: none
- Response: `200 OK` — parent profile object

Example response:

```json
{
  "id": 12,
  "email": "parent@example.com",
  "first_name": "Jane",
  "last_name": "Doe",
  "phone": "555-0123",
  "address": "123 Main St",
  "waiver": true
}
```

Failure: `401 Unauthorized` (no/invalid token), `403 Forbidden` (token user != :id), `404 Not Found` (profile missing)

---

### GET /parents/:id/students

- Request body: none
- Response: `200 OK` — array of student's summary objects

Example response:

```json
[
  {
    "id": 5,
    "first_name": "Sam",
    "last_name": "Doe",
    "birthdate": "2010-05-15",
    "bike_size": "20",
    "shirt_size": "M",
    "earned_bike": false,
    "status": "active"
  }
]
```

Failure: `401`, `403`

---

### GET /parents/:id/students/:studentId

- Request body: none
- Response: `200 OK` — full student object

Example response:

```json
{
  "id": 5,
  "first_name": "Sam",
  "last_name": "Doe",
  "birthdate": "2010-05-15",
  "bike_size": "20",
  "shirt_size": "M",
  "earned_bike": false,
  "status": "active",
  "parent_id": 12,
  "school_id": 2
}
```

Failure: `401`, `403`, `404`

---

### PUT /parents/:id/students/:studentId

- Request headers: `Content-Type: application/json`, `Authorization: Bearer <token>`
- Request body: partial or full student fields (fields that are omitted will remain unchanged). Example body:

```json
{
  "first_name": "Samuel",
  "bike_size": "22"
}
```

- Response: `200 OK` — updated student object
- Failure: `400 Bad Request` (missing body/invalid), `401`, `403`, `404`

---

### GET /parents/:id/students/:studentId/events

- Request body: none
- Response: `200 OK` — array of events for the student

Example response:

```json
[
  {
    "id": 10,
    "title": "Park Ride",
    "type": "outing",
    "date": "2025-06-01",
    "start_location": "School",
    "end_location": "Park",
    "start_time": "09:00:00",
    "end_time": "11:00:00"
  }
]
```

---

### PUT /parents/:id/students/:studentId/events/:eventId/absence

- Request headers: `Content-Type: application/json`, `Authorization`
- Request body (optional):

```json
{ "absent": true }
```

- Response: `200 OK` — message and the updated students_events row

Example response:

```json
{
  "message": "Student absence updated.",
  "result": {
    "id": 123,
    "student_id": 5,
    "event_id": 10,
    "absent": true
  }
}
```

Failure: `401`, `403`, `404`, `400`

---

## Volunteer routes (mount: `/volunteers`)

Most volunteer endpoints require `Authorization: Bearer <token>` and check that the token user id equals the `:id` in the path.

### GET /volunteers/

- Request: `Authorization: Bearer <token>`
- Behavior: redirects based on role — facilitator vs volunteer
- Response: `302 Found` redirect to either `/volunteers/facilitator/:id` or `/volunteers/volunteer/:id`

---

### GET /volunteers/volunteer/:id

- Request body: none
- Response: `200 OK` — volunteer profile

Example:

```json
{
  "id": 3,
  "email": "volunteer@example.com",
  "first_name": "Jane",
  "last_name": "Smith",
  "birthdate": "1990-03-20",
  "interest": "cycling",
  "phone": "555-9876",
  "facilitator": false,
  "preferred_school": "Lincoln Elementary",
  "school_id": 2,
  "flexible": true,
  "background_check": true,
  "status": "active"
}
```

---

### GET /volunteers/volunteer/:id/events

- Request body: none
- Response: `200 OK` — array of events assigned to volunteer (by volunteer.school_id)

### GET /volunteers/volunteer/:id/events/:eventId

- Request body: none
- Response: `200 OK` — event object

### GET /volunteers/volunteer/:id/events/:eventId/students

- Request body: none
- Response: `200 OK` — array of students attending event with parent contact and absent flag

Example item:

```json
{
  "student_first_name": "Sam",
  "student_last_name": "Doe",
  "parent_first_name": "Jane",
  "parent_last_name": "Doe",
  "parent_phone": "555-0123",
  "absent": false
}
```

### GET /volunteers/volunteer/:id/events/:eventId/volunteers

- Request body: none
- Response: `200 OK` — array of volunteers for the event with absent flag

### PUT /volunteers/volunteer/:id/events/:eventId/absence

- Request headers: `Content-Type: application/json`, `Authorization`
- Request body (optional): `{ "absent": true }` (default true in code)
- Response: `200 OK` — message and updated volunteers_events row

Example response:

```json
{
  "message": "Volunteer absence updated.",
  "result": { "id": 77, "volunteer_id": 3, "event_id": 10, "absent": true }
}
```

---

## Facilitator routes (mount: `/volunteers/facilitator`)

All facilitator routes require the user to be a facilitator (middleware checks `req.user.facilitator`).

### GET /volunteers/facilitator/:id

- Request body: none
- Response: `200 OK` — facilitator profile (same shape as volunteer profile)

### GET /volunteers/facilitator/:id/events

- Request body: none
- Response: `200 OK` — list of events for facilitator's school or events they create

### GET /volunteers/facilitator/:id/events/:eventId

- Request body: none
- Response: `200 OK` — event object

### GET /volunteers/facilitator/:id/events/:eventId/students

- Request body: none
- Response: `200 OK` — students attending with absent flags and parent contact

### GET /volunteers/facilitator/:id/events/:eventId/volunteers

- Request body: none
- Response: `200 OK` — volunteers attending with absent flags

### POST /volunteers/facilitator/:id/events

- Request headers: `Content-Type: application/json`, `Authorization`
- Request body (required fields):

```json
{
  "title": "Park Ride",
  "type": "outing",
  "date": "2025-06-01",
  "startLocation": "School",
  "endLocation": "Park",
  "startTime": "09:00",
  "endTime": "11:00"
}
```

- Response: `201 Created` — message and created event object

### PUT /volunteers/facilitator/:id/events/:eventId

- Request headers: `Content-Type: application/json`, `Authorization`
- Request body: event fields (id optional; router falls back to param)
- Response: `200 OK` — updated event object

### DELETE /volunteers/facilitator/:id/events/:eventId

- Request headers: `Authorization`
- Response: `204 No Content` on success

---
