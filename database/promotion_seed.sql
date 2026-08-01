SET NOCOUNT ON;

IF NOT EXISTS (
    SELECT 1
    FROM Stalls
    WHERE StallID = 'STALL001'
)
BEGIN
    THROW 50001, 'STALL001 must exist before promotion data is loaded.', 1;
END;

WITH PromotionSeed AS (
    SELECT
        seed.stall_id,
        seed.title,
        seed.description,
        seed.discount
    FROM (VALUES
        ('STALL001', 'Lunch Special', 'Get a free drink with any main dish', '10% off'),
        ('STALL001', 'Test Promo', 'Testing the email notification', '20% off'),
        ('STALL001', 'Weekend Feast', 'Buy any two mains and get a free dessert', '1-for-1 dessert'),
        ('STALL001', 'Weekend Special', 'Free drink with every main dish this weekend', '20% off'),
        ('STALL001', 'Happy Hour Deal', 'All drinks half price from 3pm to 5pm daily', '50% off drinks'),
        ('STALL001', 'Student Meal Deal', 'Show your student ID and get a free upsize on any meal', 'Free upsize'),
        ('STALL001', 'Early Bird Breakfast', 'First 20 customers before 9am get a free kopi with any breakfast set', 'Free kopi'),
        ('STALL001', 'Late Night Supper', 'Order after 9pm and get a free dessert with any main dish', 'Free dessert'),
        ('STALL001', 'Lunch Combo Special', 'Any main dish with a drink and side for one low price, weekdays only', '$2 off combo')
    ) AS seed(stall_id, title, description, discount)
)
INSERT INTO Promotion (stall_id, title, description, discount)
SELECT
    seed.stall_id,
    seed.title,
    seed.description,
    seed.discount
FROM PromotionSeed seed
WHERE NOT EXISTS (
    SELECT 1
    FROM Promotion existing
    WHERE existing.stall_id = seed.stall_id
      AND existing.title = seed.title
);

SELECT
    p.promotion_id,
    p.stall_id,
    p.title,
    p.description,
    p.discount
FROM Promotion p
WHERE p.stall_id = 'STALL001'
ORDER BY p.promotion_id;
