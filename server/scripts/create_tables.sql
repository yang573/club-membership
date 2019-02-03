USE dev_sbcs;

CREATE TABLE IF NOT EXISTS academic_year (
	YearID int,
    Value varchar(255)
);

INSERT INTO academic_year
VALUES
	(1, 'Freshman'),
	(2, 'Sophomore'),
    (3, 'Junior'),
    (4, 'Senior'),
    (5, 'Graduate Student'),
    (6, 'Professor'),
    (7, 'Company Rep'),
    (8, 'Other');

CREATE TABLE IF NOT EXISTS semester (
	SemesterID int PRIMARY KEY AUTO_INCREMENT,
    Value varchar(255)
);

INSERT INTO semester (Value)
VALUES
	('Spring 2018'),
    ('Fall 2018');

CREATE TABLE IF NOT EXISTS members (
	MemberID int PRIMARY KEY AUTO_INCREMENT,
    FirstName varchar(255),
    LastName varchar(255),
    YearID int,
    Email varchar(255),
    Newsletter boolean
);

CREATE TABLE IF NOT EXISTS events (
	EventID int PRIMARY KEY AUTO_INCREMENT,
    Name varchar(255),
    Date date,
    SemesterID int NOT NULL,
    Attendance int,
    FOREIGN KEY (SemesterID) REFERENCES semester(SemesterID)
);

CREATE TABLE IF NOT EXISTS member_event (
	MemberID int NOT NULL,
    EventID int NOT NULL,
	FOREIGN KEY (MemberID) REFERENCES members(MemberID),
    FOREIGN KEY (EventID) REFERENCES events(EventID)
);
-- for now, company reps will be added to the member
-- table and therefore have a corresponding member id
CREATE TABLE IF NOT EXISTS promos (
	PromoID int PRIMARY KEY AUTO_INCREMENT,
    PromoLink varchar(900),
    CompanyID int NOT NULL,
    FOREIGN KEY (CompanyID) REFERENCES members(MemberID),
    ExpireDate timestamp,
    QuanityAvailable int NOT null
);
CREATE TABLE IF NOT EXISTS member_login (
	UserName varchar(15),
    Email varchar(50),
    MemberID int NOT null,
    FOREIGN KEY (MemberID) REFERENCES members(MemberID),
    Salt varchar(150),
    HashValue varchar(300)
);
