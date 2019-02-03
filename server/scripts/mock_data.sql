Use dev_sbcs;

INSERT INTO Members (FirstName, LastName, YearID, Email, Newsletter)
VALUES
	('Brianna', 'Florio', 2, 'brianna.florio@stonybrook.edu', true),
	('Joe', 'Wilson', 2, 'joseph.wilson@stonybrook.edu', true),
	('Yang', 'Yang', 2, 'yang.yang.7@stonybrook.edu', true),
    ('John', 'Doe', 4, 'john.doe@notreal.edu', false);

INSERT INTO Members (FirstName, LastName, YearID, Email, Newsletter)
VALUES ('Jim', 'Moe', 3, 'john.moe@notreal.edu', false);

INSERT INTO Events (Name, Date, SemesterID, Attendance)
VALUES
	('Event One', '2018-01-01', 1, 3),
    ('Event Two', '2018-09-01', 2, 2);

INSERT INTO Events (Name, Date, SemesterID, Attendance)
VALUES
	('Event Tree', '2018-12-01', 2, 0);

INSERT INTO Member_Event
VALUES
	(1, 1),
    (2, 1),
    (4, 1),
    (2, 2),
    (3, 2);

INSERT INTO Promos (PromoLink,CompanyID,ExpireDate,QuanityAvailable)
VALUES ('https://sbcs.io',4,'2019-01-01 00:00:01', 100);
