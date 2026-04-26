# CuratedStack — Auth setup guide

This guide walks through everything you need to do **once** in Supabase
(and OAuth provider dashboards) to turn on Magic Link, OAuth providers,
profiles, submissions, bookmarks, and the admin panel.

---

## 1. Run the SQL migration

Open the Supabase dashboard → **SQL Editor** → paste the entire contents of
[`db/migration-auth-profiles.sql`](../db/migration-auth-profiles.sql) and run.

It is idempotent — safe to re-run.

It creates:
- `profiles`, `app_submissions`, `bookmarks` tables
- `user_role` and `submission_status` enums
- `handle_new_user()` trigger (auto-creates profile on signup)
- RLS policies (users see only their own things; admins see all)
- `approve_submission()` and `reject_submission()` SECURITY DEFINER RPCs
- A trigger preventing non-admins from changing their own role

---

## 2. Create the avatars storage bucket

Dashboard → **Storage** → **New bucket** → name `avatars`, **Public = ON**.

Then SQL Editor:

```sql
CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
CREATE POLICY "avatars_user_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars'
              AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars_user_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars'
         AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars_user_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars'
         AND auth.uid()::text = (storage.foldername(name))[1]);
```

Each user can only write into a folder named after their own user id.

---

## 3. Configure Auth → URL Configuration

Dashboard → **Authentication → URL Configuration**:

- **Site URL**: `https://curatedstack.app`
- **Redirect URLs** (add all that apply):
  - `https://curatedstack.app`
  - `https://curatedstack.app/`
  - `http://127.0.0.1:5173`
  - `http://localhost:5173`

Without these, magic links and OAuth callbacks will be rejected.

---

## 4. Magic Link template (default SMTP for now)

Dashboard → **Authentication → Email Templates → Magic Link**.

Recommended subject:
> Your CuratedStack sign-in link

Recommended body (HTML):

```html
<h2>Sign in to CuratedStack</h2>
<p>Click below to sign in. The link expires in 1 hour.</p>
<p><a href="{{ .ConfirmationURL }}">Sign me in</a></p>
<p>If you didn't request this, you can ignore this email.</p>
<p style="color:#888;font-size:12px">— Boe at CuratedStack</p>
```

> **Heads-up.** Supabase default SMTP has a hard limit of ~2 emails/hour
> and sends from `noreply@mail.app.supabase.io` — fine for testing.
> When you outgrow it, plug in **Brevo** or **Resend** under
> *Project Settings → Auth → SMTP Settings* (no code change needed).

---

## 5. Enable OAuth providers

Dashboard → **Authentication → Sign In / Providers**.

Each provider has the same redirect URL on Supabase's side:

```
https://jereytrwxnuwcvzvqhbg.supabase.co/auth/v1/callback
```

Use that string everywhere a provider asks for an "authorized redirect URI".

### 5.1 Google
1. <https://console.cloud.google.com/> → **APIs & Services → Credentials**.
2. **Create Credentials → OAuth client ID** → *Web application*.
3. **Authorized redirect URIs** → paste the Supabase callback above.
4. Copy *Client ID* and *Client secret* into Supabase → Google provider → **Save**.
5. Toggle **Enable**.

### 5.2 GitHub
1. <https://github.com/settings/developers> → **OAuth Apps → New OAuth App**.
2. **Authorization callback URL** → Supabase callback above.
3. Copy *Client ID* + generated *Client secret* into Supabase → GitHub provider.
4. Toggle **Enable**.

### 5.3 X (Twitter)
1. <https://developer.x.com> → create a Project + App if you don't have one.
2. App settings → **User authentication settings** → enable OAuth 2.0.
3. **Type of App**: *Web App*. **Callback URL**: Supabase callback above.
4. Copy *Client ID* + *Client secret* into Supabase → Twitter provider.
5. Toggle **Enable**.

### 5.4 Apple
Apple is the most fiddly — needs an Apple Developer account ($99/yr).
1. <https://developer.apple.com/account/resources/identifiers/list>
   → **+ → App IDs** → Bundle ID `app.curatedstack.web` (Sign in with Apple ON).
2. **+ → Services IDs** → Identifier e.g. `app.curatedstack.signin`,
   enable *Sign In with Apple*, configure with your Bundle ID,
   *Return URLs* = Supabase callback above.
3. **Keys → +** → enable *Sign In with Apple* → download the `.p8` key.
4. In Supabase Apple provider, set:
   - **Client ID** = the Services ID (`app.curatedstack.signin`)
   - **Secret Key (.p8)** = paste contents of the `.p8`
   - **Key ID** = the 10-char id from Keys list
   - **Team ID** = the 10-char id from your account membership page
5. Toggle **Enable**.

> Tip: ship Google + GitHub first, X + Apple later when you have time
> for the developer-account dance.

---

## 6. Promote yourself to admin (one-time)

After **boecrim@gmail.com** signs in once via magic link:

```sql
UPDATE profiles
   SET role = 'admin'
 WHERE id = (SELECT id FROM auth.users WHERE email = 'boecrim@gmail.com');
```

That's it — refresh the site and the **Admin panel** entry appears in
your profile menu. The non-admin role-change protection trigger means
nobody can self-promote.

---

## 7. Smoke test

1. Open the site → click **Sign in** in the navbar.
2. Drop your e-mail → check inbox → click magic link → you're back, signed in.
3. Click your name → **Profile & saved** → set username, bio, upload avatar.
4. Click **+ Submit a site** → fill the form → submit.
5. Run the admin SQL above (still on first run only).
6. Reload, open profile menu → **Admin panel** → your submission should
   be in *Pending* — click **Approve** → it lands in `apps`.
7. Browse the site → click the bookmark icon on any card → check
   **Profile → Saved** to see it.

If anything fails, browser console + Supabase **Logs → Auth / Postgres**
are your friends.
