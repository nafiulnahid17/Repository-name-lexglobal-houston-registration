# LexGlobal BD × University of Houston Law Center — Final Registration System

## Public registration URL
Recommended:
`https://lexglobalbd.live/houston-registration/`

## Admin URL
Recommended:
`https://lexglobalbd.live/houston-registration/admin.html`

## Files
- `index.html` — approved public UI, one screen at a time
- `app.js` — live Supabase submission + receipt upload
- `admin.html` — private dashboard
- `admin.js` — admin login, view, verify, confirm, reject, CSV export
- `config.js` — Supabase URL + anon/public key
- `supabase_setup.sql` — database, storage, RLS security policies
- `README.md`

## What participant data is saved
- Full name
- Email
- Mobile
- WhatsApp
- Profession
- Institution/organization
- District
- Country
- Facebook link
- Preferred communication method
- Payment method
- Transaction ID/reference
- Payment number (bKash/Nagad)
- Amount
- Currency
- Payment date/time
- Optional receipt screenshot/PDF
- Promo code
- Payment status
- Registration status
- Submission time

## WhatsApp Community
Already connected:
https://chat.whatsapp.com/HaNnQfi3PbZ0zgtFDhwXe4

## Payment details already configured
bKash Send Money: 01885603359
Nagad Send Money: 01303498506

BRAC Bank PLC
Account Name: MD. NAHID ALOM
Account Number: 1073658180001
Branch: RAJSHAHI BRANCH
Routing: 060811934
SWIFT: BRAKBDDH

Redot Pay ID: 1164960686
Redot amount: USD 2.50

## Supabase setup

1. Create a Supabase project.
2. Open Supabase → SQL Editor.
3. Run all of `supabase_setup.sql`.
4. Open Supabase → Authentication → Users.
5. Create your admin email/password.
6. Copy that user's UUID.
7. Run:

```sql
insert into public.houston_admins(user_id)
values('YOUR_ADMIN_USER_UUID');
```

8. Supabase → Project Settings → API.
9. Copy the Project URL and anon/public key.
10. Put them in `config.js`:

```js
window.LEXGLOBAL_CONFIG = {
  SUPABASE_URL: "https://xxxxx.supabase.co",
  SUPABASE_ANON_KEY: "your-anon-key"
};
```

Never place the Supabase `service_role` key in browser files.

## Hosting

Upload the whole folder contents together under:

`/houston-registration/`

Do not upload only `index.html`; `app.js`, `admin.js`, and `config.js` must be in the same directory.

## Security model

- Public visitors may INSERT registrations.
- Public visitors cannot READ other registrations.
- Receipt storage is private.
- Only authenticated accounts that exist in `houston_admins` can read/update registrations and view signed receipt links.
- Admin credentials are handled by Supabase Auth.

## Final pre-launch test

1. Fill one registration.
2. Submit a test bKash transaction/reference.
3. Upload a test receipt.
4. Confirm success page appears with an LGUH registration ID.
5. Open `admin.html` and sign in.
6. Verify the test registration appears.
7. Open receipt.
8. Test Verify Payment.
9. Test Confirm Registration.
10. Delete the test record from Supabase if desired.
