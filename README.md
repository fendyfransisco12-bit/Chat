# Chat Application with Next.js

Aplikasi chat real-time dengan sistem autentikasi dan auto-redirect. Dibangun menggunakan Next.js 14 dengan App Router, TypeScript, dan Tailwind CSS.

## 🎨 Features

- **Sistem Login**: Autentikasi dengan JWT token
- **Auto-redirect**: Otomatis redirect ke login jika belum login
- **Beautiful UI**: Design modern dengan glassmorphism effect
- **Dark Mode**: Tema gelap yang elegan
- **Responsive**: Bekerja baik di desktop dan mobile
- **User Management**: Menampilkan user online/offline
- **Real-time Chat**: Interface chat yang interaktif

## 📁 Struktur Folder

```
chat-app/
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── login/route.ts    # API endpoint login
│   │       ├── logout/route.ts   # API endpoint logout
│   │       └── check/route.ts    # API cek status login
│   ├── login/
│   │   └── page.tsx              # Halaman login
│   └── page.tsx                  # Halaman utama (chat)
├── components/
│   ├── LoginForm.tsx             # Komponen form login
│   └── ChatApp.tsx              # Komponen aplikasi chat
├── middleware.ts                 # Middleware untuk auto-redirect
├── package.json
└── tailwind.config.ts
```

## 🚀 Cara Install & Run

1. **Install dependencies**:
```bash
npm install
```

2. **Set environment variable (optional)**:
Buat file `.env.local` dan tambahkan:
```env
JWT_SECRET=your-secret-key-here
```

3. **Run development server**:
```bash
npm run dev
```

4. **Buka browser**:
Akses `http://localhost:3000`

## 🔐 Demo Login

Gunakan salah satu kredensial berikut untuk login:

- **Username**: demo | **Password**: demo123
- **Username**: user | **Password**: password
- **Username**: admin | **Password**: admin123

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Auth**: JWT dengan jose library
- **State**: React Hooks

## 📋 Fitur Utama

### 1. Middleware Auto-redirect
- Otomatis redirect ke `/login` jika belum login
- Redirect ke home `/` jika sudah login tapi akses `/login`
- Skip untuk API routes

### 2. Sistem Autentikasi
- JWT token stored in httpOnly cookie
- Token expired dalam 24 jam
- Secure cookie di production

### 3. Chat Interface
- Sidebar dengan daftar user online/offline
- Real-time message display
- Typing indicator (bisa ditambahkan)
- Message timestamp

## 🎨 Design Highlights

- **Glassmorphism effect** pada login form
- **Gradient backgrounds** dengan animasi blob
- **Dark theme** yang konsisten
- **Smooth animations** dan transitions
- **Custom scrollbar** untuk chat area

## 📝 Notes untuk Development

1. **WebSocket**: Untuk real-time chat sebenarnya, integrasikan dengan Socket.io atau Pusher
2. **Database**: Gunakan database seperti PostgreSQL atau MongoDB untuk production
3. **Authentication**: Pertimbangkan menggunakan NextAuth.js untuk autentikasi yang lebih robust
4. **File Upload**: Tambahkan fitur upload gambar/file
5. **Notification**: Implementasikan push notification untuk pesan baru

## 🔧 Customization

### Mengubah Warna Theme
Edit file `tailwind.config.ts` dan `components/` untuk mengubah color scheme.

### Menambah Fitur
- Voice/Video call
- Group chat
- Private messaging
- User profile
- Message reactions
- File sharing

## 📱 Responsive Design
Aplikasi ini sudah responsive, namun bisa ditingkatkan dengan:
- Mobile-first approach
- Touch gestures
- Progressive Web App (PWA)

## 🚀 Deploy ke Production

1. **Build aplikasi**:
```bash
npm run build
```

2. **Deploy ke Vercel** (recommended):
```bash
npx vercel
```

Atau deploy ke platform lain seperti Netlify, Railway, atau server sendiri.

## 📄 License

MIT License - Feel free to use for your projects!