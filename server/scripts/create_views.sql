USE dev_sbcs;

CREATE VIEW membership AS SELECT
	base.*,
    CASE WHEN semester_attendance > 2
		THEN true
        ELSE false
		END AS Active
FROM(
SELECT
	members.MemberID,
	members.FirstName,
	members.LastName,
	members.YearID,
	(SELECT COUNT(*) FROM events WHERE
		SemesterID = (SELECT SemesterID FROM semester ORDER BY SemesterID DESC LIMIT 1) AND
		EventID IN (SELECT EventID FROM member_event WHERE member_event.MemberID = members.MemberID))
		AS Semester_Attendance,
	(SELECT COUNT(*) FROM member_event WHERE member_event.MemberID = members.MemberID)
		AS Total_Attendance
FROM members
) AS base;


CREATE VIEW recent_events AS SELECT
	EventID, Name, Date, Attendance
FROM events
WHERE SemesterID = (SELECT SemesterID FROM semester ORDER BY SemesterID DESC LIMIT 1);


CREATE VIEW semester_overview AS SELECT
	base.*,
    (SELECT COUNT(*) FROM events WHERE events.SemesterID = ID)
		AS Number_Of_Events,
	(SELECT ROUND(AVG(Attendance), 2) FROM events WHERE events.SemesterID = ID)
		AS Average_Attendance
FROM (
SELECT
	semester.Value AS Name,
    semester.SemesterID AS ID
FROM semester
) AS base;
