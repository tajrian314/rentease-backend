# RentEase Backend (Render-ready)

## Setup (local)
1. copy `.env.example` → `.env` and fill values (MongoDB Atlas, Cloudinary, SendGrid, FRONTEND_URL)
2. npm install
3. npm run dev

## Deploy to Render
1. Push repo to GitHub.
2. In Render → New → Web Service → Connect GitHub repo → choose branch.
3. Build command: `npm install`
4. Start command: `npm run start`
5. Add Environment Variables in Render (same keys as `.env`).
6. Deploy. Test: `GET https://<render-url>/api/health`

## Notes
- FRONTEND_URL must match your Vercel domain for CORS to allow requests.
- For image upload, frontend should send `FormData` containing `image` field.
- Auth responses return `{ token, user }` — frontend should store token (localStorage/sessionStorage).
