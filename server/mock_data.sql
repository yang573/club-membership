Use dev_sbcs;

INSERT INTO Members (FirstName, LastName, YearID, Email, Newsletter)
VALUES
	('Brianna', 'Florio', 2, 'brianna.florio@stonybrook.edu', true),
	('Joe', 'Wilson', 2, 'joseph.wilson@stonybrook.edu', true),
	('Yang', 'Yang', 2, 'yang.yang.7@stonybrook.edu', true),
    ('John', 'Doe', 4, 'john.doe@notreal.edu', false);

INSERT INTO Members (FirstName, LastName, YearID, Email, Newsletter)
VALUES ('John', 'Moe', 3, 'john.moe@notreal.edu', false);
