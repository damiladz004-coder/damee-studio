# Damee Studio

Damee Studio is a full-stack creative content platform for comics, animation,
and games. The web app is built with Next.js App Router, Tailwind CSS, and
TypeScript. The mobile app is an Expo React Native app. Both clients connect to
Supabase for authentication, database records, and storage.

## Folder Structure

```text
damee-studio/
  app/                    Next.js app routes and API routes
  components/             Shared web UI components
  lib/                    Web Supabase clients, data helpers, and types
  supabase/schema.sql     Database, RLS, triggers, and storage buckets
  apps/mobile/            Expo React Native app
  public/                 Static web assets
```

## Web Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment variables:

```bash
cp .env.example .env.local
```

3. Fill in these values from your Supabase project:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

4. Run the web app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Supabase Setup

1. Create a Supabase project.
2. Open the SQL editor.
3. Run `supabase/schema.sql`.
4. In Authentication settings, enable email/password auth.
5. Storage buckets are created by the schema: `comics`, `videos`, and
   `thumbnails`.
6. To make an admin user, sign up once, then run:

```sql
update public.profiles
set role = 'admin'
where username = 'your-email-prefix';
```

## Mobile Setup

1. Install dependencies from the repo root:

```bash
npm install
```

2. Add the Expo variables to `apps/mobile/.env` or your shell:

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

3. Start Expo:

```bash
npm run mobile
```

Use the Expo Go app or emulator to open the project.

## Current Features

- Responsive dark web app with blue cinematic accent styling.
- Email/password login and signup through Supabase.
- Profile and role model with `admin` and `user` roles.
- Public browse pages for comics, animation, and games.
- Comic reader with scroll pages.
- Animation detail page with video player.
- Game detail pages with launch placeholders.
- Like, comment, and share actions through API routes.
- Referral code tracking and referral count increments.
- Admin upload form for comics, animations, games, thumbnails, and media.
- Expo mobile app with login/signup and shared Supabase content browsing.

## API Routes

- `GET /api/content` returns featured content.
- `POST /api/interactions` records likes and comments.
- `POST /api/referral` records referral usage.
- `POST /api/upload` lets admin users upload content and media.

## Notes

The app includes demo fallback content so it remains browseable before Supabase
credentials are added. Once Supabase is configured, published records from the
database replace the demo library.
