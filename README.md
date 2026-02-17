# BlogApp

A full-stack blog platform with social features—register, write posts, follow users, like and comment on stories. Built with React and Node.js.

![Stack](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Stack](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js)
![Stack](https://img.shields.io/badge/PostgreSQL-Database-336791?logo=postgresql)

---

## Features

- **Authentication** — Register, login, JWT-based sessions
- **Profiles** — Avatar, bio, website; view posts, followers, and following
- **Follow system** — Follow/unfollow users; click counts to see lists in a modal
- **Posts** — Create, edit, delete; rich text editor (React Quill), cover images, tags
- **Engagement** — Like posts, comment on posts
- **Feed** — Home feed with all posts, load more pagination
- **Settings** — Edit your profile (name, bio, avatar, website)

---

## Tech Stack

| Layer     | Tech                          |
|----------|-------------------------------|
| Frontend | React 18, Vite, React Router, React Quill, Axios, date-fns |
| Backend  | Node.js, Express 5, JWT, bcryptjs |
| Database | PostgreSQL                    |

---

## Prerequisites

- Node.js 18+
- PostgreSQL
- npm or yarn

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/blogapp.git
cd blogapp
```

### 2. Database

Create a PostgreSQL database named `blogapp` and run the schema:

```bash
# In psql or pgAdmin, run:
psql -U postgres -d blogapp -f backend/config/schema.sql
```

### 3. Backend

```bash
cd backend
npm install
```

Create `.env` (never commit this file):

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=blogapp
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_long_random_secret
PORT=5000
CLIENT_URL=http://localhost:3000
```

Start the server:

```bash
npm run dev
# or: node server.js
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
blogapp/
├── backend/
│   ├── config/         # DB config, schema
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── App.jsx
│   └── vite.config.js
└── README.md
```

---

## API Overview

| Method | Endpoint                     | Description          |
|--------|------------------------------|----------------------|
| POST   | `/api/auth/register`         | Register user        |
| POST   | `/api/auth/login`            | Login                |
| GET    | `/api/users/:username`       | Get profile          |
| GET    | `/api/users/:username/posts` | Get user's posts     |
| GET    | `/api/users/:username/followers` | List followers   |
| GET    | `/api/users/:username/following` | List following   |
| POST   | `/api/users/:username/follow`| Toggle follow        |
| GET    | `/api/posts`                 | List posts (feed)    |
| POST   | `/api/posts`                 | Create post          |
| ...    | ...                          | ...                  |

---

## License

ISC
