CREATE TABLE Users (
  id VARCHAR(10) PRIMARY KEY,    
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'customer'
    CHECK (role IN ('customer', 'vendor', 'inspector'))
);

CREATE TABLE Stalls (
  StallID VARCHAR(10) PRIMARY KEY,  
  OwnerID VARCHAR(10) NOT NULL FOREIGN KEY REFERENCES Users(id),
  StallName VARCHAR(100) NOT NULL,
  Cuisine VARCHAR(50),
  Description VARCHAR(500),
  HawkerCentreID VARCHAR(10),
  CustomerStallID VARCHAR(20)
);

CREATE TABLE InspectorProfiles (
  UserID VARCHAR(10) PRIMARY KEY FOREIGN KEY REFERENCES Users(id), 
  BadgeNumber VARCHAR(20) NOT NULL UNIQUE,
  Department VARCHAR(100) NOT NULL DEFAULT 'NEA Food Safety Division'
);

CREATE TABLE MenuItems (
  MenuItemID VARCHAR(10) PRIMARY KEY, 
  StallID VARCHAR(10) NOT NULL FOREIGN KEY REFERENCES Stalls(StallID),
  ItemName VARCHAR(100) NOT NULL,
  Description VARCHAR(500),
  Price DECIMAL(6,2) NOT NULL,
  Category VARCHAR(50),
  IsAvailable BIT NOT NULL DEFAULT 1,
  IsDeleted BIT NOT NULL DEFAULT 0
);

-- Cuisine creation - A menu item can belong to more than one cuisine.
CREATE TABLE Cuisines (
  CuisineID INT IDENTITY(1,1) PRIMARY KEY,
  CuisineName VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE MenuItemCuisines (
  MenuItemID VARCHAR(10) NOT NULL FOREIGN KEY REFERENCES MenuItems(MenuItemID),
  CuisineID INT NOT NULL FOREIGN KEY REFERENCES Cuisines(CuisineID),
  PRIMARY KEY (MenuItemID, CuisineID)
);

-- Sales tables creation - used by vendor performance and sales analytics pages.
CREATE TABLE Orders (
  OrderID VARCHAR(10) PRIMARY KEY,
  CustomerID VARCHAR(10) NOT NULL FOREIGN KEY REFERENCES Users(id),
  StallID VARCHAR(10) NOT NULL FOREIGN KEY REFERENCES Stalls(StallID),
  OrderDate DATETIME2 NOT NULL DEFAULT GETDATE(),
  Status VARCHAR(20) NOT NULL DEFAULT 'paid'
    CHECK (Status IN ('paid', 'completed', 'cancelled')),
  TotalAmount DECIMAL(10,2) NOT NULL
    CHECK (TotalAmount >= 0)
);

CREATE TABLE OrderItems (
  OrderItemID INT IDENTITY(1,1) PRIMARY KEY,
  OrderID VARCHAR(10) NOT NULL FOREIGN KEY REFERENCES Orders(OrderID),
  MenuItemID VARCHAR(10) NOT NULL FOREIGN KEY REFERENCES MenuItems(MenuItemID),
  Quantity INT NOT NULL CHECK (Quantity > 0),
  UnitPrice DECIMAL(6,2) NOT NULL CHECK (UnitPrice >= 0)
);

-- Customer satisfaction tables - used by the vendor feedback and complaints dashboard.
-- The Feedback column names match the existing Feedback CRUD feature.
CREATE TABLE Feedback (
  feedback_id INT IDENTITY(1,1) PRIMARY KEY,
  customer_id VARCHAR(10) NOT NULL FOREIGN KEY REFERENCES Users(id),
  stall_id VARCHAR(10) NOT NULL FOREIGN KEY REFERENCES Stalls(StallID),
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comments VARCHAR(500),
  created_at DATETIME2 NOT NULL DEFAULT GETDATE()
);

CREATE TABLE Complaints (
  complaint_id INT IDENTITY(1,1) PRIMARY KEY,
  customer_id VARCHAR(10) NOT NULL FOREIGN KEY REFERENCES Users(id),
  stall_id VARCHAR(10) NOT NULL FOREIGN KEY REFERENCES Stalls(StallID),
  category VARCHAR(50) NOT NULL
    CHECK (category IN ('Cleanliness', 'Food Quality', 'Service Quality', 'Waiting Time', 'Others')),
  description VARCHAR(500) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in progress', 'resolved')),
  complaint_date DATETIME2 NOT NULL DEFAULT GETDATE()
);

-- Rental agreement tables - used by the vendor renewal and change tracker.
CREATE TABLE RentalAgreements (
  AgreementID VARCHAR(10) PRIMARY KEY,
  StallID VARCHAR(10) NOT NULL FOREIGN KEY REFERENCES Stalls(StallID),
  AgreementReference VARCHAR(40) NOT NULL UNIQUE,
  StartDate DATE NOT NULL,
  EndDate DATE NOT NULL,
  MonthlyRent DECIMAL(10,2) NOT NULL CHECK (MonthlyRent >= 0),
  RenewalDate DATE NOT NULL,
  Status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (Status IN ('active', 'renewal due', 'renewed', 'expired')),
  TermsSummary VARCHAR(500),
  UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
  CHECK (EndDate >= StartDate),
  CHECK (RenewalDate >= StartDate AND RenewalDate <= EndDate)
);

CREATE TABLE RentalAgreementChanges (
  ChangeID INT IDENTITY(1,1) PRIMARY KEY,
  AgreementID VARCHAR(10) NOT NULL FOREIGN KEY REFERENCES RentalAgreements(AgreementID),
  ChangedBy VARCHAR(10) NOT NULL FOREIGN KEY REFERENCES Users(id),
  FieldChanged VARCHAR(50) NOT NULL,
  PreviousValue VARCHAR(500),
  NewValue VARCHAR(500),
  ChangeReason VARCHAR(250) NOT NULL,
  ChangedAt DATETIME2 NOT NULL DEFAULT GETDATE()
);

CREATE TABLE Inspections (
  InspectionID INT IDENTITY(1,1) PRIMARY KEY,
  StallID VARCHAR(10) NOT NULL,
  InspectorID VARCHAR(10) NOT NULL,
  InspectionDate DATE NOT NULL,
  CleanlinessScore INT NOT NULL
      CHECK (CleanlinessScore BETWEEN 0 AND 100),
  FoodHandlingScore INT NOT NULL
      CHECK (FoodHandlingScore BETWEEN 0 AND 100),
  Remarks VARCHAR(500),
  Grade CHAR(1) NOT NULL
      CHECK (Grade IN ('A','B','C','D')),
  FOREIGN KEY (StallID)
      REFERENCES Stalls(StallID),
  FOREIGN KEY (InspectorID)
      REFERENCES Users(id)
);

CREATE TABLE InspectionSchedule (
    ScheduleID INT IDENTITY(1,1) PRIMARY KEY,
    StallID VARCHAR(10) NOT NULL,
    InspectorID VARCHAR(10) NOT NULL,
    ScheduledDate DATE NOT NULL,
    ScheduledTime TIME NOT NULL,
    Status VARCHAR(20) DEFAULT 'Pending',
    FOREIGN KEY (StallID)
        REFERENCES Stalls(StallID),
    FOREIGN KEY (InspectorID)
        REFERENCES Users(id)
);
