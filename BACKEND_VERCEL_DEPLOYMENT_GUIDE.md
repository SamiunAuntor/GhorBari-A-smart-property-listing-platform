# Backend Deployment Guide (Vercel CLI)

This guide is for your current project structure:

- Root: `GHOR_BARI/`
- Backend app: `GHOR_BARI/backend/`
- Express app export: `backend/src/app.js`
- Local server bootstrap: `backend/server.js`

## 1. Prerequisites

Before deploying, make sure you have:

1. Node.js 18+ and npm installed.
2. A Vercel account.
3. Vercel CLI installed:
   ```bash
   npm i -g vercel
   ```
4. MongoDB connection string (`MONGO_URI`).
5. Gemini API key (`GEMINI_API_KEY`) if AI endpoints are used.
6. Frontend URL for CORS (`CLIENT_URL`) after frontend deployment.
7. Firebase Admin credentials available to backend.

## 2. Important Project Notes (Current Code)

Your backend currently:

- Uses `server.js` with `httpServer.listen(...)` and Socket.io.
- Loads Firebase Admin credentials from file:
  `backend/ghor-bari-firebase-admin-sdk.json`

On Vercel:

- API runs as serverless functions, so long-running Socket.io server is not suitable.
- You should deploy Express routes as a serverless API handler.

## 3. One-Time Vercel Serverless Setup (Backend Folder)

From project root:

```bash
cd backend
```

Create `backend/api/index.js`:

```js
import app from "../src/app.js";
import { connectDatabase } from "../src/config/db.js";

let isDbConnected = false;

export default async function handler(req, res) {
  if (!isDbConnected) {
    await connectDatabase();
    isDbConnected = true;
  }
  return app(req, res);
}
```

Create `backend/vercel.json`:

```json
{
  "version": 2,
  "functions": {
    "api/index.js": {
      "runtime": "nodejs22.x"
    }
  },
  "rewrites": [
    { "source": "/(.*)", "destination": "/api/index.js" }
  ]
}
```

Notes:

- Keep `server.js` for local development (`npm run dev` / `npm start`).
- Socket.io real-time chat will not work reliably on Vercel serverless in this form.

## 4. Firebase Admin Prerequisite

Your current code expects:

```txt
backend/ghor-bari-firebase-admin-sdk.json
```

If this file is missing during deploy, auth middleware will fail.

Recommended production approach:

- Move Firebase service account JSON into an environment variable and parse it in code.
- If you keep file-based setup, ensure the file is available in deployment source (not recommended for security).

## 5. Set Environment Variables in Vercel (CLI)

Inside `backend/`:

```bash
vercel login
vercel link
```

Add required env vars:

```bash
vercel env add MONGO_URI production
vercel env add GEMINI_API_KEY production
vercel env add CLIENT_URL production
```

If needed for preview too:

```bash
vercel env add MONGO_URI preview
vercel env add GEMINI_API_KEY preview
vercel env add CLIENT_URL preview
```

## 6. Deploy with CLI

Production deploy:

```bash
vercel --prod
```

After deploy, Vercel prints your backend URL, for example:

```txt
https://your-backend-name.vercel.app
```

## 7. Post-Deployment Checklist

1. Open:
   - `GET https://your-backend-name.vercel.app/`
2. Test a protected endpoint with valid Firebase token.
3. Update frontend `.env` / API base URL to deployed backend URL.
4. Set `CLIENT_URL` in backend env to your deployed frontend URL.
5. Redeploy backend if env values were changed:
   ```bash
   vercel --prod
   ```

## 8. Common Issues

- `MongoDB connection failed`:
  - Wrong `MONGO_URI` or IP access not allowed in MongoDB network rules.

- `Invalid token` for all protected routes:
  - Firebase Admin credentials not loading correctly in production.

- CORS errors:
  - `CLIENT_URL` does not match frontend origin exactly.

- Chat/socket features not working:
  - Expected on Vercel serverless with current Socket.io architecture.

---

If you want, next step can be a second guide for deploying chat/socket on a persistent Node host (Render/Railway/Fly.io) while keeping the rest on Vercel.
