# iCal Calendar Sync Setup Guide

Your calendar now automatically syncs with your Airbnb (or other booking platform) iCal feed!

## ✅ What's Already Configured

The calendar is set up to automatically sync with your Airbnb iCal feed:
- **iCal URL**: Already added to `config/property.ts`
- **API Route**: Created at `/app/api/calendar/route.ts`
- **Auto-refresh**: Calendar updates every hour automatically

## How It Works

1. **API Route** (`/app/api/calendar/route.ts`):
   - Fetches your iCal feed from Airbnb
   - Parses the calendar events
   - Extracts blocked/booked dates
   - Returns them as an array of dates

2. **Calendar Component** (`/components/Calendar.tsx`):
   - Fetches blocked dates from the API on page load
   - Automatically refreshes every hour
   - Displays booked dates in red
   - Shows available dates in green

## Your Current iCal URL

```
https://www.airbnb.com/calendar/ical/1043607785247725387.ics?t=f6e91ce90efc4043bde9e05d9cbec26a&locale=en-AU
```

This is configured in `config/property.ts` under `propertyConfig.icalUrl`.

## How to Update the iCal URL

### Option 1: Update in Config File

Edit `config/property.ts`:

```typescript
export const propertyConfig: PropertyConfig = {
  // ... other config
  icalUrl: "YOUR_NEW_ICAL_URL_HERE",
}
```

### Option 2: Use Environment Variable

Create or update `.env.local`:

```
NEXT_PUBLIC_ICAL_URL=https://www.airbnb.com/calendar/ical/YOUR_ID.ics?t=YOUR_TOKEN&locale=en-AU
```

The API route will use the environment variable if available, otherwise falls back to the config file.

## Supported Booking Platforms

This solution works with any platform that provides an iCal feed:

- ✅ **Airbnb** (already configured)
- ✅ **Booking.com**
- ✅ **VRBO**
- ✅ **HomeAway**
- ✅ **Google Calendar**
- ✅ **iCloud Calendar**
- ✅ **Any iCal-compatible calendar**

## How to Get iCal URLs from Different Platforms

### Airbnb
1. Go to your Airbnb listing
2. Click "Calendar" → "Sync calendars"
3. Copy the "Export calendar" link (iCal format)

### Booking.com
1. Go to your Booking.com extranet
2. Navigate to "Calendar" → "Sync calendars"
3. Copy the iCal export URL

### Google Calendar
1. Open Google Calendar
2. Click the three dots next to your calendar
3. Select "Settings and sharing"
4. Scroll to "Integrate calendar"
5. Copy the "Public URL to iCal format"

## Testing the Sync

1. **Check API directly**: Visit `http://localhost:3000/api/calendar` in your browser
   - You should see JSON with `blockedDates` array
   - Check `lastUpdated` timestamp

2. **Check Calendar Component**: 
   - Booked dates from Airbnb should appear in red
   - Available dates should appear in green
   - Calendar refreshes automatically every hour

## Troubleshooting

### Calendar not updating?

1. **Check iCal URL is valid**:
   - Try opening the URL directly in your browser
   - You should see iCal format text (starts with `BEGIN:VCALENDAR`)

2. **Check API route**:
   - Visit `http://localhost:3000/api/calendar`
   - Check browser console for errors
   - Check server logs for fetch errors

3. **Check CORS/Network**:
   - Airbnb iCal feeds should be publicly accessible
   - Some platforms may require authentication tokens

### Dates not showing correctly?

- **Time zone issues**: The API converts all dates to UTC
- **Date range**: Only future dates are shown as blocked
- **Cache**: Calendar refreshes every hour, but you can refresh manually

### API returns error?

- Check that the iCal URL is publicly accessible
- Verify the URL hasn't expired (some tokens expire)
- Check server logs for detailed error messages

## Advanced Configuration

### Change Refresh Interval

Edit `components/Calendar.tsx`:

```typescript
// Refresh every 30 minutes instead of 1 hour
const interval = setInterval(fetchBlockedDates, 1800000)
```

### Change Cache Duration

Edit `app/api/calendar/route.ts`:

```typescript
next: {
  revalidate: 1800, // Cache for 30 minutes instead of 1 hour
}
```

### Add Multiple iCal Feeds

You can combine multiple calendars by:
1. Using a calendar sync service (like iCalSync.io)
2. Modifying the API route to fetch multiple feeds
3. Merging the blocked dates arrays

## Security Notes

- ✅ iCal URLs are read-only (they can't modify your calendar)
- ✅ API route uses Next.js caching to reduce requests
- ✅ No sensitive data is exposed
- ⚠️ Keep your iCal URL private (it contains your booking data)

## Next Steps

Your calendar is now syncing! The blocked dates will automatically update:
- When new bookings are made on Airbnb
- Every hour automatically
- When the page is refreshed

No manual updates needed! 🎉

