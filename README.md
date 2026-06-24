# VENU

A restaurant reservation platform for Ghana with an AI concierge.

**Live:** [venu-gold.vercel.app](https://venu-gold.vercel.app)

## The Problem

Dining out in Ghana means scrolling through fragmented Instagram pages, WhatsApp groups, and word-of-mouth recommendations, then calling to check availability. There's no single place to discover restaurants, read honest reviews, browse menus with real prices, and book a table. Restaurant owners manage reservations through notebooks, DMs, and missed calls, losing customers to friction they can't even measure.

Venu solves this by giving diners a single platform to discover, evaluate, and reserve, and giving restaurant owners a dashboard to manage their menus and reservations in real time. The AI concierge collapses the entire discovery-to-booking process into a single conversation.

## Features

- **Discover** restaurants by cuisine, location, price, and rating
- **Browse menus** with real prices in cedis
- **Read and write reviews** from real diners
- **Save favorites** for quick access
- **Reserve a table** instantly with date, time, and party size
- **Alfred AI concierge** powered by Gemini. Ask for a recommendation in plain language and Alfred finds the restaurant and books it for you
- **Owner dashboard** to manage menus, view reservations, and update restaurant details
- **Admin panel** for user management, role assignments, review moderation, and platform stats

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js serverless functions |
| Database | PostgreSQL (Neon) |
| AI | Google Gemini 2.5 Flash |
| Auth | JWT (HS256) + bcrypt |
| Hosting | Vercel |

## Project Structure

```
api/
  [...path].js          Catch-all serverless function (router)
lib/
  db.js                 PostgreSQL connection pool
  jwt.js                JWT sign/verify helpers
  sanitize.js           Input sanitization
  handlers/
    admin.js            Admin stats, user/review/restaurant management
    ai.js               Alfred AI concierge (Gemini integration)
    auth.js             Login, registration, profile updates
    menus.js            Menu and menu item CRUD
    profile.js          User profile retrieval
    reservations.js     Reservation create, cancel, status updates
    restaurants.js      Restaurant listing, details, reviews, favorites
src/
  homepage/             Landing page
  login/                Login and signup pages
  dashboard/            Restaurant discovery with search, filters, and Alfred
  restaurant/           Restaurant detail and owner management
  profile/              User profile
  admin/                Admin panel
  config.js             API base URL config
  footer.css            Shared footer styles
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `GEMINI_API_KEY` | Google Gemini API key (for Alfred) |

## Local Development

```bash
npm install
```

Create a `.env` file in the project root:

```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
GEMINI_API_KEY=your-gemini-key
```

Run the dev server:

```bash
vercel dev
```

The app will be available at `http://localhost:3000`.

## User Roles

| Role | Capabilities |
|------|-------------|
| **Customer** | Browse restaurants, write reviews, save favorites, make reservations, chat with Alfred |
| **Owner** | All customer capabilities plus manage owned restaurant details, menus, and incoming reservations |
| **Admin** | All capabilities plus user management, role assignments, review moderation, restaurant creation, and platform statistics |

## API Routes

All API endpoints are served under `/api/`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /users | Register |
| POST | /users/login | Login |
| PATCH | /users/:id | Update profile |
| GET | /profile | Get current user profile |
| GET | /restaurants | List restaurants |
| GET | /restaurants/:id | Restaurant detail |
| GET | /restaurants/:id/reviews | List reviews |
| POST | /restaurants/:id/reviews | Add review |
| PATCH | /restaurants/:id | Update restaurant (owner) |
| POST | /favorites/toggle | Toggle favorite |
| GET | /restaurants/:id/menus | List menus |
| POST | /menus | Create menu |
| PUT | /menus/:id | Update menu |
| DELETE | /menus/:id | Delete menu |
| GET | /menus/:id/items | List menu items |
| POST | /menus/:id/items | Add menu item |
| DELETE | /menus/:id/items/:itemId | Remove menu item |
| POST | /reservations | Create reservation |
| GET | /reservations/user | User's reservations |
| GET | /reservations/restaurant/:id | Restaurant's reservations (owner) |
| DELETE | /reservations/:id | Cancel reservation |
| PATCH | /reservations/:id/status | Update status (owner) |
| POST | /alfred/ask | Chat with Alfred |
| GET | /admin/stats | Platform statistics |
| GET | /admin/users | List users |
| DELETE | /admin/users/:id | Delete user |
| POST | /admin/users/:id/role | Assign role |
| GET | /admin/reviews | List all reviews |
| DELETE | /admin/reviews/:id | Delete review |
| GET | /admin/all_restaurants | List all restaurants |
| POST | /admin/restaurants | Create restaurant |
