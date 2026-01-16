# EmailJS Setup Guide

This guide is tailored to **this repo’s current configuration**:

- The inquiry form is implemented in `components/InquiryForm.tsx` and sends these template params:
  - `from_name`, `from_email`, `phone`, `check_in`, `check_out`, `guests`, `message`, `property_name`, `to_email`
- The recipient email used by the site is `config/property.ts` → `propertyConfig.contact.email`
- EmailJS credentials are loaded from `.env.local`:
  - `NEXT_PUBLIC_EMAILJS_SERVICE_ID`
  - `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID`
  - `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY`

If you see **“The recipients address is empty”**, it’s almost always because your EmailJS template’s **To Email** field is blank or not mapped.

## Step 1: Create EmailJS Account

1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Sign up for a free account (free tier includes 200 emails/month)

## Step 2: Add Email Service

1. In the EmailJS dashboard, go to **Email Services**
2. Click **Add New Service**
3. Select **Gmail** (or your preferred email provider)
4. Follow the authorization steps to connect your Gmail account
5. Note your **Service ID** (e.g., `service_xxxxx`)

## Step 3: Create Email Template

1. Go to **Email Templates** in the dashboard
2. Click **Create New Template**
3. Configure the template **header fields**:
   - **To Email** (recipient) — pick ONE:
     - **Option A (simplest)**: set it to your actual email, e.g. `1975pointnepean@gmail.com`
     - **Option B (recommended)**: set it to `{{to_email}}` (the website already sends this)
   - **Reply To** (recommended): set it to `{{from_email}}` so you can reply directly to the guest
   - **From Name** (optional): e.g. `{{property_name}} Website`

4. Use this template structure (matches the params sent by this repo):

**Subject:**
```
New Booking Inquiry - {{property_name}}
```

**Content:**
```
Hello,

You have received a new booking inquiry:

Guest Details:
- Name: {{from_name}}
- Email: {{from_email}}
- Phone: {{phone}}

Booking Details:
- Check-in: {{check_in}}
- Check-out: {{check_out}}
- Number of Guests: {{guests}}

Message:
{{message}}

---
This inquiry was sent from your property rental website.
```

5. Save the template and note your **Template ID** (e.g., `template_xxxxx`)

## Step 4: Get Public Key

1. Go to **Account** > **General**
2. Find your **Public Key** (e.g., `xxxxxxxxxxxxx`)

## Step 5: (Recommended) Restrict Allowed Origins / Domains

Because this site sends email **from the browser**, you should restrict where requests can come from.

In EmailJS:

- Find the setting for **Allowed Origins / Domains** (wording may vary by EmailJS UI)
- Add:
  - `http://localhost:3000` (for local testing)
  - Your production domain (e.g. `https://yourdomain.com`)

## Step 5: Configure Environment Variables

1. Create a `.env.local` file in the root of your project:
   - Create the file manually (recommended), or use your editor to add it.

2. Add your EmailJS credentials:
```
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id_here
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id_here
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key_here
```

3. Replace the placeholder values with your actual IDs
4. **Restart the dev server** after editing `.env.local`:
   - Stop it with `Ctrl+C`
   - Run `npm run dev` again

## Step 6: Test the Form

1. Start your development server:
```bash
npm run dev
```

2. Navigate to the inquiry form
3. Fill out and submit a test inquiry
4. Check your email inbox for the inquiry

## Troubleshooting

### Form not sending emails?
- Verify all environment variables are set correctly
- Check that your Service ID, Template ID, and Public Key are correct
- Ensure your email service is properly connected
- Check the browser console for any error messages

### “The recipients address is empty”
- Fix: in your EmailJS template, set **To Email** to either:
  - your actual email (e.g. `1975pointnepean@gmail.com`), OR
  - `{{to_email}}` (recommended for this repo)

### “Missing EmailJS configuration…”
- Fix: your `.env.local` is missing one of:
  - `NEXT_PUBLIC_EMAILJS_SERVICE_ID`
  - `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID`
  - `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY`
- After changing `.env.local`, **restart** `npm run dev`.

### 403 / blocked origin (or similar)
- Fix: add your site origin(s) to EmailJS **Allowed Origins / Domains**:
  - `http://localhost:3000`
  - your production domain

### Emails going to spam?
- Make sure your email service is properly verified
- Consider using a custom domain email for better deliverability

### Need more emails?
- EmailJS free tier: 200 emails/month
- Paid plans available for higher volumes

## Security Note

The Public Key is safe to expose in client-side code. EmailJS handles security on their end. Never expose your Private Key.





