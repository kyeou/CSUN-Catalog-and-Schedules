import { Client } from "pg";
import { DatabaseScheduleBody } from "./interfaces";
import { get_letters_only } from "./utilities";

export async function update_db(
	_COURSE: DatabaseScheduleBody,
	_TERM: { semester: string; year: number },
	_SUBJECT: string
): Promise<void> {
	const tup = [
		_COURSE["class_number"],
		_COURSE["enrollment_cap"],
		_COURSE["enrollment_count"],
		_COURSE["waitlist_cap"],
		_COURSE["waitlist_count"],
		_COURSE["instructor"],
		_COURSE["days"],
		_COURSE["location"],
		_COURSE["start_time"],
		_COURSE["end_time"],
		_TERM.semester.toLowerCase(),
		_TERM.year,
		get_letters_only(_SUBJECT),
		_COURSE["catalog_number"]
	];

	try {
		const client = new Client({
			user: "kyeou",
			host: "localhost",
			database: "csun",
			password: "q1w2e3r4!@#$",
			port: 5432
		});
		await client.connect();
		await client.query(
			`INSERT INTO section (class_number, enrollment_cap, enrollment_count, waitlist_cap, waitlist_count, instructor, days, location, start_time, end_time, semester, year, subject, catalog_number)
      			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      			ON CONFLICT (class_number, semester, year, subject, catalog_number)
      			DO UPDATE SET enrollment_cap = excluded.enrollment_cap,
      			              enrollment_count = excluded.enrollment_count,
      			              instructor = excluded.instructor,
      			              days = excluded.days,
      			              location = excluded.location,
      			              start_time = excluded.start_time,
      			              end_time = excluded.end_time`,
			tup
		);
		await client.end();
	} catch (error) {
		console.error("Error:", error);
	}
}
