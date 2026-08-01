-- Public Order catalogue snapshot captured from Firebase on 2026-08-01.
-- Select the teammate's own hawker database in SSMS before running this file.
-- This script is transactional, idempotent, and never deletes existing records.

SET NOCOUNT ON;
SET XACT_ABORT ON;

IF OBJECT_ID('dbo.Users', 'U') IS NULL
   OR OBJECT_ID('dbo.Stalls', 'U') IS NULL
   OR OBJECT_ID('dbo.MenuItems', 'U') IS NULL
BEGIN
  THROW 50001, 'Create the project database tables before importing the public catalogue.', 1;
END;

IF NOT EXISTS (SELECT 1 FROM Users WHERE id = 'VEND001' AND role = 'vendor')
   OR NOT EXISTS (SELECT 1 FROM Stalls WHERE StallID = 'STALL001' AND OwnerID = 'VEND001')
BEGIN
  THROW 50002, 'The existing Ben vendor and STALL001 records are required.', 1;
END;

BEGIN TRY
  BEGIN TRANSACTION;

  IF OBJECT_ID('dbo.PublicStoreLinks', 'U') IS NULL
  BEGIN
    CREATE TABLE PublicStoreLinks (
      HawkerCentreID VARCHAR(10) NOT NULL,
      CustomerStallID VARCHAR(20) NOT NULL,
      StallID VARCHAR(10) NOT NULL,
      IsActive BIT NOT NULL CONSTRAINT DF_PublicStoreLinks_IsActive DEFAULT 1,
      LastSyncedAt DATETIME2,
      CONSTRAINT PK_PublicStoreLinks
        PRIMARY KEY (HawkerCentreID, CustomerStallID),
      CONSTRAINT UQ_PublicStoreLinks_StallID UNIQUE (StallID),
      CONSTRAINT FK_PublicStoreLinks_Stalls
        FOREIGN KEY (StallID) REFERENCES Stalls(StallID)
    );
  END;

  IF OBJECT_ID('dbo.PublicProductLinks', 'U') IS NULL
  BEGIN
    CREATE TABLE PublicProductLinks (
      HawkerCentreID VARCHAR(10) NOT NULL,
      CustomerStallID VARCHAR(20) NOT NULL,
      FirebaseProductID VARCHAR(100) NOT NULL,
      MenuItemID VARCHAR(10) NOT NULL,
      LastSyncedAt DATETIME2,
      CONSTRAINT PK_PublicProductLinks
        PRIMARY KEY (HawkerCentreID, CustomerStallID, FirebaseProductID),
      CONSTRAINT UQ_PublicProductLinks_MenuItemID UNIQUE (MenuItemID),
      CONSTRAINT FK_PublicProductLinks_Store
        FOREIGN KEY (HawkerCentreID, CustomerStallID)
        REFERENCES PublicStoreLinks(HawkerCentreID, CustomerStallID),
      CONSTRAINT FK_PublicProductLinks_MenuItems
        FOREIGN KEY (MenuItemID) REFERENCES MenuItems(MenuItemID)
    );
  END;

  DECLARE @DisabledPassword VARCHAR(255) =
    '$2b$10$MSVHVeF2Qi/JW1l.CBjSzOwoUBiueBVXHuKRttM/sZYRzqHZnfkhG';
  DECLARE @StoresJson NVARCHAR(MAX) = N'[["050335","01-01","FBS001","FBV001","Shin Okaya","Chinatown Complex Market","Japanese",true],["050335","01-02","FBS002","FBV002","Lian He Ben Ji Claypot","Chinatown Complex Market","Chinese|Singaporean",true],["050335","01-03","FBS003","FBV003","Chang Ji Gourmet","Chinatown Complex Market","Chinese|Singaporean",true],["050335","01-04","FBS004","FBV004","Woo Ji Cooked Food","Chinatown Complex Market","Chinese|Singaporean",true],["069184","01-01","FBS005","FBV005","Maxwell Hainanese Chicken Rice","Maxwell Food Centre","Chinese|Hainanese|Singaporean",true],["069184","01-02","FBS006","FBV006","Taste Fusion Hainanese Chicken Chop","Maxwell Food Centre","Western|Singaporean",true],["069184","01-03","FBS007","FBV007","Maxwell Fuzhou Oyster Cake","Maxwell Food Centre","Chinese|Fujian|Singaporean",true],["069184","01-04","FBS008","FBV008","Zhen Zhen Porridge","Maxwell Food Centre","Chinese|Singaporean",true],["168898","01-01","FBS009","FBV009","Western","Tiong Bahru Market","Western",true],["168898","01-02","FBS010","FBV010","Tiong Bahru Fried Kway Teow","Tiong Bahru Market","Chinese|Singaporean",true],["168898","01-03","FBS011","FBV011","Jian Bo Shui Kueh","Tiong Bahru Market","Chinese|Teochew|Singaporean",true],["168898","01-04","FBS012","FBV012","Lor Mee 178","Tiong Bahru Market","Chinese|Hokkien|Singaporean",true],["390051","01-01","FBS013","FBV013","Super Shiok Nasi Lemak","Old Airport Road Food Centre","Malay|Singaporean",true],["390051","01-02","FBS014","FBV014","Nam Sing Hokkien Mee","Old Airport Road Food Centre","Chinese|Hokkien|Singaporean",true],["390051","01-03","FBS015","FBV015","Xin Mei Xiang Lor Mee","Old Airport Road Food Centre","Chinese|Hokkien|Singaporean",true],["390051","01-04","FBS016","FBV016","Wang Wang Crispy Curry Puff","Old Airport Road Food Centre","Singaporean",true],["069184","01-05","STALL001","VEND001","Ben''s Chicken Rice","Maxwell Food Centre","Chinese|Hainanese|Singaporean",false]]';
  DECLARE @ProductsJson NVARCHAR(MAX) = N'[["050335","01-01","chicken-katsu-curry","FBM0001","Chicken Katsu Curry","Crispy chicken cutlet with rich Japanese curry and rice.",7.5,"Main",1,"Japanese",true],["050335","01-01","chicken-teriyaki-don","FBM0002","Chicken Teriyaki Don","Grilled teriyaki chicken served over fluffy Japanese rice.",6.5,"Main",0,"Japanese",true],["050335","01-01","ebi-tempura-don","FBM0003","Ebi Tempura Don","Golden prawn tempura drizzled with sweet tendon sauce on rice.",7.8,"Main",1,"Japanese",true],["050335","01-01","salmon-mentai-don","FBM0004","Salmon Mentai Don","Seared salmon topped with creamy mentaiko sauce on rice.",7.2,"Main",0,"Japanese",true],["050335","01-02","claypot-chicken-rice","FBM0005","Claypot Chicken Rice","Fragrant rice cooked in claypot with marinated chicken and Chinese sausage.",6.5,"Main",0,"Chinese|Singaporean",true],["050335","01-02","claypot-fish-head","FBM0006","Claypot Fish Head","Savory fish head simmered in rich claypot gravy with vegetables.",9.5,"Main",1,"Chinese|Singaporean",true],["050335","01-02","claypot-pork-rib-rice","FBM0007","Claypot Pork Rib Rice","Tender pork ribs slow-cooked in claypot sauce over steaming rice.",7.5,"Main",1,"Chinese|Singaporean",true],["050335","01-02","claypot-seafood-tofu","FBM0008","Claypot Seafood Tofu","Silky tofu with prawns and squid cooked in bubbling claypot sauce.",8.5,"Main",0,"Chinese|Singaporean",true],["050335","01-03","bee-hoon-only","FBM0009","Bee Hoon Only","Simple plate of fragrant fried bee hoon.",2,"Main",0,"Chinese|Singaporean",true],["050335","01-03","economic-bee-hoon-set-a","FBM0010","Economic Bee Hoon Set A","Fried bee hoon with 2 classic side dishes of your choice.",3.5,"Main",1,"Chinese|Singaporean",true],["050335","01-03","economic-bee-hoon-set-b","FBM0011","Economic Bee Hoon Set B","Fried bee hoon with 3 hearty side dishes for a filling meal.",4.5,"Main",1,"Chinese|Singaporean",true],["050335","01-03","economic-bee-hoon-set-c","FBM0012","Economic Bee Hoon Set C","Bee hoon with 4 side dishes, perfect for big appetite.",5.5,"Main",0,"Chinese|Singaporean",true],["050335","01-04","classic-chicken-laksa","FBM0013","Classic Chicken Laksa","Rich coconut curry broth with noodles, chicken slices, and tau pok.",4.5,"Main",0,"Chinese|Singaporean",true],["050335","01-04","mini-laksa","FBM0014","Mini Laksa","Smaller bowl of classic laksa, perfect for light eaters.",3.5,"Main",0,"Chinese|Singaporean",true],["050335","01-04","prawn-laksa","FBM0015","Prawn Laksa","Fragrant laksa soup topped with fresh prawns and fish cake.",5.5,"Main",1,"Chinese|Singaporean",true],["050335","01-04","seafood-laksa","FBM0016","Seafood Laksa","Creamy laksa loaded with prawns, squid, and fish cake slices.",6.5,"Main",0,"Chinese|Singaporean",true],["069184","01-01","lemon-cutlet-rice","FBM0017","Lemon Cutlet Rice","",5,"Main",0,"Chinese|Hainanese|Singaporean",true],["069184","01-01","roast-chicken-rice","FBM0018","Roast Chicken Rice","",5,"Main",0,"Chinese|Hainanese|Singaporean",true],["069184","01-01","roast-pork-rice","FBM0019","Roast Pork Rice","",5,"Main",0,"Chinese|Hainanese|Singaporean",true],["069184","01-01","steam-chicken-rice","FBM0020","Steam Chicken Rice","Steam chicken rice is a classic dish featuring tender, gently steamed chicken served with fragrant rice cooked in chicken broth.",5,"Main",0,"Chinese|Hainanese|Singaporean",true],["069184","01-02","black-pepper-chicken-chop","FBM0021","Black Pepper Chicken Chop","Tender chicken chop topped with rich black pepper sauce and sides.",6.8,"Main",1,"Western|Singaporean",true],["069184","01-02","chicken-chop-combo-set","FBM0022","Chicken Chop Combo Set","Chicken chop served with extra fries, coleslaw, and sunny side egg.",14,"Main",1,"Western|Singaporean",true],["069184","01-02","grilled-chicken-chop","FBM0023","Grilled Chicken Chop","Juicy grilled chicken chop served with fries, coleslaw, and brown sauce.",6.5,"Main",0,"Western|Singaporean",true],["069184","01-02","mushroom-chicken-chop","FBM0024","Mushroom Chicken Chop","Chicken chop smothered in creamy mushroom sauce with fries and salad.",6.8,"Main",1,"Western|Singaporean",true],["069184","01-03","classic-oyster-cake","FBM0025","Classic Oyster Cake","Crispy deep-fried oyster cake filled with fresh oysters and fragrant batter.",4.5,"Snack",1,"Chinese|Fujian|Singaporean",true],["069184","01-03","oyster-cake-set","FBM0026","Oyster Cake Set","Oyster cake served with vegetables, chilli sauce, and side soup.",7.5,"Snack",2,"Chinese|Fujian|Singaporean",true],["069184","01-03","oyster-cake-with-egg","FBM0027","Oyster Cake with Egg","Golden oyster cake topped with a soft egg layer for extra richness.",5.5,"Snack",2,"Chinese|Fujian|Singaporean",true],["069184","01-03","seafood-oyster-cake","FBM0028","Seafood Oyster Cake","Loaded oyster cake with prawns and squid for a full seafood experience.",8,"Snack",2,"Chinese|Fujian|Singaporean",true],["069184","01-04","century-egg-pork-porridge","FBM0029","Century Egg Pork Porridge","Smooth rice porridge with tender pork slices and century egg.",4.5,"Main",0,"Chinese|Singaporean",true],["069184","01-04","chicken-porridge","FBM0030","Chicken Porridge","Comforting porridge with shredded chicken and spring onions.",4,"Main",0,"Chinese|Singaporean",true],["069184","01-04","fish-slice-porridge","FBM0031","Fish Slice Porridge","Light porridge topped with fresh fish slices and ginger.",5,"Main",0,"Chinese|Singaporean",true],["069184","01-04","mixed-porridge-deluxe","FBM0032","Mixed Porridge Deluxe","Hearty porridge with pork, chicken, fish, and century egg.",6.5,"Main",0,"Chinese|Singaporean",true],["168898","01-01","beef-burger-set","FBM0033","Beef Burger Set","Juicy beef burger served with fries and salad.",7.5,"Main",0,"Western",true],["168898","01-01","chicken-chop-with-fries","FBM0034","Chicken Chop with Fries","Grilled chicken chop served with crispy fries, coleslaw, and brown sauce.",6.5,"Main",2,"Western",true],["168898","01-01","fish-and-chips","FBM0035","Fish and Chips","Golden battered fish fillet with fries and tartar sauce.",7,"Main",2,"Western",true],["168898","01-01","grilled-chicken-pasta","FBM0036","Grilled Chicken Pasta","Pasta tossed in creamy sauce topped with grilled chicken slices.",6.8,"Main",1,"Western",true],["168898","01-02","classic-fried-kway-teow","FBM0037","Classic Fried Kway Teow","Wok-fried flat rice noodles with egg, bean sprouts, and savory soy sauce.",4.5,"Main",0,"Chinese|Singaporean",true],["168898","01-02","cockles-fried-kway-teow","FBM0038","Cockles Fried Kway Teow","Traditional style with juicy cockles, egg, and smoky wok hei flavor.",5,"Main",0,"Chinese|Singaporean",true],["168898","01-02","prawn-fried-kway-teow","FBM0039","Prawn Fried Kway Teow","Fragrant fried kway teow topped with fresh prawns and Chinese sausage.",5.5,"Main",0,"Chinese|Singaporean",true],["168898","01-02","seafood-fried-kway-teow","FBM0040","Seafood Fried Kway Teow","Loaded with prawns, squid, and fish cake in rich dark sauce.",6.5,"Main",0,"Chinese|Singaporean",true],["168898","01-03","shui-kueh-family-set-10-pcs","FBM0041","Chee Cheong Fun","A plate of Chee Cheong Fun topped with savory chai poh and chili sauce, perfect for sharing.",6.5,"Snack",0,"Chinese|Teochew|Singaporean",true],["168898","01-03","traditional-shui-kueh-3-pcs","FBM0042","Traditional Shui Kueh (3 pcs)","Steamed rice cakes topped with preserved radish and savory seasoning.",2.5,"Snack",1,"Chinese|Teochew|Singaporean",true],["168898","01-03","traditional-shui-kueh-5-pcs","FBM0043","Traditional Shui Kueh (5 pcs)","Soft steamed rice cakes with fragrant chai poh topping.",3.5,"Snack",0,"Chinese|Teochew|Singaporean",true],["168898","01-03","traditional-shui-kueh-8-pcs","FBM0044","Shui Kueh & Chee Cheong Fun","Large portion of classic shui kueh and chee Cheong fun\n perfect for sharing.",8,"Snack",0,"Chinese|Teochew|Singaporean",true],["168898","01-04","chicken-cutlet-lor-mee","FBM0045","Chicken Cutlet Lor Mee","Hearty lor mee topped with crispy chicken cutlet and braised gravy.",5.5,"Main",0,"Chinese|Hokkien|Singaporean",true],["168898","01-04","classic-lor-mee","FBM0046","Classic Lor Mee","Yellow noodles in rich braised gravy with egg, fish cake, and crispy fritters.",4.5,"Main",0,"Chinese|Hokkien|Singaporean",true],["168898","01-04","mini-lor-mee","FBM0047","Mini Lor Mee","Smaller bowl of classic lor mee, perfect for light eaters.",3.5,"Main",0,"Chinese|Hokkien|Singaporean",true],["168898","01-04","prawn-lor-mee","FBM0048","Prawn Lor Mee","Flavorful lor mee served with fresh prawns, egg, and fried fritters.",6,"Main",0,"Chinese|Hokkien|Singaporean",true],["390051","01-01","chicken-cutlet-nasi-lemak","FBM0049","Chicken Cutlet Nasi Lemak","Coconut rice topped with crispy chicken cutlet, sambal, and condiments.",5.5,"Main",0,"Malay|Singaporean",true],["390051","01-01","chicken-wing-nasi-lemak","FBM0050","Chicken Wing Nasi Lemak","Fragrant nasi lemak served with crispy fried chicken wing and classic sides.",4.8,"Main",2,"Malay|Singaporean",true],["390051","01-01","classic-nasi-lemak-set","FBM0051","Classic Nasi Lemak Set","Coconut rice with sambal chili, ikan bilis, peanuts, cucumber, and fried egg.",3.5,"Main",0,"Malay|Singaporean",true],["390051","01-01","fish-fillet-nasi-lemak","FBM0052","Fish Fillet Nasi Lemak","Nasi lemak served with golden fried fish fillet and traditional sides.",5.2,"Main",1,"Malay|Singaporean",true],["390051","01-02","classic-hokkien-mee","FBM0053","Classic Hokkien Mee","Stir-fried yellow noodles and bee hoon with prawns, egg, and savory seafood broth.",4.5,"Main",0,"Chinese|Hokkien|Singaporean",true],["390051","01-02","mini-hokkien-mee","FBM0054","Mini Hokkien Mee","Smaller portion of classic hokkien mee, perfect for light eaters.",3.5,"Main",0,"Chinese|Hokkien|Singaporean",true],["390051","01-02","prawn-hokkien-mee","FBM0055","Prawn Hokkien Mee","Flavorful wok-fried noodles topped with extra fresh prawns and sambal chili.",5.5,"Main",0,"Chinese|Hokkien|Singaporean",true],["390051","01-02","seafood-hokkien-mee","FBM0056","Seafood Hokkien Mee","Loaded with prawns, squid, and fish cake in rich seafood gravy.",6.5,"Main",0,"Chinese|Hokkien|Singaporean",true],["390051","01-03","braised-pork-lor-mee","FBM0057","Braised Pork Lor Mee","Thick yellow noodles in rich lor gravy topped with tender braised pork slices.",5,"Main",0,"Chinese|Hokkien|Singaporean",true],["390051","01-03","ngoh-hiang-lor-mee","FBM0058","Ngoh Hiang Lor Mee","Classic lor mee served with crispy ngoh hiang fritters and braised egg.",5.5,"Main",1,"Chinese|Hokkien|Singaporean",true],["390051","01-03","seafood-lor-mee","FBM0059","Seafood Lor Mee","Savory lor mee with prawns, fish cake, and fried fritters in thick gravy.",6.2,"Main",1,"Chinese|Hokkien|Singaporean",true],["390051","01-03","small-lor-mee","FBM0060","Small Lor Mee","Light portion of traditional lor mee with egg and fish cake.",3.8,"Main",0,"Chinese|Hokkien|Singaporean",true],["390051","01-04","classic-chicken-curry-puff","FBM0061","Classic Chicken Curry Puff","Flaky pastry filled with curried chicken, potato, and spices.",1.8,"Snack",1,"Singaporean",true],["390051","01-04","mini-curry-puff-set-5-pcs","FBM0062","Mini Curry Puff Set (5 pcs)","Five bite-sized curry puffs perfect for sharing or snacks.",4.5,"Snack",1,"Singaporean",true],["390051","01-04","otah-curry-puff","FBM0063","Otah Curry Puff","Savory curry puff filled with fragrant otah and spices.",2.2,"Snack",0,"Singaporean",true],["390051","01-04","sardine-curry-puff","FBM0064","Sardine Curry Puff","Crispy puff stuffed with spicy sardine filling and onions.",2,"Snack",0,"Singaporean",true],["069184","01-05","MENU001","MENU001","Steamed Chicken Rice","Classic steamed chicken with fragrant rice",5.5,"Main",0,"Chinese|Hainanese|Singaporean",false],["069184","01-05","MENU002","MENU002","Roasted Chicken Rice","Roasted chicken with fragrant rice",6,"Main",0,"Chinese|Hainanese|Singaporean",false],["069184","01-05","MENU003","MENU003","Chicken Soup","Clear chicken soup",3,"Side",0,"Chinese|Hainanese|Singaporean",false],["069184","01-05","MENU004","MENU004","Fried Rice","Wok-fried rice with egg",5,"Main",0,"Chinese|Hainanese|Singaporean",false],["069184","01-05","MENU005","MENU005","Lime Juice","Fresh lime drink",2,"Drink",0,"Chinese|Hainanese|Singaporean",false]]';

  DECLARE @Stores TABLE (
    HawkerCentreID VARCHAR(10) NOT NULL,
    CustomerStallID VARCHAR(20) NOT NULL,
    StallID VARCHAR(10) NOT NULL,
    OwnerID VARCHAR(10) NOT NULL,
    StallName VARCHAR(100) NOT NULL,
    CentreName VARCHAR(100) NOT NULL,
    Cuisines VARCHAR(250) NOT NULL,
    IsGenerated BIT NOT NULL
  );

  INSERT INTO @Stores
    (HawkerCentreID, CustomerStallID, StallID, OwnerID, StallName,
     CentreName, Cuisines, IsGenerated)
  SELECT
    JSON_VALUE(value, '$[0]'),
    JSON_VALUE(value, '$[1]'),
    JSON_VALUE(value, '$[2]'),
    JSON_VALUE(value, '$[3]'),
    JSON_VALUE(value, '$[4]'),
    JSON_VALUE(value, '$[5]'),
    JSON_VALUE(value, '$[6]'),
    CASE JSON_VALUE(value, '$[7]') WHEN 'true' THEN 1 ELSE 0 END
  FROM OPENJSON(@StoresJson);

  MERGE Users WITH (HOLDLOCK) AS target
  USING (
    SELECT
      OwnerID AS id,
      CONCAT(
        'firebase_vendor_',
        HawkerCentreID,
        '_',
        REPLACE(CustomerStallID, '-', '_')
      ) AS username,
      CONCAT(
        'firebase.',
        HawkerCentreID,
        '.',
        REPLACE(CustomerStallID, '-', ''),
        '@example.test'
      ) AS email,
      'vendor' AS role
    FROM @Stores
    WHERE IsGenerated = 1
    UNION ALL
    SELECT
      'FBC001',
      'firebase_catalog_customer',
      'firebase.catalog.customer@example.test',
      'customer'
  ) AS source
    ON target.id = source.id
  WHEN MATCHED THEN
    UPDATE SET
      username = source.username,
      email = source.email,
      role = source.role
  WHEN NOT MATCHED THEN
    INSERT (id, username, email, password, role)
    VALUES (source.id, source.username, source.email, @DisabledPassword, source.role);

  MERGE Stalls WITH (HOLDLOCK) AS target
  USING (
    SELECT *
    FROM @Stores
    WHERE IsGenerated = 1
  ) AS source
    ON target.StallID = source.StallID
  WHEN MATCHED THEN
    UPDATE SET
      StallName = source.StallName,
      Cuisine = LEFT(
        source.Cuisines,
        CHARINDEX('|', source.Cuisines + '|') - 1
      ),
      Description = CONCAT(
        source.StallName,
        ' at ',
        source.CentreName,
        ', customer stall #',
        source.CustomerStallID,
        '.'
      ),
      HawkerCentreID = source.HawkerCentreID,
      CustomerStallID = source.CustomerStallID
  WHEN NOT MATCHED THEN
    INSERT
      (StallID, OwnerID, StallName, Cuisine, Description,
       HawkerCentreID, CustomerStallID)
    VALUES
      (source.StallID, source.OwnerID, source.StallName,
       LEFT(source.Cuisines, CHARINDEX('|', source.Cuisines + '|') - 1),
       CONCAT(
         source.StallName,
         ' at ',
         source.CentreName,
         ', customer stall #',
         source.CustomerStallID,
         '.'
       ),
       source.HawkerCentreID, source.CustomerStallID);

  IF EXISTS (
    SELECT 1
    FROM @Stores source
    INNER JOIN PublicStoreLinks target
      ON target.HawkerCentreID = source.HawkerCentreID
      AND target.CustomerStallID = source.CustomerStallID
    WHERE target.StallID <> source.StallID
  )
  BEGIN
    THROW 50003, 'A public stall location is already linked to another SQL stall.', 1;
  END;

  IF EXISTS (
    SELECT 1
    FROM @Stores source
    INNER JOIN PublicStoreLinks target
      ON target.StallID = source.StallID
    WHERE target.HawkerCentreID <> source.HawkerCentreID
       OR target.CustomerStallID <> source.CustomerStallID
  )
  BEGIN
    THROW 50004, 'A SQL stall is already linked to another Firebase location.', 1;
  END;

  MERGE PublicStoreLinks WITH (HOLDLOCK) AS target
  USING @Stores AS source
    ON target.HawkerCentreID = source.HawkerCentreID
    AND target.CustomerStallID = source.CustomerStallID
  WHEN MATCHED THEN
    UPDATE SET
      StallID = source.StallID,
      IsActive = 1,
      LastSyncedAt = GETDATE()
  WHEN NOT MATCHED THEN
    INSERT
      (HawkerCentreID, CustomerStallID, StallID, IsActive, LastSyncedAt)
    VALUES
      (source.HawkerCentreID, source.CustomerStallID,
       source.StallID, 1, GETDATE());

  DECLARE @Products TABLE (
    HawkerCentreID VARCHAR(10) NOT NULL,
    CustomerStallID VARCHAR(20) NOT NULL,
    FirebaseProductID VARCHAR(100) NOT NULL,
    MenuItemID VARCHAR(10) NOT NULL,
    ItemName VARCHAR(100) NOT NULL,
    Description VARCHAR(500) NOT NULL,
    Price DECIMAL(6, 2) NOT NULL,
    Category VARCHAR(50) NOT NULL,
    Likes INT NOT NULL,
    Cuisines VARCHAR(250) NOT NULL,
    IsGenerated BIT NOT NULL
  );

  INSERT INTO @Products
    (HawkerCentreID, CustomerStallID, FirebaseProductID, MenuItemID,
     ItemName, Description, Price, Category, Likes, Cuisines, IsGenerated)
  SELECT
    JSON_VALUE(value, '$[0]'),
    JSON_VALUE(value, '$[1]'),
    JSON_VALUE(value, '$[2]'),
    JSON_VALUE(value, '$[3]'),
    JSON_VALUE(value, '$[4]'),
    JSON_VALUE(value, '$[5]'),
    TRY_CONVERT(DECIMAL(6, 2), JSON_VALUE(value, '$[6]')),
    JSON_VALUE(value, '$[7]'),
    TRY_CONVERT(INT, JSON_VALUE(value, '$[8]')),
    JSON_VALUE(value, '$[9]'),
    CASE JSON_VALUE(value, '$[10]') WHEN 'true' THEN 1 ELSE 0 END
  FROM OPENJSON(@ProductsJson);

  MERGE MenuItems WITH (HOLDLOCK) AS target
  USING (
    SELECT
      product.*,
      store.StallID
    FROM @Products product
    INNER JOIN @Stores store
      ON store.HawkerCentreID = product.HawkerCentreID
      AND store.CustomerStallID = product.CustomerStallID
  ) AS source
    ON target.MenuItemID = source.MenuItemID
  WHEN MATCHED AND source.IsGenerated = 1 THEN
    UPDATE SET
      StallID = source.StallID,
      ItemName = source.ItemName,
      Description = source.Description,
      Price = source.Price,
      Category = source.Category,
      IsAvailable = 1,
      IsDeleted = 0
  WHEN NOT MATCHED THEN
    INSERT
      (MenuItemID, StallID, ItemName, Description, Price,
       Category, IsAvailable, IsDeleted)
    VALUES
      (source.MenuItemID, source.StallID, source.ItemName,
       source.Description, source.Price, source.Category, 1, 0);

  IF EXISTS (
    SELECT 1
    FROM @Products source
    INNER JOIN PublicProductLinks target
      ON target.HawkerCentreID = source.HawkerCentreID
      AND target.CustomerStallID = source.CustomerStallID
      AND target.FirebaseProductID = source.FirebaseProductID
    WHERE target.MenuItemID <> source.MenuItemID
  )
  BEGIN
    THROW 50005, 'A Firebase product is already linked to another SQL menu item.', 1;
  END;

  IF EXISTS (
    SELECT 1
    FROM @Products source
    INNER JOIN PublicProductLinks target
      ON target.MenuItemID = source.MenuItemID
    WHERE target.HawkerCentreID <> source.HawkerCentreID
       OR target.CustomerStallID <> source.CustomerStallID
       OR target.FirebaseProductID <> source.FirebaseProductID
  )
  BEGIN
    THROW 50006, 'A SQL menu item is already linked to another Firebase product.', 1;
  END;

  MERGE PublicProductLinks WITH (HOLDLOCK) AS target
  USING @Products AS source
    ON target.HawkerCentreID = source.HawkerCentreID
    AND target.CustomerStallID = source.CustomerStallID
    AND target.FirebaseProductID = source.FirebaseProductID
  WHEN MATCHED THEN
    UPDATE SET
      MenuItemID = source.MenuItemID,
      LastSyncedAt = GETDATE()
  WHEN NOT MATCHED THEN
    INSERT
      (HawkerCentreID, CustomerStallID, FirebaseProductID,
       MenuItemID, LastSyncedAt)
    VALUES
      (source.HawkerCentreID, source.CustomerStallID,
       source.FirebaseProductID, source.MenuItemID, GETDATE());

  INSERT INTO Cuisines (CuisineName)
  SELECT DISTINCT LTRIM(RTRIM(splitCuisine.value))
  FROM @Products product
  CROSS APPLY STRING_SPLIT(product.Cuisines, '|') splitCuisine
  WHERE NOT EXISTS (
    SELECT 1
    FROM Cuisines existing
    WHERE existing.CuisineName = LTRIM(RTRIM(splitCuisine.value))
  );

  INSERT INTO MenuItemCuisines (MenuItemID, CuisineID)
  SELECT DISTINCT
    product.MenuItemID,
    cuisine.CuisineID
  FROM @Products product
  CROSS APPLY STRING_SPLIT(product.Cuisines, '|') splitCuisine
  INNER JOIN Cuisines cuisine
    ON cuisine.CuisineName = LTRIM(RTRIM(splitCuisine.value))
  WHERE NOT EXISTS (
    SELECT 1
    FROM MenuItemCuisines existing
    WHERE existing.MenuItemID = product.MenuItemID
      AND existing.CuisineID = cuisine.CuisineID
  );

  ;WITH RankedProducts AS (
    SELECT
      product.*,
      store.StallID,
      ROW_NUMBER() OVER (
        PARTITION BY product.HawkerCentreID, product.CustomerStallID
        ORDER BY product.Likes DESC, product.ItemName
      ) AS RankNumber
    FROM @Products product
    INNER JOIN @Stores store
      ON store.HawkerCentreID = product.HawkerCentreID
      AND store.CustomerStallID = product.CustomerStallID
    WHERE product.IsGenerated = 1
  ),
  StoreTotals AS (
    SELECT
      StallID,
      CONCAT('FBO', RIGHT('0000' + SUBSTRING(StallID, 4, 7), 4)) AS OrderID,
      SUM(
        Price *
        CASE
          WHEN Likes + 5 - RankNumber < 1 THEN 1
          ELSE Likes + 5 - RankNumber
        END
      ) AS TotalAmount
    FROM RankedProducts
    GROUP BY StallID
  )
  INSERT INTO Orders
    (OrderID, CustomerID, StallID, OrderDate, Status, TotalAmount)
  SELECT
    totals.OrderID,
    'FBC001',
    totals.StallID,
    DATEADD(
      DAY,
      -((TRY_CONVERT(INT, SUBSTRING(totals.StallID, 4, 7)) - 1) % 14),
      GETDATE()
    ),
    'completed',
    totals.TotalAmount
  FROM StoreTotals totals
  WHERE NOT EXISTS (
    SELECT 1
    FROM Orders existing
    WHERE existing.OrderID = totals.OrderID
  );

  ;WITH RankedProducts AS (
    SELECT
      product.*,
      store.StallID,
      ROW_NUMBER() OVER (
        PARTITION BY product.HawkerCentreID, product.CustomerStallID
        ORDER BY product.Likes DESC, product.ItemName
      ) AS RankNumber
    FROM @Products product
    INNER JOIN @Stores store
      ON store.HawkerCentreID = product.HawkerCentreID
      AND store.CustomerStallID = product.CustomerStallID
    WHERE product.IsGenerated = 1
  )
  INSERT INTO OrderItems (OrderID, MenuItemID, Quantity, UnitPrice)
  SELECT
    CONCAT('FBO', RIGHT('0000' + SUBSTRING(product.StallID, 4, 7), 4)),
    product.MenuItemID,
    CASE
      WHEN product.Likes + 5 - product.RankNumber < 1 THEN 1
      ELSE product.Likes + 5 - product.RankNumber
    END,
    product.Price
  FROM RankedProducts product
  WHERE NOT EXISTS (
    SELECT 1
    FROM OrderItems existingItem
    INNER JOIN Orders existingOrder
      ON existingItem.OrderID = existingOrder.OrderID
    WHERE existingItem.MenuItemID = product.MenuItemID
      AND existingOrder.OrderID =
        CONCAT('FBO', RIGHT('0000' + SUBSTRING(product.StallID, 4, 7), 4))
  );

  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0
    ROLLBACK TRANSACTION;
  THROW;
END CATCH;

SELECT
  (SELECT COUNT(*) FROM PublicStoreLinks WHERE IsActive = 1)
    AS PublicStoreCount,
  (SELECT COUNT(*) FROM PublicProductLinks)
    AS PublicProductCount,
  (SELECT COUNT(*) FROM Stalls WHERE StallID LIKE 'FBS%')
    AS MirroredStoreCount,
  (SELECT COUNT(*) FROM MenuItems WHERE MenuItemID LIKE 'FBM%')
    AS MirroredProductCount;
