const express = require("express");
const complaintController = require("./complaintController");
const {
  validateComplaint,
  validateUpdateComplaint,
  validateComplaintId,
} = require("./complaintValidation");

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/complaint", complaintController.getAllComplaints);
app.get("/complaint/:id", validateComplaintId, complaintController.getComplaintById);
app.post("/complaint", validateComplaint, complaintController.createComplaint);
app.put("/complaint/:id", validateComplaintId, validateUpdateComplaint, complaintController.updateComplaint);
app.delete("/complaint/:id", validateComplaintId, complaintController.deleteComplaint);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});