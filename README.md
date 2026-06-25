# موازين — المنصة المالية الذكية

واجهة أولية (React + Vite + TypeScript) لمنصة موازين لإدارة المالية والمستندات والمتابعات والطلبات، بواجهة عربية RTL.

## التشغيل محلياً

```bash
npm install
npm run dev
```

ثم افتح الرابط الظاهر (عادة http://localhost:5173).

## البناء للإنتاج

```bash
npm run build
npm run preview
```

## الرفع على GitHub

من داخل مجلد المشروع، شغّل الأوامر التالية بالترتيب (استبدل USERNAME باسم حسابك):

```bash
git init
git add .
git commit -m "موازين - الواجهة الأولية"
git branch -M main
git remote add origin https://github.com/USERNAME/mazeen.git
git push -u origin main
```

> ملاحظة مهمة: لا ترفع ملف ZIP. الأوامر أعلاه ترفع الملفات مفكوكة تلقائياً، و`node_modules` مستثنى عبر `.gitignore`.

## النشر على Vercel

1. ادخل https://vercel.com وسجّل دخول بحساب GitHub.
2. اضغط **Add New → Project**.
3. اختر مستودع `mazeen`.
4. Vercel يكتشف Vite تلقائياً (Build: `npm run build`، Output: `dist`).
5. اضغط **Deploy**.

بعد دقيقة تقريباً يصير لك رابط مثل: `https://mazeen.vercel.app`

أي `git push` بعدها ينشر تلقائياً.

## البنية

```
mazeen/
├── index.html          # نقطة الدخول + خط IBM Plex Sans Arabic
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── .gitignore
└── src/
    ├── main.tsx        # تهيئة React
    ├── index.css       # إعدادات عامة
    ├── App.tsx         # كل الشاشات
    └── vite-env.d.ts
```
