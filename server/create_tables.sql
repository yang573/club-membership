USE dev_sbcs;

CREATE TABLE IF NOT EXISTS Academic_Year (
	YearID int,
    Value varchar(255)
);

INSERT INTO Academic_Year
VALUES
	(1, 'Freshman'),
	(2, 'Sophomore'),
    (3, 'Junior'),
    (4, 'Senior'),
    (5, 'Graduate Student'),
    (6, 'Professor'),
    (7, 'Other'),
    (8, 'Company Rep');

CREATE TABLE IF NOT EXISTS Semester (
	SemesterID int PRIMARY KEY AUTO_INCREMENT,
    Value varchar(255)
);

INSERT INTO Semester (Value)
VALUES
	('Spring 2018'),
    ('Fall 2018');

CREATE TABLE IF NOT EXISTS Members (
	MemberID int PRIMARY KEY AUTO_INCREMENT,
    FirstName varchar(255),
    LastName varchar(255),
    YearID int,
    Email varchar(255),
    Newsletter boolean
);

CREATE TABLE IF NOT EXISTS Events (
	EventID int PRIMARY KEY AUTO_INCREMENT,
    Name varchar(255),
    Date date,
    SemesterID int NOT NULL,
    Attendance int,
    FOREIGN KEY (SemesterID) REFERENCES Semester(SemesterID)
);

CREATE TABLE IF NOT EXISTS Member_Event (
	MemberID int NOT NULL,
    EventID int NOT NULL,
	FOREIGN KEY (MemberID) REFERENCES Members(MemberID),
    FOREIGN KEY (EventID) REFERENCES Events(EventID)
);
-- for now, company reps will be added to the member
-- table and therefore have a corresponding member id
CREATE TABLE IF NOT EXISTS Promos (
	PromoID int PRIMARY KEY AUTO_INCREMENT,
    PromoLink varchar(900),
    CompanyID int NOT NULL,
    FOREIGN KEY (CompanyID) REFERENCES Members(MemberID),
    ExpireDate timestamp,
    QuanityAvailable int NOT null
);
CREATE TABLE IF NOT EXISTS Member_Login (
	UserName varchar(15),
    Email varchar(50),
    MemberID int NOT null,
    FOREIGN KEY (MemberID) REFERENCES Members(MemberID),
    Salt varchar(150),
    HashValue varchar(300)
);
