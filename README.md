# Hawkers

A web application for Singapore's hawker centres, connecting the people who
eat at them, the vendors who run the stalls, and the NEA officers who keep
them safe.

Built as the Back-End Development (BED) assignment for AY2026-27 Semester 1.

---

## About the Project

Singapore's hawker centres are run by an operator, filled with independently
owned stalls, and inspected by the National Environment Agency. Today that
runs on paper, phone calls and word of mouth. Customers queue without knowing
what a stall sells or how clean it is. Vendors track orders by shouting a
number. Inspectors record hygiene grades that nobody outside the agency ever
sees.

Hawkers brings all three groups onto one platform: customers order and leave
feedback, vendors manage their stall and see their sales, and inspectors log
inspections that feed straight into the hygiene grades customers can read
before they buy.

### Objective

To build a back-end application using Node.js and Express that exposes a
RESTful API over a Microsoft SQL Server database, supporting the daily
operations of a hawker centre for four kinds of user — customers, guests,
vendors and NEA inspectors — with proper authentication, authorisation,
input validation and error handling throughout.

### Target Audience

| Who | What they use it for |
| --- | --- |
| **Customers** | Browsing stalls, ordering food, tracking past orders, leaving feedback and complaints |
| **Guests** | Ordering without an account, with history kept in their own browser |
| **Vendors** | Managing menus, watching incoming orders, responding to complaints, reviewing sales and rental agreements |
| **NEA inspectors** | Scheduling inspections, recording scores and remarks, issuing hygiene grades |

### Mission

To make hawker centres easier to run and easier to trust, by putting ordering,
feedback and hygiene information in one place.

### Vision

A hawker scene where every stall's quality is visible, every vendor can see
how their business is doing, and no customer has to guess.

---

## Features

### User Account Management

Registration and login for three roles, with the account itself treated as
something worth protecting.

- Users register as a customer, vendor, or inspector
- Users can register, log in, edit their account details and delete their account
- Server validates input (email format, strong password rules) before storing
  anything in the database
- Passwords are encrypted (bcrypt) before being saved
- Login verifies credentials and issues a signed token to authorise future requests
- Users are redirected to their role-specific dashboard automatically after login
- Newly created accounts are inactive; the backend calls a third-party email API
  to send a verification link, and login is refused until the link is clicked
- Visitors can continue as guest without an account

### Order History

Every past order, kept wherever it belongs — the database for account holders,
the browser for guests.

- Registered customers' order history is stored in the database, tied to their
  account and retrievable anytime
- Guest customers' order history is stored locally in the browser since guests
  don't own an account
- Customers and guests can search their own orders by stall name, item name, or status
- Orders can only be created by users with the customer role

### Ordering and Checkout

From cart to payment, including the awkward parts like ordering from two
stalls at once.

- Patrons can add items to a cart and complete payment
- Display payment success/failure status clearly
- Support optional add-ons and extra charges (e.g. packaging, delivery)
- Cart of registered user is saved in Firestore
- Cart of guest is saved locally
- Multiple vendors are supported in one order

### Customer Feedback

Ratings and comments on individual stalls, editable after the fact.

- Enables customers to submit feedback, including a rating and written comments
  for individual food stalls
- Retrieves feedback records (full list or a specific entry by ID)
- Allows feedback to be updated after submission
- Deletion of feedback entries

### Customer Complaint

A formal channel for the problems a star rating doesn't cover.

- Enables customers to lodge formal complaints against stalls
- Retrieves complaint records (full list or a specific entry by ID)
- Allows complaint status to be tracked and updated
- Deletion of complaint entries

### Vendor Notifications and Workflow

Keeping vendors on top of what is happening at their stall right now.

- Live order notification tracking for vendors
- Live complaint tracking and resolution workflow
- Complaint status notifications and progress monitoring
- Instant updates for new orders and complaint updates
- Real-time order status updates for vendors and synchronisation
- Vendor-specific order and complaint filtering
- Notification badges for unread activities
- Pending order counter on dashboard
- Vendor order history tracking

### Vendor Stall and Menu Management

Everything a stall owner needs to run the business side.

- Menu management with multiple cuisines per item
- Rental agreement tracking for renewals and changes
- Stall performance dashboard
- Best-selling menu-item table

### Operational Enhancements

The plumbing that keeps the vendor and customer views in step.

- Centralised vendor notifications and activity tracking
- Improved order and complaint management workflow
- Real-time synchronisation between customer and vendor actions
- Automatic refresh for vendor updates

### Analytics and Reporting

Turning the order and inspection records into something a vendor can act on.

- Sales analytics for popular items and peak hours
- Customer satisfaction dashboard for feedback and complaints
- Inspection trends and hygiene-grade history
- Date filters for dashboard charts

### Regulatory and Compliance

The NEA side of the system, and the reason customers can see a hygiene grade
at all.

- Inspection scheduling and logging by NEA officers
- Record inspection scores, remarks, and hygiene grades

---

## Technology Stack

### Back-End

| Technology | Purpose |
| --- | --- |
| Node.js | JavaScript runtime for the server |
| Express | Web framework used to build the RESTful API |
| Microsoft SQL Server | Relational database for users, stalls, orders, feedback, complaints, inspections and rental agreements |
| mssql | Node.js driver for connecting to and querying SQL Server |
| Joi | Schema validation for request bodies before they reach a controller |
| bcryptjs | Password hashing, so raw passwords are never stored |
| jsonwebtoken | Issuing and verifying the signed tokens that authorise requests |
| dotenv | Loading credentials and API keys from environment variables |
| CORS | Allowing the front-end to call the API during local development |

### Front-End

| Technology | Purpose |
| --- | --- |
| HTML, CSS, JavaScript | Page structure, styling and interaction |
| ES modules | Shared front-end logic across pages |
| Chart.js | Dashboard charts for sales and inspection data |
| Local Storage | Guest carts and guest order history |

### Third-Party Services

| Service | Purpose |
| --- | --- |
| Brevo | Transactional email API used to send account verification emails |
| Cloud Firestore | Customer-facing stall and product catalogue, and registered users' carts |

### Documentation and Testing

| Tool | Purpose |
| --- | --- |
| Swagger UI Express, swagger-jsdoc | Interactive API documentation served at `/api-docs` |
| Postman | Testing endpoints with valid and invalid inputs, and capturing evidence |
| SQL Server Management Studio | Creating the schema and inspecting data |

---

## Getting Started

**Prerequisites:** Node.js 18 or later, Microsoft SQL Server with TCP/IP enabled
on port 1433, and SQL Server Management Studio.

**1. Set up the database**

Create a database named `hawkerCentreDB` in SSMS, then run the schema script
followed by the sample data script.

**2. Install dependencies**

```bash
cd backend-login
npm install
```

**3. Configure environment variables**

Copy `.env.example` to `.env` and fill in your database credentials, JWT secret
and Brevo API key. `.env` is git-ignored and must never be committed. Leaving
`BREVO_API_KEY` blank prints verification emails to the terminal instead of
sending them, which is useful for local testing.

**4. Start the server**

```bash
node app.js
```

The API runs on `http://localhost:3000`, with interactive documentation at
`http://localhost:3000/api-docs`. Use the **Authorize** button there with a
token from `POST /users/login` to try the protected endpoints.

---


## Security

- **Password storage** — hashed with bcrypt, never stored or returned in plain text
- **Authentication** — protected routes verify a signed JWT before the request
  reaches a controller; tokens expire after 7 days
- **Authorisation** — role checks restrict actions to the correct user type, and
  ownership is re-checked inside controllers so a valid token for one account
  cannot read another account's data
- **Email verification** — accounts stay inactive until a single-use link is
  clicked; links expire after 24 hours and are stored only as a SHA-256 hash
- **SQL injection** — every query is parameterised, so user input can never
  alter a statement
- **Secrets** — credentials and API keys are loaded from environment variables
  and kept out of version control

---

## Team

| Student No. | Name | Area |
| --- | --- | --- |
| S10273432A | Ignatius Marcus Lee Yi Yang | Vendor stall management, analytics and reporting |
| S10273890E | Shenise Lim Em Qing | User account management, order history |
| S10272203K | Chloe Heng Chi Xuan | Customer feedback, customer complaints |
| S10272091G | Capili Jiliana Sky Almonte | Ordering and checkout, regulatory and compliance |
| S10272197B | Lin Shiyu Declan | Vendor notifications, operational enhancements |

---

## Credits

Third-party sources for images, icons, fonts, libraries and APIs are listed in
`credit.md`.
