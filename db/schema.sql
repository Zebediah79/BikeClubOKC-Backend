DROP TABLE IF EXISTS volunteers_events;
DROP TABLE IF EXISTS students_events;
DROP TABLE IF EXISTS schools_events;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS parents;
DROP TABLE IF EXISTS volunteers;
DROP TABLE IF EXISTS schools;
DROP TABLE IF EXISTS events;


CREATE TABLE parents (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  waiver BOOLEAN NOT NULL
);

CREATE TABLE schools (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  day TEXT NOT NULL
);

CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  birthdate DATE NOT NULL,
  bike_size TEXT NOT NULL,
  shirt_size TEXT NOT NULL,
  earned_bike BOOLEAN NOT NULL,
  status TEXT NOT NULL,
  parent_id INT NOT NULL,
  school_id INT NOT NULL,
  FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE TABLE volunteers (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  birthdate DATE NOT NULL,
  interest TEXT,
  phone TEXT NOT NULL,
  facilitator BOOLEAN NOT NULL DEFAULT FALSE,
  preferred_school TEXT,
  school_id INT NOT NULL,
  flexible BOOLEAN DEFAULT TRUE,
  background_check BOOLEAN NOT NULL,
  status TEXT NOT NULL,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  start_location TEXT NOT NULL,
  end_location TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL
);

CREATE TABLE schools_events (
  id SERIAL PRIMARY KEY,
  school_id INT NOT NULL,
  event_id INT NOT NULL,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE TABLE students_events (
  id SERIAL PRIMARY KEY,
  student_id INT NOT NULL,
  event_id INT NOT NULL,
  absent BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE TABLE volunteers_events (
  id SERIAL PRIMARY KEY,
  volunteer_id INT NOT NULL,
  event_id INT NOT NULL,
  absent BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (volunteer_id) REFERENCES volunteers(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);