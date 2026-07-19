const db = require("../../backend-login/dbConfig");


exports.getCounts = async(vendorId)=>{


const request = db.request();

request.input(
    "vendorId",
    vendorId
);


const notifications = await request.query(`

SELECT COUNT(*) AS count
FROM Notifications
WHERE VendorID = @vendorId
AND IsRead = 'False'

`);



const complaints = await request.query(`

SELECT COUNT(*) AS count
FROM Complaints c

JOIN Stalls s
ON c.stall_id = s.StallID

WHERE s.OwnerID = @vendorId
AND c.status = 'pending'

`);



return {

    notifications:
        notifications.recordset[0].count,

    complaints:
        complaints.recordset[0].count

};

};