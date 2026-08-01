-- Revert only the additive public catalogue mapping layer.
-- Revert the feature commit before running this file.
-- No stalls, users, menu items, orders, reviews, promotions, inspections,
-- schedules, or rental agreements are deleted.

SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY
  BEGIN TRANSACTION;

  IF OBJECT_ID('dbo.PublicProductLinks', 'U') IS NOT NULL
    DROP TABLE PublicProductLinks;

  IF OBJECT_ID('dbo.PublicStoreLinks', 'U') IS NOT NULL
    DROP TABLE PublicStoreLinks;

  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0
    ROLLBACK TRANSACTION;
  THROW;
END CATCH;

SELECT
  CASE
    WHEN OBJECT_ID('dbo.PublicStoreLinks', 'U') IS NULL
     AND OBJECT_ID('dbo.PublicProductLinks', 'U') IS NULL
    THEN 'Public catalogue mappings removed; operational data preserved.'
    ELSE 'Rollback incomplete.'
  END AS RollbackStatus;
