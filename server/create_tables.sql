USE dev_sbcs;

CREATE TABLE Academic_Year (
	YearID int,
    Value varchar(255)
);

INSERT INTO Academic_Year
VALUES
	(0, 'Freshman'),
	(1, 'Sophomore'),
    (2, 'Junior'),
    (3, 'Senior'),
    (4, 'Graduate Student'),
    (5, 'Professor'),
    (6, 'Other');

CREATE TABLE Semester (
	SemesterID int PRIMARY KEY AUTO_INCREMENT,
    Value varchar(255)
);

INSERT INTO Semester (Value)
VALUES
	('Spring 2018'),
    ('Fall 2018');

CREATE TABLE Members (
	MemberID int PRIMARY KEY AUTO_INCREMENT,
    FirstName varchar(255),
    LastName varchar(255),
    YearID int,
    Email varchar(255),
    Newsletter boolean
);

CREATE TABLE Events (
	EventID int PRIMARY KEY AUTO_INCREMENT,
    Name varchar(255),
    Date date,
    SemesterID int NOT NULL,
    Attendance int,
    FOREIGN KEY (SemesterID) REFERENCES Semester(SemesterID)
);

CREATE TABLE Member_Event (
	MemberID int NOT NULL,
    EventID int NOT NULL,
	FOREIGN KEY (MemberID) REFERENCES Members(MemberID),
    FOREIGN KEY (EventID) REFERENCES Events(EventID)
);