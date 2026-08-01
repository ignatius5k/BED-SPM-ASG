-- Idempotent upgrade for databases created before email verification existed.
-- Existing accounts are treated as verified; accounts registered afterward
-- receive the Users.IsVerified default value of 0.

SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY
  BEGIN TRANSACTION;

  IF COL_LENGTH('dbo.Users', 'IsVerified') IS NULL
  BEGIN
    EXEC(N'ALTER TABLE Users ADD IsVerified BIT NULL;');
    EXEC(N'UPDATE Users SET IsVerified = 1;');
    EXEC(N'ALTER TABLE Users ALTER COLUMN IsVerified BIT NOT NULL;');
  END;

  IF NOT EXISTS (
    SELECT 1
    FROM sys.default_constraints defaults
    WHERE defaults.parent_object_id = OBJECT_ID('dbo.Users')
      AND defaults.parent_column_id = COLUMNPROPERTY(
        OBJECT_ID('dbo.Users'),
        'IsVerified',
        'ColumnId'
      )
  )
  BEGIN
    ALTER TABLE Users ADD CONSTRAINT DF_Users_IsVerified
      DEFAULT 0 FOR IsVerified;
  END;

  EXEC sp_executesql N'
    UPDATE Users
    SET IsVerified = 1
    WHERE
      (id LIKE ''CUST%''
        AND TRY_CONVERT(INT, SUBSTRING(id, 5, 10)) BETWEEN 1 AND 33)
      OR (id LIKE ''VEND%''
        AND TRY_CONVERT(INT, SUBSTRING(id, 5, 10)) BETWEEN 1 AND 10)
      OR (id LIKE ''INSP%''
        AND TRY_CONVERT(INT, SUBSTRING(id, 5, 10)) BETWEEN 1 AND 7);
  ';

  IF OBJECT_ID('dbo.EmailVerifications', 'U') IS NULL
  BEGIN
    CREATE TABLE EmailVerifications (
      VerificationID INT IDENTITY(1,1) PRIMARY KEY,
      UserID VARCHAR(10) NOT NULL
        FOREIGN KEY REFERENCES Users(id),
      TokenHash CHAR(64) NOT NULL,
      ExpiresAt DATETIME2 NOT NULL,
      UsedAt DATETIME2 NULL,
      CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
  END;

  IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID('dbo.EmailVerifications')
      AND name = 'IX_EmailVerifications_TokenHash'
  )
  BEGIN
    CREATE INDEX IX_EmailVerifications_TokenHash
      ON EmailVerifications (TokenHash);
  END;

  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0
    ROLLBACK TRANSACTION;
  THROW;
END CATCH;

EXEC sp_executesql N'
  SELECT
    COL_LENGTH(''dbo.Users'', ''IsVerified'') AS IsVerifiedColumnLength,
    (SELECT COUNT(*) FROM Users WHERE IsVerified = 1)
      AS VerifiedExistingUsers,
    OBJECT_ID(''dbo.EmailVerifications'', ''U'')
      AS EmailVerificationTableId;
';
