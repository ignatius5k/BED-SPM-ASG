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
  Description VARCHAR(500)
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
  IsAvailable BIT DEFAULT 1
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