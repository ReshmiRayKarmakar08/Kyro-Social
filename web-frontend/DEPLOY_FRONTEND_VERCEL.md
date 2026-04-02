# Kyro Frontend Deployment (Vercel)

## 1) Push code to GitHub
- Make sure `web-frontend` folder is committed.
- Push your latest branch to GitHub.

## 2) Create Vercel project
- Go to Vercel dashboard.
- Click `Add New -> Project`.
- Import your GitHub repo.
- In project settings:
  - `Framework Preset`: `Vite`
  - `Root Directory`: `web-frontend`
  - Build command: `npm run build`
  - Output directory: `dist`

## 3) Add Environment Variables in Vercel
- `VITE_API_URL` = `https://<your-backend>.onrender.com/api`
- `VITE_SOCKET_URL` = `https://<your-backend>.onrender.com`
- `VITE_GOOGLE_CLIENT_ID` = your Google web client id

Note:
- If backend is not deployed yet, you can still deploy frontend, but API features will not work until backend URL is updated.

## 4) Deploy
- Click `Deploy`.
- After deployment, open the Vercel URL and test:
  - `/auth`
  - `/search`
  - `/profile/<username>`
  - direct refresh on route (should work because of `vercel.json` rewrite)

## 5) When backend is deployed on Render
- Update `VITE_API_URL` and `VITE_SOCKET_URL` in Vercel project settings.
- Click `Redeploy` (or push a commit).

