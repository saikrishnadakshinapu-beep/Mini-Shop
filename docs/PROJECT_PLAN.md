# Project analysis and implementation plan

## Source requirements

The attached assignment describes a mini e-commerce ordering application. It lists five catalog records and requires searchable product listing, stock-aware cart controls, locally persisted cart state, backend order placement and lookup, a confirmation screen, API error handling, duplicate-submit prevention, responsive UI, and README documentation of AI use. Its technology section permits Angular and accepts in-memory or JSON storage. The user's request takes precedence on stack choices: this implementation uses Angular, Node.js, Express, and MongoDB through Mongoose.

The PDF says authentication, payments, and deployment are not required. No user accounts or payment flow are included.

## Feature checklist

- [x] Product catalog initialized from the five records in the PDF.
- [x] `GET /api/products`, including case-insensitive search.
- [x] Product name, INR price, availability, and stock displayed in the Angular storefront.
- [x] Out-of-stock products cannot be added; available stock bounds cart quantities.
- [x] Add, remove, increment, and decrement cart items.
- [x] Subtotal and grand total update from current database prices.
- [x] Cart quantities persist in `localStorage` and are reconciled against refreshed inventory.
- [x] `POST /api/orders` validates IDs and quantities, calculates totals server-side, reserves stock, and creates a unique order number.
- [x] `GET /api/orders/:id` returns a placed order by database ID or order number.
- [x] Confirmation view shows order number, items, quantities, and final total.
- [x] Duplicate submissions are disabled while an order is being placed.
- [x] Frontend and API loading, empty, validation, and error states.
- [x] Responsive storefront and cart layout.
- [x] README setup, MongoDB setup, test commands, AI usage, and submission notes.
- [x] Include a captured storefront screenshot after launching the application in a browser.

## Architecture

```text
Angular standalone app
  ├─ Shop page: searchable catalog and cart
  ├─ Order confirmation route
  ├─ Product/Order REST client
  └─ Signal-based cart state persisted to localStorage
          │ /api (Angular dev proxy)
          ▼
Express REST API
  ├─ product and order routes/controllers
  ├─ validation and centralized error middleware
  ├─ MongoDB connection/configuration
  └─ Mongoose product and order models
          │
          ▼
MongoDB: products, orders
```

## Data model

- **Product**: MongoDB `_id`, `name` (required, unique), `price` (integer INR), `stock` (non-negative integer), timestamps. The seed script inserts missing catalog products without resetting stock on later runs.
- **Order**: MongoDB `_id`, `orderNumber` (unique and derived from the assigned ObjectId), immutable item snapshots (`productId`, `name`, `unitPrice`, `quantity`, `lineTotal`), `subtotal`, `total`, timestamps. There are no taxes or shipping charges in the assignment, so total equals subtotal.

## REST API

| Method | Path | Behavior |
| --- | --- | --- |
| GET | `/api/health` | API and database readiness |
| GET | `/api/products?q=` | Catalog; optional case-insensitive name search |
| POST | `/api/orders` | Validate and place an order; returns the order and its unique ID |
| GET | `/api/orders/:id` | Read by MongoDB ID or order number |

All API errors use `{ "error": { "code": "...", "message": "..." } }` and an appropriate HTTP status. Order creation reads prices from MongoDB and uses conditional stock decrements to avoid overselling. If a later reservation or order insert fails, earlier decrements are compensated. For a multi-document crash-proof transaction, MongoDB must run as a replica set; the provided simple local setup uses the standalone-compatible compensation flow.

## Folder structure

```text
backend/
  src/config/       MongoDB connection
  src/controllers/  product and order handlers
  src/middleware/   centralized error responses
  src/errors/       shared HTTP errors
  src/models/       Mongoose schemas
  src/routes/       REST route registration
  src/services/     stock reservation and order business rules
  scripts/          idempotent catalog seed
  test/             API integration tests
frontend/
  src/app/core/     API and cart services, shared types
  src/app/pages/    storefront and order confirmation
  src/styles.css    responsive design tokens and global styles
docs/
  PROJECT_PLAN.md
  screenshots/      submission screenshot(s)
```

