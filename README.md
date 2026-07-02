# SocNet Server

Backend API for a social network application built with Node.js, Express, and MongoDB.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Database:** MongoDB (Mongoose ODM)
- **Authentication:** JWT (JSON Web Tokens)
- **Real-time:** Socket.io
- **File Upload:** Cloudinary / Multer

## Features

- User authentication & authorization
- Friend requests & management
- Post creation, likes, comments
- Real-time messaging
- Notifications system
- Profile & cover image uploads

## API Routes

| Prefix                | Description          |
| --------------------- | --------------------- |
| `/api/auth`           | Authentication        |
| `/api/users`          | User profiles         |
| `/api/friends`        | Friend management     |
| `/api/posts`          | Post CRUD             |
| `/api/posts/:id`      | Post interactions     |
| `/api/messages`       | Messaging             |
| `/api/notifications`  | Notifications         |

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables (see .env.example)
cp .env.example .env

# Run in development
npm run dev

# Run in production
npm start
```

## Environment Variables

| Variable               | Description                |
| ---------------------- | -------------------------- |
| `PORT`                 | Server port (default 5000) |
| `MONGO_URI`            | MongoDB connection string  |
| `JWT_SECRET`           | JWT signing secret         |
| `JWT_EXPIRES_IN`       | Token expiry duration      |
| `NODE_ENV`             | Environment mode           |
| `CLIENT_URL`           | Frontend URL for CORS      |
| `CLOUDINARY_*`         | Cloudinary credentials     |

## Deployment

The server is configured for deployment via Docker (see `Dockerfile`) and Render (see `render.yaml`).
