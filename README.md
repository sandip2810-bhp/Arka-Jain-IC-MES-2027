# Arka Jain University: IC-MES 2027 website (frontend + backend)

## Folder structure
```
arka-jain-ic-mes/
  server.js            backend (Node + Express): login, save page, upload files
  package.json
  .env.example         copy to .env and set ADMIN_PASSWORD
  public/              the website (what visitors see)
    index.html         page content (saved here by the admin panel)
    css/style.css
    js/admin.js        admin editing bar (only active after login)
    assets/logo.png
    uploads/           photos and PDFs uploaded by the admin
  backups/             automatic copies of index.html before each save
```

## Run
1. Install Node.js 18 or newer.
2. `npm install`
3. Copy `.env.example` to `.env` and set `ADMIN_PASSWORD` (long) and `SESSION_SECRET` (random).
4. `npm start`, then open http://localhost:3000

## Use the admin panel
Click "Admin" in the footer (or open `/admin`), log in, press "Edit page", click any text to change it, then "Save".
Each link button has "Set link" and "Upload file". The campus photo has "Change image".

## Deploy
Needs a host that runs Node (Render, Railway, a VPS, or university server). Use a persistent disk,
otherwise saved edits and uploads are lost on restart. Set the same environment variables and NODE_ENV=production.
Use HTTPS.

## Hosting note
Saved edits and uploads are files on the server's disk. On hosts with a temporary disk (Vercel, Netlify, free Render/Railway plans) they are erased on restart or redeploy. Use a host with a persistent disk, or move storage to a database (see below).

## Database
Not required. The page and uploads are stored as files. A database (for example Supabase) is only
needed if you later add online registration or paper submission forms.

## Security notes
- Production needs both ADMIN_PASSWORD and SESSION_SECRET set (the server refuses to start without them).
- Uploads are checked by file content as well as extension; limit 10 MB.
- Login is limited to 5 attempts per 15 minutes per IP.
