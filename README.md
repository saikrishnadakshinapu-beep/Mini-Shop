# Shift — MEAN Store Assignment

A responsive mini e-commerce store built from the supplied assignment. The storefront, shopping cart, order API, inventory, and order history use Angular, Express, and MongoDB. The five starting products are seeded into MongoDB from the assignment; the browser never uses a mock catalog.

## What is included

- Searchable catalog with product name, INR price, current stock, and disabled purchase controls for sold-out products.
- Cart with add/remove/increment/decrement controls, quantity limits from live stock, server-backed totals, and `localStorage` persistence.
- Express REST endpoints for product listing, order placement, order lookup, and health status.
- Server-side ID/quantity validation, authoritative price calculation, inventory reservation, unique order numbers, and consistent JSON errors.
- Order confirmation page that reads the saved order back from MongoDB.
- Responsive storefront, loading/empty/error states, and duplicate-click prevention while an order is being submitted.

The implementation choices and requirement traceability are in [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md).

## Stack

- Angular 20 standalone frontend, TypeScript, and custom responsive CSS.
- Node.js 22.12+, Express 5, and Mongoose 9.
- MongoDB for the product catalog and immutable order snapshots.
- REST JSON APIs. No authentication or payment flow is included because the assignment says they are not required.

## Requirements

- Node.js 22.12 or newer (the repository includes `.nvmrc` for 22.12.0).
- npm 10 or newer.
- MongoDB 6 or newer, running locally or at a URI you can access.

## Run locally

1. Install and select Node.js:

   ```bash
   nvm install
   nvm use
   ```

2. Install the workspace dependencies and create the backend environment file:

   ```bash
   npm install
   cp backend/.env.example backend/.env
   ```

   The default connection is `mongodb://127.0.0.1:27017/mean_store`. Change `MONGODB_URI` in `backend/.env` to use another MongoDB instance.

3. Start MongoDB. For a local MongoDB Community installation, from the project root:

   ```bash
   mkdir -p .data/mongodb
   mongod --dbpath .data/mongodb --bind_ip 127.0.0.1 --port 27017
   ```

   Keep this terminal running. If MongoDB is already managed as a service, start that service instead.

4. Seed the catalog once, then start the API in a second terminal:

   ```bash
   npm run seed
   npm run dev:api
   ```

   The seed is idempotent: it adds missing assignment products and leaves existing inventory unchanged.

5. Start Angular in a third terminal and open [http://localhost:4200](http://localhost:4200):

   ```bash
   npm run dev:web
   ```

Angular proxies `/api` to Express at `http://127.0.0.1:3000`, so local development uses same-origin API requests from the browser.

## API

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/health` | API and MongoDB readiness |
| `GET` | `/api/products?q=mouse` | List products; optional case-insensitive name search |
| `POST` | `/api/orders` | Place an order from product IDs and quantities |
| `GET` | `/api/orders/:id` | Fetch an order by MongoDB ID or `orderNumber` |

Example order request:

```json
{
  "items": [
    { "productId": "<MongoDB product id>", "quantity": 2 }
  ]
}
```

Order creation responds with `201` and an order snapshot containing `orderNumber`, product names, unit prices, quantities, line totals, subtotal, and total. The API calculates prices from MongoDB; client-submitted prices are ignored. Total equals subtotal because the assignment specifies no tax or shipping rules. Errors use `{ "error": { "code": "...", "message": "..." } }`.

Inventory is reserved using conditional MongoDB updates so overlapping purchases cannot oversell stock. If a later reservation or order save fails, earlier reservations are restored. For crash-proof multi-document atomicity, configure MongoDB as a replica set and use transactions; the provided standalone local setup uses compensation so it runs without replica-set configuration.

## Verification

With MongoDB running, run the API integration tests against a separate `mean_store_test` database:

```bash
npm test
```

The test setup clears only the `products` and `orders` collections in `mean_store_test`, seeds the catalog, and covers health, search, validation, order creation, stock updates, order lookup, and insufficient stock. To use another isolated test database, set `MONGODB_TEST_URI` before running the tests.

Build both workspaces with:

```bash
npm run build
```

## Deploy the backend on Render

The root `render.yaml` configures a Node web service for the `main` branch. Connect this repository to Render as a Blueprint, then set the `MONGODB_URI` secret to your MongoDB connection string in the service environment. The secret is intentionally not stored in this repository. The service uses `/api/health` as its health check and listens on Render's assigned `PORT`. The frontend calls `https://mini-shop-wcfx.onrender.com/api`; add the deployed frontend origin to Render's comma-separated `FRONTEND_ORIGIN` environment variable if the frontend is hosted on a different origin. Local Angular origins on port 4200 are allowed by default.

Before the service can become healthy, the MongoDB cluster must accept connections from the Render service. The backend does not seed or reset the remote database during deployment; seed the catalog only after confirming the target database is intended for this app.

## AI usage and development notes

- **AI coding tool:** ChatGPT Codex was used to analyze the assignment, plan the MEAN architecture, and write/refine the application and documentation.
- **Representative prompts applied during development:**
  1. “Carefully read the entire PDF and prepare a feature checklist, proposed architecture, database design, API list, and folder structure.”
  2. “Develop the complete, fully functional application using the MEAN stack only.”
  3. “Ensure that the frontend, backend, and MongoDB database work together as one integrated application.”
- **AI-generated work:** project structure, Angular components/services/styles, Express controllers/routes/validation, Mongoose schemas and seed script, integration test code, and this documentation. Product names, prices, starting stock, and required workflows were taken from the supplied assignment. No external product assets or generated catalog data are used.
- **Development issues resolved:** this environment did not have `pypdf` or Poppler's PDF tools available, so I read the two-page assignment by decoding its ReportLab PDF streams with Python's built-in ASCII85 and zlib support. The Angular application builder also aborted in this macOS environment; the supported Webpack browser builder compiles successfully here.
- **With more time:** run a replica-set MongoDB deployment and make stock reservations plus order persistence transactional; add browser-level end-to-end tests and a small inventory-management view if the assignment expands beyond the fixed catalog.

## Submission capture

The assignment requests screenshots or a short demo recording. A storefront screenshot is included at [docs/screenshots/storefront.jpg](docs/screenshots/storefront.jpg).
