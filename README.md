# Nexus PM — Project Management System (Frontend MVP)

A React-based project management dashboard MVP. Built with React + Vite.

## Stack
- **Frontend**: React 18 + Vite
- **Routing**: React Router v6
- **Charts**: Recharts
- **Icons**: Lucide React
- **Planned Backend**: Laravel + MySQL

## Getting Started

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

## Features Implemented

1. **Dashboard** — KPIs, completion chart, category pie, cycle milestones, resource utilization, blockers & achievements
2. **Projects List** — Filterable by status & category, search, resource avatars
3. **Project Detail** — Overview, Milestones timeline, Documents, Payments (management only), Blockers & Achievements
4. **Milestones Page** — Cycle view (15th–15th) + all milestones table
5. **Resources Page** — Utilization bars, tech stack load chart, capacity insights
6. **Categories Page** — Website / Mobile App / AI/ML grouped view

## Role-Based Access (Demo)
Use the role switcher in the top bar to toggle between:
- **Management** — Full access including payment details
- **PM** — Can add blockers and achievements
- **BD** — Project visibility

## Next Steps (Laravel Backend)
- Auth with Sanctum
- Project CRUD APIs
- File uploads (documents)
- Real payment tracking
- Notification system
- MySQL database schema (provided separately)
