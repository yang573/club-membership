USE dev_sbcs;

CREATE VIEW Membership AS SELECT
	base.*,
    CASE WHEN Semester_Attendance > 2
		THEN true
        ELSE false
		END AS Active
FROM(
SELECT
	Members.MemberID,
	Members.FirstName,
	Members.LastName,
	Members.YearID,
	(SELECT COUNT(*) FROM Events WHERE
		SemesterID = (SELECT SemesterID FROM Semester ORDER BY SemesterID DESC LIMIT 1) AND
		EventID IN (SELECT EventID FROM Member_Event WHERE Member_Event.MemberID = Members.MemberID))
		AS Semester_Attendance,
	(SELECT COUNT(*) FROM Member_Event WHERE Member_Event.MemberID = Members.MemberID)
		AS Total_Attendance
FROM Members
) AS base;


CREATE VIEW Recent_Events AS SELECT
	EventID, Name, Date, Attendance
FROM Events
WHERE SemesterID = (SELECT SemesterID FROM Semester ORDER BY SemesterID DESC LIMIT 1);


CREATE VIEW Semester_Overview AS SELECT
	base.*,
    (SELECT COUNT(*) FROM Events WHERE Events.SemesterID = ID)
		AS Number_Of_Events,
	(SELECT ROUND(AVG(Attendance), 2) FROM Events WHERE Events.SemesterID = ID)
		AS Average_Attendance
FROM (
SELECT
	Semester.Value AS Name,
    Semester.SemesterID AS ID
FROM Semester
) AS base;
