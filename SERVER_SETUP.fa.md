# راهنمای راه‌اندازی روی سرور (قدم‌به‌قدم)

این سند برای راه‌اندازی **کامل** پروژه روی یک VPS است: یک بک‌اند API، یک پایگاه‌داده Postgres، و **سه پنل جدا** روی ساب‌دامین‌های مختلف.

> **دامنه‌های نمونه در این راهنما** (جایگزین کنید):
>
> | نقش | ساب‌دامین نمونه |
> | --- | --- |
> | API | `api.yourdomain.ir` |
> | پنل فروشنده | `app.yourdomain.ir` |
> | پنل مدیریت | `admin.yourdomain.ir` |
> | پنل بازاریاب | `partner.yourdomain.ir` |

مستندات مرتبط: `DEPLOYMENT.md` (انگلیسی، جزئیات فنی)، `PORTALS.md` (معماری سه پورتال)، `services/api/README.md` (بک‌اند).

---

## ۱) چه سیستم‌عاملی بگیریم؟

**پیشنهاد اصلی: Ubuntu Server 24.04 LTS** (یا 22.04 LTS اگر 24.04 در هاست شما نیست).

| مورد | حداقل پیشنهادی | توضیح |
| --- | --- | --- |
| CPU | ۲ هسته | برای API + Postgres + Nginx کافی است |
| RAM | ۴ گیگابایت | اگر بیلد فرانت‌اند را **روی سرور** می‌زنید؛ با ۲ گیگ فقط API+DB سخت می‌شود |
| دیسک | ۴۰ گیگ SSD | لاگ، دیتابیس، بیلدها |
| پهنای باند | معمولی | ترافیک PWA سبک است |

**چرا Ubuntu LTS؟** مستندات زیاد، پکیج‌های به‌روز Node/Postgres/Nginx، و Certbot برای SSL آماده است.

**جایگزین‌ها:** Debian 12، Rocky/AlmaLinux — همان مراحل با نام پکیج متفاوت.

**هاست:** هر VPS ایرانی یا خارجی که SSH و IP ثابت داشته باشد (مثلاً ابرآروان، پارس‌پک، Hetzner، DigitalOcean).

---

## ۲) قبل از ورود به سرور — آماده‌سازی دامنه

۱. دامنه را بخرید (مثلاً `yourdomain.ir`).
۲. در DNS پنل هاست دامنه، **۴ رکورد A** بسازید (IP همان VPS):

```
api.yourdomain.ir      →  YOUR_SERVER_IP
app.yourdomain.ir      →  YOUR_SERVER_IP
admin.yourdomain.ir    →  YOUR_SERVER_IP
partner.yourdomain.ir  →  YOUR_SERVER_IP
```

۳. چند دقیقه تا چند ساعت صبر کنید تا DNS propagate شود (`dig app.yourdomain.ir` باید IP سرور را نشان دهد).

۴. در پنل **ippanel** (برای OTP پیامکی):
   - خط ارسال (Originator) ثبت کنید.
   - یک **الگوی OTP** تأییدشده با متغیر (مثلاً `code`) بسازید.
   - API Key را یادداشت کنید (فقط سمت سرور می‌رود، نه داخل فرانت).

---

## ۳) اتصال اولیه و امن‌سازی سرور

با کاربر `root` یا کاربر sudo وارد شوید:

```bash
ssh root@YOUR_SERVER_IP
```

### ۳.۱ به‌روزرسانی سیستم

```bash
apt update && apt upgrade -y
apt install -y curl git ufw fail2ban unzip build-essential
timedatectl set-timezone Asia/Tehran
```

### ۳.۲ کاربر غیر root (پیشنهاد)

```bash
adduser deploy
usermod -aG sudo deploy
# کلید SSH خود را به /home/deploy/.ssh/authorized_keys کپی کنید
```

از این به بعد با `deploy` کار کنید.

### ۳.۳ فایروال

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'   # پورت 80 و 443
sudo ufw enable
sudo ufw status
```

پورت **8080** را به اینترنت باز **نکنید** — API فقط از پشت Nginx روی localhost در دسترس باشد.

---

## ۴) نصب Node.js 22

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v    # باید v22.x باشد
npm -v
```

---

## ۵) نصب PostgreSQL 16

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

### ۵.۱ ساخت دیتابیس و کاربر

```bash
sudo -u postgres psql <<'SQL'
CREATE USER portal_app WITH PASSWORD 'یک-رمز-قوی-تصادفی';
CREATE DATABASE portal OWNER portal_app;
GRANT ALL PRIVILEGES ON DATABASE portal TO portal_app;
SQL
```

`DATABASE_URL` نهایی:

```
postgres://portal_app:یک-رمز-قوی-تصادفی@localhost:5432/portal
```

> **گزینه جایگزین:** Postgres مدیریت‌شده (Neon، Supabase، …) — فقط `DATABASE_URL` را از پنل آن‌ها بگیرید و مرحله نصب محلی Postgres را رد کنید.

---

## ۶) کلون پروژه و راه‌اندازی بک‌اند

```bash
sudo mkdir -p /var/www/portal
sudo chown deploy:deploy /var/www/portal
cd /var/www/portal
git clone https://github.com/YOUR_ORG/YOUR_REPO.git .
# یا آخرین release را آپلود کنید
```

### ۶.۱ نصب و بیلد API

```bash
cd /var/www/portal/services/api
npm ci
npm run build
```

### ۶.۲ فایل محیط (`.env`)

```bash
cp .env.example .env
nano .env
```

مقادیر **ضروری** برای پروداکشن:

```env
NODE_ENV=production
PORT=8080

DATABASE_URL=postgres://portal_app:رمز@localhost:5432/portal

# دو مقدار تصادفی — هر کدام: openssl rand -hex 32
JWT_SECRET=...
OTP_HASH_SECRET=...

JWT_EXPIRES_IN=7d

CORS_ORIGINS=https://app.yourdomain.ir,https://admin.yourdomain.ir,https://partner.yourdomain.ir

# فقط موبایل‌های مجاز برای پنل ادمین (با کاما)
ADMIN_MOBILE_ALLOWLIST=09121234567

AFFILIATE_OPEN_SIGNUP=true

# ippanel — بعد از تست می‌توانید SMS_DRY_RUN=false کنید
SMS_DRY_RUN=false
IPPANEL_API_KEY=کلید-شما
IPPANEL_PATTERN_CODE=کد-الگو
IPPANEL_ORIGINATOR=3000xxxx
IPPANEL_OTP_VARIABLE=code
IPPANEL_AUTH_SCHEME=accesskey
```

تولید رمز تصادفی:

```bash
openssl rand -hex 32
```

### ۶.۳ مایگریشن دیتابیس

```bash
npm run migrate
# اختیاری — داده نمونه:
# npm run migrate -- --seed
```

### ۶.۴ تست دستی API

```bash
npm start
# در ترمینال دیگر:
curl -s http://127.0.0.1:8080/health
```

باید `{"status":"ok"}` یا مشابه ببینید. بعد Ctrl+C.

### ۶.۵ سرویس systemd (اجرای دائمی)

فایل نمونه در repo: `services/api/deploy/portal-api.service`

```bash
sudo cp /var/www/portal/services/api/deploy/portal-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable portal-api
sudo systemctl start portal-api
sudo systemctl status portal-api
journalctl -u portal-api -f   # مشاهده لاگ
```

---

## ۷) بیلد و استقرار سه پنل فرانت‌اند

هر پنل **بیلد جدا** با متغیر `EXPO_PUBLIC_PORTAL` است.

### روش الف — بیلد روی سرور

```bash
cd /var/www/portal/apps/client
npm ci

export EXPO_PUBLIC_API_BASE_URL=https://api.yourdomain.ir

EXPO_PUBLIC_API_BASE_URL=$EXPO_PUBLIC_API_BASE_URL npm run export:web:merchant
EXPO_PUBLIC_API_BASE_URL=$EXPO_PUBLIC_API_BASE_URL npm run export:web:admin
EXPO_PUBLIC_API_BASE_URL=$EXPO_PUBLIC_API_BASE_URL npm run export:web:affiliate
```

خروجی‌ها:

| پوشه | پورتال |
| --- | --- |
| `dist-merchant` | فروشنده |
| `dist-admin` | مدیریت |
| `dist-affiliate` | بازاریاب |

### روش ب — بیلد روی لپ‌تاپ / CI و آپلود

اگر RAM سرور کم است، روی ماشین خودتان بیلد بزنید و با `rsync` بفرستید:

```bash
# از لپ‌تاپ:
rsync -avz apps/client/dist-merchant/ deploy@YOUR_SERVER_IP:/var/www/portal/apps/client/dist-merchant/
rsync -avz apps/client/dist-admin/    deploy@YOUR_SERVER_IP:/var/www/portal/apps/client/dist-admin/
rsync -avz apps/client/dist-affiliate/ deploy@YOUR_SERVER_IP:/var/www/portal/apps/client/dist-affiliate/
```

### ۷.۱ مسیر وب برای Nginx

```bash
sudo mkdir -p /var/www/portal-web/{app,admin,partner}
sudo cp -r /var/www/portal/apps/client/dist-merchant/*  /var/www/portal-web/app/
sudo cp -r /var/www/portal/apps/client/dist-admin/*     /var/www/portal-web/admin/
sudo cp -r /var/www/portal/apps/client/dist-affiliate/* /var/www/portal-web/partner/
sudo chown -R www-data:www-data /var/www/portal-web
```

---

## ۸) Nginx — ریورس‌پراکسی و فایل‌های استاتیک

```bash
sudo apt install -y nginx
```

فایل‌های نمونه در `services/api/deploy/nginx/`:

```bash
# API
sudo cp services/api/deploy/nginx/api.conf.example \
  /etc/nginx/sites-available/api.yourdomain.ir
# هر سه پنل (یک قالب — root متفاوت)
sudo cp services/api/deploy/nginx/portal-static.conf.example \
  /etc/nginx/sites-available/app.yourdomain.ir
sudo cp services/api/deploy/nginx/portal-static.conf.example \
  /etc/nginx/sites-available/admin.yourdomain.ir
sudo cp services/api/deploy/nginx/portal-static.conf.example \
  /etc/nginx/sites-available/partner.yourdomain.ir
```

در هر فایل:
- `server_name` را با دامنه واقعی عوض کنید.
- در فایل‌های پنل، `root` را به `/var/www/portal-web/app` (یا `admin` / `partner`) تنظیم کنید.

فعال‌سازی:

```bash
sudo ln -s /etc/nginx/sites-available/api.yourdomain.ir /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/app.yourdomain.ir /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/admin.yourdomain.ir /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/partner.yourdomain.ir /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**نکته SPA:** همه مسیرها باید به `index.html` برگردند تا Expo Router بعد از refresh خطای 404 ندهد (در فایل نمونه `try_files` تنظیم شده).

---

## ۹) SSL با Let's Encrypt (HTTPS)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx \
  -d api.yourdomain.ir \
  -d app.yourdomain.ir \
  -d admin.yourdomain.ir \
  -d partner.yourdomain.ir
```

ایمیل بدهید، شرایط را بپذیرید، redirect به HTTPS را بپذیرید.

تمدید خودکار:

```bash
sudo certbot renew --dry-run
```

> PWA و Service Worker **حتماً** به HTTPS نیاز دارند.

---

## ۱۰) تست نهایی (چک‌لیست)

| # | کار | انتظار |
| --- | --- | --- |
| 1 | `curl https://api.yourdomain.ir/health` | پاسخ سالم |
| 2 | باز کردن `https://app.yourdomain.ir` | صفحه لاگین فروشنده |
| 3 | باز کردن `https://admin.yourdomain.ir` | صفحه لاگین ادمین |
| 4 | باز کردن `https://partner.yourdomain.ir` | صفحه لاگین بازاریاب |
| 5 | درخواست OTP با موبایل ادمین (در allowlist) | پیامک از ippanel |
| 6 | ورود با کد | ورود موفق |
| 7 | refresh روی `/admin/merchants` و مشابه | بدون 404 |
| 8 | نصب PWA روی موبایل | آیکن و نصب درست |

### تست OTP از خط فرمان

```bash
curl -s https://api.yourdomain.ir/auth/otp/request \
  -H 'content-type: application/json' \
  -d '{"mobile":"09121234567","portal":"admin"}'
```

اگر `SMS_DRY_RUN=true` است، کد در لاگ سرور (`journalctl -u portal-api`) دیده می‌شود.

---

## ۱۱) به‌روزرسانی بعد از تغییر کد

```bash
cd /var/www/portal
git pull

# API
cd services/api
npm ci
npm run build
npm run migrate          # اگر schema عوض شده
sudo systemctl restart portal-api

# فرانت (مثال همه پنل‌ها)
cd ../apps/client
npm ci
export EXPO_PUBLIC_API_BASE_URL=https://api.yourdomain.ir
npm run export:web:all
sudo cp -r dist-merchant/*  /var/www/portal-web/app/
sudo cp -r dist-admin/*      /var/www/portal-web/admin/
sudo cp -r dist-affiliate/* /var/www/portal-web/partner/
```

---

## ۱۲) پشتیبان‌گیری

**Postgres (روزانه cron):**

```bash
sudo -u postgres pg_dump portal | gzip > /backup/portal-$(date +%F).sql.gz
```

پوشه `/backup` را روی دیسک جدا یا فضای ابری نگه دارید.

**فایل `.env`:** در git نیست — یک کپی امن آفلاین داشته باشید.

---

## ۱۳) عیب‌یابی رایج

| مشکل | علت محتمل | راه‌حل |
| --- | --- | --- |
| UI آینه‌ای / ناو برعکس | `dir="rtl"` روی `<html>` | از بیلد فعلی repo استفاده کنید (`dir="ltr"` عمدی است) |
| CORS error در مرورگر | `CORS_ORIGINS` ناقص | هر سه URL https پنل را اضافه کنید |
| OTP نمی‌آید | ippanel / dry-run | لاگ API را ببینید؛ کلید و الگو را چک کنید |
| ادمین لاگین نمی‌شود | موبایل در allowlist نیست | `ADMIN_MOBILE_ALLOWLIST` |
| 502 روی API | سرویس down | `systemctl status portal-api` |
| 404 بعد از refresh | SPA fallback نیست | `try_files` در Nginx |

---

## ۱۴) معماری نهایی روی یک VPS

```
                    ┌─────────────────────────────────────┐
  Internet (HTTPS)  │            Ubuntu VPS               │
        │           │                                     │
        ▼           │  Nginx :443                         │
   api.*  ──────────┼──► proxy → Node API :8080 (systemd) │
   app.*  ──────────┼──► static /var/www/portal-web/app   │
   admin.* ─────────┼──► static .../admin                 │
   partner.* ───────┼──► static .../partner               │
                    │                                     │
                    │  PostgreSQL :5432 (localhost only)  │
                    └─────────────────────────────────────┘
                              │
                              ▼
                         ippanel SMS
```

---

## ۱۵) محدودیت‌های فعلی (صادقانه)

- UI پنل‌ها هنوز عمدتاً روی **داده mock** است؛ فقط **ورود OTP** به بک‌اند واقعی وصل است.
- اتصال واقعی به ووکامرس / درگاه پرداخت فروشگاه در `apps/api` (طراحی) مانده و جدا از `services/api` است.
- برای پروداکشن جدی: مانیتورینگ (Uptime Kuma)، لاگ متمرکز، و WAF را در نظر بگیرید.

اگر دامنه و IP واقعی دارید، همین مراحل را با جایگزینی `yourdomain.ir` انجام دهید.
