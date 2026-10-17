require('dotenv').config();
const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PASSWORD = process.env.ADMIN_PASSWORD;
if (!PASSWORD) { console.error('Set ADMIN_PASSWORD in the .env file first.'); process.exit(1); }
if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) { console.error('Set SESSION_SECRET in the environment first.'); process.exit(1); }
const SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const PORT = process.env.PORT || 3000;
const PUB = path.join(__dirname, 'public');
const UPLOADS = path.join(PUB, 'uploads');
const BACKUPS = path.join(__dirname, 'backups');
let WRITABLE = true; // false on hosts with a read-only disk (for example Vercel)
try { [UPLOADS, BACKUPS].forEach(d => fs.mkdirSync(d, { recursive: true })); }
catch (e) { WRITABLE = false; console.warn('Disk is read-only: the website will load, but the admin panel cannot save changes here.'); }
const needDisk = (req, res, next) => WRITABLE ? next() : res.status(503).json({ error: 'This host cannot save files. Use a host with persistent storage (for example Render with a disk).' });

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  next();
});
app.use(express.json({ limit: '3mb' }));

const hmac = v => crypto.createHmac('sha256', SECRET).update(v).digest('hex');
const sha = v => crypto.createHash('sha256').update(v).digest();
const makeToken = () => { const exp = String(Date.now() + 8 * 3600 * 1000); return exp + '.' + hmac(exp); };
function cookie(req, name) {
  const m = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith(name + '='));
  return m ? decodeURIComponent(m.slice(name.length + 1)) : '';
}
function validToken(tok) {
  const [exp, sig] = (tok || '').split('.');
  if (!exp || !sig) return false;
  const good = hmac(exp);
  return sig.length === good.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good)) && Number(exp) > Date.now();
}
const requireAdmin = (req, res, next) => validToken(cookie(req, 'admin')) ? next() : res.status(401).json({ error: 'Not logged in' });

// Login with a simple attempt limit (5 per 15 minutes per IP)
const attempts = new Map();
setInterval(() => { const t = Date.now(); attempts.forEach((v, k) => { if (t > v.reset) attempts.delete(k); }); }, 10 * 60 * 1000).unref();
app.post('/api/login', (req, res) => {
  const now = Date.now();
  const a = attempts.get(req.ip) || { n: 0, reset: now + 15 * 60 * 1000 };
  if (now > a.reset) { a.n = 0; a.reset = now + 15 * 60 * 1000; }
  if (a.n >= 5) return res.status(429).json({ error: 'Too many attempts' });
  const given = String((req.body && req.body.password) || '');
  if (!crypto.timingSafeEqual(sha(given), sha(PASSWORD))) { a.n++; attempts.set(req.ip, a); return res.status(401).json({ error: 'Wrong password' }); }
  attempts.delete(req.ip);
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `admin=${encodeURIComponent(makeToken())}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${secure}`);
  res.json({ ok: true });
});
app.post('/api/logout', (req, res) => { res.setHeader('Set-Cookie', 'admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'); res.json({ ok: true }); });
app.get('/api/me', requireAdmin, (req, res) => res.json({ ok: true }));

// Save the edited page (keeps the last 20 backups)
app.post('/api/save', requireAdmin, needDisk, (req, res) => {
  const html = req.body && req.body.html;
  if (typeof html !== 'string' || !html.startsWith('<!DOCTYPE html>') || html.length > 2000000) return res.status(400).json({ error: 'Invalid page' });
  const file = path.join(PUB, 'index.html');
  if (fs.existsSync(file)) fs.copyFileSync(file, path.join(BACKUPS, 'index-' + Date.now() + '.html'));
  fs.readdirSync(BACKUPS).filter(f => /^index-\d+\.html$/.test(f)).sort().slice(0, -20).forEach(f => fs.unlinkSync(path.join(BACKUPS, f)));
  fs.writeFileSync(file + '.tmp', html);
  fs.renameSync(file + '.tmp', file);
  res.json({ ok: true });
});

// Upload photos and PDFs
const upload = multer({
  storage: multer.diskStorage({
    destination: (r, f, cb) => cb(null, UPLOADS),
    filename: (r, f, cb) => cb(null, Date.now() + '-' + f.originalname.replace(/[^a-zA-Z0-9._-]/g, '_'))
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (r, f, cb) => cb(null, /\.(pdf|png|jpe?g|webp|docx?)$/i.test(f.originalname))
});
const SIGS = { pdf: ['25504446'], png: ['89504e47'], jpg: ['ffd8ff'], jpeg: ['ffd8ff'], webp: ['52494646'], docx: ['504b0304'], doc: ['d0cf11e0'] };
function realType(file) {
  const ext = path.extname(file).slice(1).toLowerCase();
  const fd = fs.openSync(file, 'r'); const b = Buffer.alloc(4); fs.readSync(fd, b, 0, 4, 0); fs.closeSync(fd);
  return (SIGS[ext] || []).some(sig => b.toString('hex').startsWith(sig));
}
app.post('/api/upload', requireAdmin, needDisk, (req, res) => {
  upload.single('file')(req, res, err => {
    if (err) return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'File is larger than 10 MB' : 'Upload failed' });
    if (!req.file) return res.status(400).json({ error: 'File type not allowed' });
    if (!realType(req.file.path)) { fs.unlinkSync(req.file.path); return res.status(400).json({ error: 'File content does not match its type' }); }
    res.json({ url: '/uploads/' + req.file.filename });
  });
});

// Direct address for the admin login (works even if the footer link is ever removed)
app.get('/admin', (req, res) => res.redirect('/#admin'));

app.use(express.static(PUB, { setHeaders: res => res.setHeader('X-Content-Type-Options', 'nosniff') }));
app.use((err, req, res, next) => { console.error(err); res.status(err.status || 500).json({ error: 'Server error' }); });
app.listen(PORT, () => console.log('Website running at http://localhost:' + PORT));