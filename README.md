# Action Tracker

A single-page meeting action tracker. Add actions with an owner and due date, group them by owner, tick them off, and see open, done and overdue counts. Data is stored in Supabase (table `public.actions`) and updates live for everyone who has the page open.

## Deploy on Vercel

1. Import this repository in Vercel.
2. Framework Preset: **Other**. Leave the build command and output directory empty.
3. Deploy. `index.html` is served from the root.

## Run locally

Open `index.html` in a browser.

## Note

## Sign-in and users

- Everyone signs in with a username and password (Supabase Auth, `auth.users`). Only signed-in users can see or change actions.
- Behind the scenes a username is stored as `username@example.com`, because Supabase Auth needs an email.
- `public.profiles` holds each user's username and an `is_admin` flag. A database trigger creates the profile automatically when a user is added.
- Admins see a **Users** panel to add a user with an initial password. This calls the `create-user` Edge Function (source in `supabase/functions/create-user/`), which checks the caller is an admin.
- Anyone signed in can change their own password from **Change password**.
- To make someone an admin, set `is_admin = true` on their row in `public.profiles` in the Supabase dashboard.
