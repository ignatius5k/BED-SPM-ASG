CREATE TABLE Customer (
    customer_id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100)
);

CREATE TABLE Stall (
    stall_id INT IDENTITY(1,1) PRIMARY KEY,
    stall_name VARCHAR(100),
    cuisine_type VARCHAR(100)
);

CREATE TABLE Feedback (
    feedback_id INT IDENTITY(1,1) PRIMARY KEY,
    customer_id INT NOT NULL,
    stall_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comments VARCHAR(500),
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id),
    FOREIGN KEY (stall_id) REFERENCES Stall(stall_id)
);


// To test

INSERT INTO Customer (name, email) VALUES
('Tan Wei Ming', 'weiming@gmail.com'),
('Nur Aisyah', 'aisyah@gmail.com');

INSERT INTO Stall (stall_name, cuisine_type) VALUES
('Ah Hock Chicken Rice', 'Chinese'),
('Roti Prata Corner', 'Indian');

INSERT INTO Feedback (customer_id, stall_id, rating, comments) VALUES
(1, 1, 5, 'Delicious chicken rice, generous portion!'),
(2, 2, 4, 'Good prata but service was a bit slow.');

SELECT * FROM Feedback;


// Complaint

CREATE TABLE Complaint (
    complaint_id INT IDENTITY(1,1) PRIMARY KEY,
    customer_id INT NOT NULL,
    stall_id INT NOT NULL,
    complaint_type VARCHAR(50) NOT NULL,
    description VARCHAR(500) NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending',
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id),
    FOREIGN KEY (stall_id) REFERENCES Stall(stall_id)
);


INSERT INTO Complaint (customer_id, stall_id, complaint_type, description) VALUES
(1, 1, 'Hygiene', 'Table was not wiped down before I sat, found leftover food scraps.'),
(2, 2, 'Service', 'Waited over 20 minutes despite the stall not being busy.');

//To test
SELECT * FROM Complaint;