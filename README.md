# Client Dashboard — דאשבורד לקוח

דאשבורד ציבורי להצגת נתוני לידים ללקוחות Webz Digital.  
ללא אותנטיקציה מצד הלקוח — הלינק עצמו הוא הגישה.

## מקור הנתונים

מבוסס על `/api/public` של Monitor — **טבלת `leads` ב-MySQL בלבד**.  
לא תלוי ב-ClickHouse, לא תלוי בטוקני פייסבוק, לא תלוי ב-sync חיצוני.

## קישור לדאשבורד

```
https://dashboard.webzapp.click/dashboard/42
https://dashboard.webzapp.click/dashboard/42?from=2026-01-01&to=2026-04-30
```

כאשר `42` הוא ה-`client_id` של הלקוח במוניטור.

## התקנה

```bash
cp .env.example .env
# ערוך .env עם הסיסמה הנכונה
npm install
npm run dev
```

## Deploy

```bash
npm run build
# העלה dist/ לשרת
```

## קובצי Reference

הפרויקט מסתכל על קוד המוניטור בנתיב:
```
C:\Users\webzt\Documents\Shalev\Monitor\monitor\backend\src\routes\publicApi.js   ← מימוש API
C:\Users\webzt\Documents\Shalev\Monitor\monitor\.wiki\API-REFERENCE.md            ← תיעוד API
C:\Users\webzt\Documents\Shalev\Monitor\monitor\.wiki\DATABASE.md                 ← סכמת DB
```

## תיעוד מלא

ראה `CLAUDE.md` לפרטי build מלאים.
