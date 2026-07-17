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
