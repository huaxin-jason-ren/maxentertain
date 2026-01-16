# Quick Start Guide

Get your luxury property rental website up and running in minutes!

## 1. Install Dependencies

```bash
npm install
```

## 2. Configure Your Property

Edit `config/property.ts`:
- Update property name, location, description
- Set bedroom/bathroom counts
- Add your amenities list
- Update policies
- Add testimonials
- Configure contact information

## 3. Add Your Images

1. Add property photos to `public/images/`
2. Update the `images` array in `config/property.ts`:
```typescript
images: [
  "/images/your-image-1.jpg",
  "/images/your-image-2.jpg",
  // ... more images
]
```

## 4. Set Up EmailJS (For Inquiry Form)

Follow the detailed guide in `EMAILJS_SETUP.md` or:

1. Sign up at [emailjs.com](https://www.emailjs.com)
2. Create email service (Gmail)
3. Create email template
4. Get your IDs and keys
5. Create `.env.local`:
```
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key
```

## 5. Set Blocked Dates

Edit `config/property.ts` and update the `blockedDates` array:
```typescript
export const blockedDates: string[] = [
  "2024-06-15",
  "2024-06-16",
  // Add dates in YYYY-MM-DD format
];
```

## 6. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 7. Deploy to Vercel

1. Push to GitHub
2. Import on [vercel.com](https://vercel.com)
3. Add environment variables
4. Deploy!

## Customization Tips

- **Colors**: Edit `tailwind.config.js` → `colors.luxury`
- **Fonts**: Change in `app/layout.tsx` and `tailwind.config.js`
- **Content**: All content is in `config/property.ts` - easy to update!

## Need Help?

- Check `README.md` for detailed documentation
- See `EMAILJS_SETUP.md` for email configuration
- Review the code comments for customization options





