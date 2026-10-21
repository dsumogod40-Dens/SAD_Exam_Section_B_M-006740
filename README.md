# Scholarship Monitor System

A web-based scholarship monitoring system for managing scholars'
academic records, semester grade submissions, verification, compliance
evaluation, and scholarship renewal decisions.

## Project Overview

The Scholarship Monitor System helps scholars submit semester academic
information and allows authorized staff to review submissions and
monitor scholarship requirements.

The project is built with HTML, CSS, and JavaScript and uses Supabase
for authentication and database services.

## Main Features

### Scholar

-   Sign in using an assigned account.
-   View a scholar dashboard and submission status.
-   Submit semester academic information, including GWA, enrolled units,
    failed subjects, incomplete grades, and dropped subjects.
-   Provide a grade-document reference.
-   View previous submissions.
-   Use the role-access check to test whether restricted records and
    actions are denied.

### Staff

-   View the review dashboard and semester statistics.
-   Search and filter scholar submissions.
-   Review submission evidence and verification status.
-   Evaluate scholarship compliance.
-   Record renewal decisions.
-   Register scholars and assign scholarship programs.

### Monitoring and Records

-   Track submission, verification, compliance, and renewal statuses.
-   Maintain history records for submission and review actions.
-   Support academic-year and semester filtering.

> Available screens and actions depend on the features implemented in
> the current `app.js`, database schema, and Supabase policies.

## Technologies Used

-   **HTML5** --- page structure
-   **CSS3** --- styling and responsive layout
-   **JavaScript** --- application logic
-   **Supabase Auth** --- user authentication
-   **Supabase PostgreSQL** --- database and records
-   **Supabase Row Level Security (RLS)** --- database access
    restrictions
-   **Supabase JavaScript client** --- connection between the web app
    and Supabase

## Project Files

Keep these files together in the project folder unless your code uses a
different structure:

``` text
SAD_Exam_Section_B_StudentID/
├── index.html
├── config.js
├── app.js
├── logo.png
├── seed.sql
└── seed_extra.sql
```

-   `index.html` --- main page and login interface.
-   `config.js` --- Supabase project URL and publishable/anon key.
-   `app.js` --- authentication, navigation, dashboard, and application
    logic.
-   `logo.png` --- project logo. If your actual image is named
    `logo.jpg`, update the image path in `index.html` to match.
-   `seed.sql` --- initial database setup or demo data script, if
    included in your project.
-   `seed_extra.sql` --- additional demo data for scholars and
    historical submissions, if included.

The SQL files may depend on a separate schema or migration file. Run the
schema/setup SQL first, then run the seed scripts in the order required
by their comments.

## Requirements

-   A modern web browser such as Chrome, Edge, or Firefox.
-   A Supabase project.
-   The project's database schema, tables, functions, and Row Level
    Security policies.
-   The Supabase JavaScript client referenced by `index.html`.
-   A local web server is recommended for testing. Opening `index.html`
    directly may work for some features, but using a local server is
    more reliable.

## Setup Instructions

### 1. Create or open the Supabase project

Open the Supabase dashboard and select the project used by this
application.

### 2. Set up the database

1.  Open **SQL Editor** in Supabase.
2.  Run the project's schema or migration SQL first, if it has not
    already been applied.
3.  Run `seed.sql` only after the required tables, functions, and
    policies exist.
4.  Run `seed_extra.sql` after `seed.sql`, following the order described
    in the SQL comments.
5.  Check the query results for errors and confirm that the expected
    scholar, submission, and history records exist.

Do not repeatedly run a seed script that is not designed to be re-run
safely. Back up important data before running SQL that modifies existing
records.

### 3. Configure Supabase

Open `config.js` and confirm that the URL and publishable/anon key match
the Supabase project.

Example structure:

``` javascript
window.CONFIG = {
  url: 'https://YOUR_PROJECT_REF.supabase.co',
  anonKey: 'YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY'
};
```

Use the project's **publishable key** or legacy **anon key** intended
for client-side use. Never place a Supabase `service_role` key, secret
key, database password, or other privileged credential in frontend code
or a public repository.

### 4. Create and link the demo accounts

Create the demo users in **Supabase Dashboard → Authentication →
Users**, or use the project's approved account-creation process.

Then make sure each Auth user is correctly linked to the corresponding
row in `public.profiles` through the project's `auth_user_id` field. The
staff account should be linked to the staff profile (for example,
`STAFF-001`), and the scholar account should be linked to the intended
scholar profile (for example, `B06`), if that is the mapping used by the
project.

The email must exist in Supabase Auth, the password must match the
password set for that Auth user, and the profile/role mapping must be
correct. A profile row by itself does not create a Supabase Auth login.

### 5. Run the application

1.  Open the project folder in Visual Studio Code.
2.  Start a local development server, for example with the **Live
    Server** extension if installed.
3.  Open the local URL shown by the server.
4.  Try signing in with one of the demo accounts below.

## Demo Accounts

These are the demo credentials supplied for this project. Keep them for
local/classroom testing only; change or disable them before using real
student data or deploying a public production system.

  Role      Email                        Password
  --------- ---------------------------- ----------------
  Staff     `staff.test@example.com`     `Staff12345`
  Scholar   `scholar.test@example.com`   `Scholar12345`

If either login returns **"Invalid login credentials,"** confirm that
the account exists in Supabase Auth and reset/set its password to the
value above. Also confirm that `config.js` points to the correct
Supabase project. Do not publish these demo passwords in a public
production deployment.

## Troubleshooting

### Invalid login credentials

-   Confirm the email is present in **Supabase → Authentication →
    Users**.
-   Check the password carefully; Supabase passwords are case-sensitive.
-   If necessary, reset the demo user's password to the supplied demo
    password.
-   Confirm that `config.js` uses the correct project URL and
    publishable/anon key.
-   Check the browser developer console and the Supabase Auth response
    for more detail.

### Login succeeds, but the app cannot load a profile

-   Verify that the Auth user's ID matches
    `public.profiles.auth_user_id`.
-   Verify that the profile has the correct `role` and expected
    `student_id`.
-   Check that the relevant RLS policies permit the authenticated user
    to read their own profile.

### Data does not appear

-   Confirm that the database schema and seed scripts ran successfully.
-   Check the selected academic year and semester.
-   Review the browser console and Supabase logs for database or policy
    errors.
-   Confirm that the app's table names and columns match the current
    database schema.

### Logo does not appear

-   Keep the image in the expected project directory.
-   Match the filename exactly. For example, `logo.png` and `logo.jpg`
    are different filenames.
-   Check the `src` value in the `<img>` element in `index.html`.

## Security Notes

-   Use only Supabase publishable/anon credentials in frontend code.
-   Never expose a service-role key or database password.
-   Keep Row Level Security enabled and test access policies for both
    staff and scholars.
-   Do not use real student information in public demos.
-   Replace demo passwords before production use.
-   Do not rely on hiding interface elements alone to secure records;
    enforce authorization through database policies and trusted
    server-side logic where needed.

## Project Purpose

The purpose of the Scholarship Monitor System is to make scholarship
record management more organized by providing a central place for
academic submissions, staff verification, compliance monitoring, and
renewal decisions.

## Project Status

This README describes the intended workflow and the project structure
reported for the current version. Confirm that every listed feature is
implemented and that the database schema and policies are working before
presenting the system as production-ready.
