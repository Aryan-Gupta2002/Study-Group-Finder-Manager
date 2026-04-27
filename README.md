# StudySync — Study Group Finder

A full-stack web application that helps students find and join study groups based on subjects, schedule sessions, and chat with group members.

## Tech Stack

- **Frontend** — HTML, CSS, Vanilla JavaScript
- **Backend** — Node.js, Express.js
- **Database** — MySQL

## Features

- User authentication (signup/login with JWT)
- Browse active study groups with subject filtering
- Create study groups with max size and schedule
- Send and manage join requests
- Group chat (auto-refreshes every 5s)

## Database Concepts Used

- ER model → relational schema design
- Many-to-many relationship (Students ↔ Groups)
- Constraints (max group size via CHECK, UNIQUE, NOT NULL)
- Views (`active_groups_view`)
- Triggers (prevent joining full groups)
- Transactions (accept request + add member atomically)
- Indexing (subject filtering, message retrieval)
- Normalization and referential integrity (foreign keys, ON DELETE CASCADE)

## Project Structure

    study-group-finder/
    ├── frontend/
    │   ├── index.html        # Login / Signup
    │   ├── groups.html       # Browse & create groups
    │   ├── requests.html     # Manage join requests
    │   ├── chat.html         # Group chat
    │   ├── style.css
    │   └── utils.js
    └── server/
        ├── db/
        │   └── connection.js
        ├── routes/
        │   ├── auth.js
        │   ├── groups.js
        │   ├── requests.js
        │   └── messages.js
        ├── middleware/
        │   └── auth.js
        ├── .env.example
        └── index.js

## Getting Started

### Prerequisites

- Node.js
- MySQL

### 1 — Clone the repo

```bash
git clone https://github.com/yourusername/study-group-finder.git
cd study-group-finder
```

### 2 — Set up the database

Open MySQL terminal and run the schema from `database.sql` (or set it up manually as per the project report).

### 3 — Configure environment variables

```bash
cd server
cp .env.example .env
```

Fill in your values in `.env`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=study_group_finder
JWT_SECRET=your_secret_key
PORT=5000
```

### 4 — Install dependencies and start the server

```bash
cd server
npm install
node index.js
```

### 5 — Open the frontend

Open `frontend/index.html` directly in your browser.

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/signup` | Register a new user | No |
| POST | `/api/auth/login` | Login and get JWT | No |
| GET | `/api/groups` | List all active groups | Yes |
| GET | `/api/groups/subjects` | List all subjects | Yes |
| POST | `/api/groups` | Create a new group | Yes |
| POST | `/api/requests` | Send a join request | Yes |
| GET | `/api/requests/incoming` | View incoming requests | Yes |
| PATCH | `/api/requests/:id` | Accept or reject request | Yes |
| GET | `/api/messages/:group_id` | Get group messages | Yes |
| POST | `/api/messages/:group_id` | Send a message | Yes |
