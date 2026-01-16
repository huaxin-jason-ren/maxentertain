# Luxury Property Rental Website

A beautiful, modern website for managing a single property rental with inquiry form, availability calendar, and stunning UI.

## Features

- 🏠 **Property Information Display**: Showcase bedrooms, bathrooms, amenities, policies, and descriptions
- 📅 **Availability Calendar**: Visual calendar with iCal-compatible date blocking
- 📧 **Inquiry Form**: Serverless form submissions via EmailJS
- 🖼️ **Image Gallery**: Lightbox gallery with smooth transitions
- ⭐ **Guest Testimonials**: Display reviews and ratings
- 🗺️ **Local Area Guide**: Show nearby attractions and points of interest
- 📱 **Fully Responsive**: Beautiful on all devices
- ⚡ **Fast & SEO Optimized**: Built with Next.js 14

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Form Handling**: EmailJS
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd RentalWebApp
```

2. Install dependencies:
```bash
npm install
```

3. Set up EmailJS (for form submissions):
   - Sign up at [EmailJS](https://www.emailjs.com/)
   - Create an email service (connect your Gmail)
   - Create an email template with these variables:
     - `{{from_name}}`
     - `{{from_email}}`
     - `{{phone}}`
     - `{{check_in}}`
     - `{{check_out}}`
     - `{{guests}}`
     - `{{message}}`
   - Get your Service ID, Template ID, and Public Key

4. Create a `.env.local` file in the project root.

5. Add your EmailJS credentials to `.env.local`:
```
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key
```

6. Configure your property:
   - Edit `config/property.ts` with your property details
   - Add your property images to `public/images/`
   - Update blocked dates in `config/property.ts` (blockedDates array)

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## Configuration

### Property Details

Edit `config/property.ts` to customize:
- Property name, location, description
- Bedroom/bathroom counts
- Amenities list
- Policies (check-in/out, cancellation, house rules)
- Testimonials
- Local area attractions
- Contact information

### Blocked Dates

Update the `blockedDates` array in `config/property.ts`:
```typescript
export const blockedDates: string[] = [
  "2024-06-15",
  "2024-06-16",
  // Add more dates in YYYY-MM-DD format
];
```

### Images

1. Add your property images to `public/images/`
2. Update the `images` array in `config/property.ts`:
```typescript
images: [
  "/images/property-1.jpg",
  "/images/property-2.jpg",
  // ... more images
]
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Add your environment variables in Vercel dashboard
4. Deploy!

The site will be live with automatic deployments on every push.

## Customization

### Colors

Edit `tailwind.config.js` to change the luxury color scheme:
```javascript
colors: {
  luxury: {
    gold: '#D4AF37',    // Primary gold color
    dark: '#1a1a1a',    // Dark background
    light: '#f5f5f5',   // Light background
    accent: '#8B7355',  // Accent color
  },
}
```

### Fonts

The site uses:
- **Playfair Display** (serif) for headings
- **Inter** (sans-serif) for body text

Change fonts in `app/layout.tsx` and `tailwind.config.js`.

## Features to Boost Visibility

- ✅ SEO optimized with meta tags
- ✅ Social sharing ready
- ✅ Mobile-first responsive design
- ✅ Fast loading with image optimization
- ✅ Guest testimonials section
- ✅ Local area guide
- ✅ Professional inquiry form

## Support

For issues or questions, please open an issue on GitHub.

## License

MIT License - feel free to use this for your property rental website!





