-- =========================================================
-- TEMPORARY RENTAL AGREEMENT DEMO DATA
-- =========================================================
-- Purpose:
--   Create three isolated vendor accounts for demonstrating:
--   1. An agreement that is due for renewal.
--   2. An active agreement with no urgent renewal alert.
--   3. A vendor with no agreement records.
--
-- Safety:
--   - This file does not change create_tables.sql or sample_data.sql.
--   - Every temporary ID starts with TMP.
--   - Running LOAD again resets only these temporary records.
--   - Change @Mode to CLEANUP to remove the temporary records.
--   - Use this for local demonstration only, not production.
--
-- Temporary login details after LOAD:
--   demo_renewal_vendor / Demo123!
--   demo_active_vendor  / Demo123!
--   demo_empty_vendor   / Demo123!
-- =========================================================

SET NOCOUNT ON;
SET XACT_ABORT ON;

-- Change LOAD to CLEANUP when the demonstration is finished.
DECLARE @Mode VARCHAR(10) = 'LOAD';

-- bcrypt hash for the temporary password: Demo123!
DECLARE @DemoPasswordHash VARCHAR(255) =
  '$2b$10$eyU1NH1oTNP8NYWeNXMURuKSGd21x6IWXjvqFEXcL5RUVx5dT.Mz.';

IF @Mode NOT IN ('LOAD', 'CLEANUP')
BEGIN
  THROW 50001, '@Mode must be LOAD or CLEANUP.', 1;
END;

IF OBJECT_ID('Users', 'U') IS NULL
  OR OBJECT_ID('Stalls', 'U') IS NULL
  OR OBJECT_ID('RentalAgreements', 'U') IS NULL
  OR OBJECT_ID('RentalAgreementChanges', 'U') IS NULL
BEGIN
  THROW 50002, 'Run database/create_tables.sql before this temporary data file.', 1;
END;

BEGIN TRY
  BEGIN TRANSACTION;

  -- Always clear the previous temporary run first.
  -- Change-history rows must be removed before their agreements.
  DELETE FROM RentalAgreementChanges
  WHERE AgreementID IN ('TMPRA001', 'TMPRA002', 'TMPRA003')
     OR ChangedBy IN ('TMPV001', 'TMPV002', 'TMPV003');

  DELETE FROM RentalAgreements
  WHERE AgreementID IN ('TMPRA001', 'TMPRA002', 'TMPRA003')
     OR StallID IN ('TMPS001', 'TMPS002', 'TMPS003');

  DELETE FROM Stalls
  WHERE StallID IN ('TMPS001', 'TMPS002', 'TMPS003')
     OR OwnerID IN ('TMPV001', 'TMPV002', 'TMPV003');

  DELETE FROM Users
  WHERE id IN ('TMPV001', 'TMPV002', 'TMPV003');

  IF @Mode = 'LOAD'
  BEGIN
    -- -------------------------------------------------------
    -- Temporary vendor accounts
    -- -------------------------------------------------------
    INSERT INTO Users (id, username, email, password, role)
    VALUES
      ('TMPV001', 'demo_renewal_vendor', 'demo.renewal@example.test', @DemoPasswordHash, 'vendor'),
      ('TMPV002', 'demo_active_vendor',  'demo.active@example.test',  @DemoPasswordHash, 'vendor'),
      ('TMPV003', 'demo_empty_vendor',   'demo.empty@example.test',   @DemoPasswordHash, 'vendor');

    -- -------------------------------------------------------
    -- One stall per temporary vendor
    -- -------------------------------------------------------
    INSERT INTO Stalls (StallID, OwnerID, StallName, Cuisine, Description)
    VALUES
      ('TMPS001', 'TMPV001', 'Ben''s Chicken Rice (Demo)',  'Chinese', 'Temporary renewal-due rental demonstration'),
      ('TMPS002', 'TMPV002', 'Lim Ah Cheng Stall (Demo)',   'Chinese', 'Temporary active rental demonstration'),
      ('TMPS003', 'TMPV003', 'Teoh Brothers Noodle (Demo)', 'Chinese', 'Temporary empty-state rental demonstration');

    -- -------------------------------------------------------
    -- Rental agreements
    -- TMPS003 intentionally receives no agreement.
    -- -------------------------------------------------------
    INSERT INTO RentalAgreements
      (AgreementID, StallID, AgreementReference, StartDate, EndDate,
       MonthlyRent, RenewalDate, Status, TermsSummary, UpdatedAt)
    VALUES
      ('TMPRA001', 'TMPS001', 'TEMP-HCR-TMPS001-CURRENT',
       CAST(DATEADD(MONTH, -10, GETDATE()) AS DATE),
       CAST(DATEADD(MONTH, 2, GETDATE()) AS DATE),
       1850.00,
       CAST(DATEADD(DAY, 21, GETDATE()) AS DATE),
       'renewal due',
       'Monthly rent includes common-area cleaning and waste collection. Utilities are billed separately.',
       DATEADD(DAY, -12, GETDATE())),

      ('TMPRA002', 'TMPS001', 'TEMP-HCR-TMPS001-PREVIOUS',
       CAST(DATEADD(MONTH, -22, GETDATE()) AS DATE),
       CAST(DATEADD(MONTH, -10, GETDATE()) AS DATE),
       1720.00,
       CAST(DATEADD(MONTH, -11, GETDATE()) AS DATE),
       'renewed',
       'Previous twelve-month rental term for the same temporary demonstration stall.',
       DATEADD(MONTH, -10, GETDATE())),

      ('TMPRA003', 'TMPS002', 'TEMP-HCR-TMPS002-CURRENT',
       CAST(DATEADD(MONTH, -4, GETDATE()) AS DATE),
       CAST(DATEADD(MONTH, 8, GETDATE()) AS DATE),
       1630.00,
       CAST(DATEADD(MONTH, 7, GETDATE()) AS DATE),
       'active',
       'The stall may operate daily from 7am to 9pm. Cleaning fees are included and utilities are billed monthly.',
       DATEADD(DAY, -35, GETDATE()));

    -- -------------------------------------------------------
    -- Per-field agreement history
    -- -------------------------------------------------------
    INSERT INTO RentalAgreementChanges
      (AgreementID, ChangedBy, FieldChanged, PreviousValue,
       NewValue, ChangeReason, ChangedAt)
    VALUES
      ('TMPRA001', 'TMPV001', 'Monthly rent',
       'S$1,800.00', 'S$1,850.00',
       'Annual rental rate adjustment', DATEADD(DAY, -12, GETDATE())),

      ('TMPRA001', 'TMPV001', 'Renewal date',
       '30 days before expiry', '21 days from today',
       'Updated after landlord confirmation', DATEADD(DAY, -12, GETDATE())),

      ('TMPRA001', 'TMPV001', 'Terms summary',
       'Cleaning included', 'Cleaning and waste collection included',
       'Clarified included services', DATEADD(DAY, -20, GETDATE())),

      ('TMPRA002', 'TMPV001', 'Status',
       'active', 'renewed',
       'Renewal completed for the next term', DATEADD(MONTH, -10, GETDATE())),

      ('TMPRA003', 'TMPV002', 'Monthly rent',
       'S$1,580.00', 'S$1,630.00',
       'Updated maintenance contribution', DATEADD(DAY, -35, GETDATE())),

      ('TMPRA003', 'TMPV002', 'Terms summary',
       'Daily operating hours apply',
       'Daily operating hours and utility billing clarified',
       'Added the confirmed operating conditions', DATEADD(DAY, -35, GETDATE())),

      ('TMPRA003', 'TMPV002', 'Renewal date',
       '180 days from today', '7 months from today',
       'Aligned with the signed agreement schedule', DATEADD(DAY, -60, GETDATE()));
  END;

  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0
  BEGIN
    ROLLBACK TRANSACTION;
  END;

  THROW;
END CATCH;

-- =========================================================
-- Verification output
-- =========================================================
IF @Mode = 'CLEANUP'
BEGIN
  SELECT
    'Temporary rental demo data removed.' AS Result,
    @Mode AS Mode;
END
ELSE
BEGIN
  SELECT
    u.username AS DemoUsername,
    'Demo123!' AS DemoPassword,
    s.StallName,
    COUNT(ra.AgreementID) AS AgreementCount,
    SUM(CASE WHEN ra.Status IN ('active', 'renewal due') THEN 1 ELSE 0 END) AS CurrentAgreementCount,
    MIN(CASE WHEN ra.Status IN ('active', 'renewal due') THEN ra.RenewalDate END) AS NextRenewalDate,
    COALESCE(SUM(CASE WHEN ra.Status IN ('active', 'renewal due') THEN ra.MonthlyRent ELSE 0 END), 0) AS CurrentMonthlyRent
  FROM Users u
  INNER JOIN Stalls s ON s.OwnerID = u.id
  LEFT JOIN RentalAgreements ra ON ra.StallID = s.StallID
  WHERE u.id IN ('TMPV001', 'TMPV002', 'TMPV003')
  GROUP BY u.username, s.StallName
  ORDER BY u.username;

  SELECT
    ra.AgreementReference,
    rac.FieldChanged,
    rac.PreviousValue,
    rac.NewValue,
    rac.ChangeReason,
    u.username AS ChangedBy,
    rac.ChangedAt
  FROM RentalAgreementChanges rac
  INNER JOIN RentalAgreements ra ON ra.AgreementID = rac.AgreementID
  INNER JOIN Users u ON u.id = rac.ChangedBy
  WHERE rac.AgreementID IN ('TMPRA001', 'TMPRA002', 'TMPRA003')
  ORDER BY rac.ChangedAt DESC, rac.ChangeID DESC;
END;
