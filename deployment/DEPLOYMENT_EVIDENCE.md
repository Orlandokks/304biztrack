# BizTrack Deployment Evidence

## Production Deployment

- Platform: Vercel
- Production URL: https://304biztrack.vercel.app/
- Repository URL: https://github.com/Orlandokks/304biztrack
- Verification date: 2026-05-07, Asia/Shanghai

Submission note: this folder keeps deployment evidence together for the repository. When preparing the final coursework ZIP, check whether the required `live-url.txt` and `github-url.txt` files must be copied from this folder to the ZIP root.

## Visual Evidence

### Figure 1. Vercel Production Deployment Ready State

Save the Vercel dashboard screenshot as:

```text
deployment/evidence/vercel-dashboard-ready.png
```

Then use this figure in the report:

![Figure 1. Vercel Deployments dashboard showing the BizTrack production deployment in Ready state.](evidence/vercel-dashboard-ready.png)

Caption: Figure 1. Vercel Deployments dashboard showing the BizTrack production deployment in Ready state.

### Figure 2. Public Production Site

![Figure 2. BizTrack production homepage loaded from the public Vercel URL.](evidence/vercel-live-browser.png)

Caption: Figure 2. BizTrack production homepage loaded from the public Vercel URL in a browser address bar.

## Online Smoke Test

The deployed application was checked from the public Vercel URL. The main HTML pages and static assets returned HTTP 200 responses from Vercel.

| URL | Result |
| --- | --- |
| https://304biztrack.vercel.app/ | 200 OK |
| https://304biztrack.vercel.app/products.html | 200 OK |
| https://304biztrack.vercel.app/orders.html | 200 OK |
| https://304biztrack.vercel.app/finances.html | 200 OK |
| https://304biztrack.vercel.app/styles.css | 200 OK |
| https://304biztrack.vercel.app/products.js | 200 OK |

Representative response headers observed during verification:

```text
HTTP/2 200
server: Vercel
content-type: text/html; charset=utf-8
x-vercel-cache: HIT
```

Browser-level verification was also performed against the public Vercel URL. The checked pages loaded with HTTP 200 responses and no browser console errors or warnings were observed.

| Page | Screenshot |
| --- | --- |
| Production homepage with browser address bar | `deployment/evidence/vercel-live-browser.png` |
| Production homepage, desktop viewport | `deployment/evidence/vercel-home.png` |
| Products page, desktop viewport | `deployment/evidence/vercel-products.png` |
| Products page, mobile viewport | `deployment/evidence/vercel-products-mobile.png` |

## Manual Verification Checklist

- Open the production homepage.
- Navigate to Products, Orders, Expenses, Help, and About.
- Confirm the browser console has no visible JavaScript errors.
- Add, edit, and delete a Product record.
- Add, edit, and delete an Order record.
- Add and delete an Expense record.
- Export Products, Orders, and Expenses as CSV.
- Capture screenshots of the Vercel project dashboard showing the Production deployment in Ready state.
- Capture screenshots of the deployed application URL opened in the browser.

## Report Caption Suggestions

Figure X. BizTrack production deployment on Vercel showing the deployed site at https://304biztrack.vercel.app/.

Figure X. Vercel deployment dashboard showing the Production deployment status as Ready.

Figure X. Public BizTrack Products page loaded from the Vercel production URL.
