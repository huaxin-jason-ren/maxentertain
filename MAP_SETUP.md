# Interactive Map Setup Guide

The interactive map is now implemented in the LocalArea component. There are two options available:

## Option 1: Basic Google Maps Embed (Currently Active) ✅

**Status:** Already working! No setup required.

The current implementation uses a basic Google Maps embed that works without an API key. It shows:
- Property location on an interactive map
- Zoom controls
- Pan and drag functionality
- "Open in Google Maps" button

**Location:** `components/LocalArea.tsx`

## Option 2: Advanced Google Maps JavaScript API (Optional)

For more advanced features (custom markers, multiple locations, directions, etc.), you can upgrade to the Google Maps JavaScript API.

### Setup Steps:

1. **Get a Google Maps API Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the "Maps JavaScript API"
   - Create credentials (API Key)
   - Restrict the API key to your domain (recommended for security)

2. **Add API Key to Environment Variables:**
   Create or update `.env.local` file in the root directory:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

3. **Install Google Maps React Library (Optional):**
   ```bash
   npm install @react-google-maps/api
   ```

4. **Update the Map Component:**
   Replace the iframe embed with the JavaScript API implementation for more control.

### Features Available with JavaScript API:
- Custom markers and icons
- Multiple location markers (for attractions)
- Custom map styling
- Directions and routes
- Street View integration
- Custom info windows
- Drawing tools

## Current Implementation Details

The map currently displays:
- **Location:** 1975 Point Nepean Road, Tootgarook, Victoria 3941, Australia
- **Zoom Level:** 14 (street level)
- **Embed Type:** Basic Google Maps embed (no API key required)

## Troubleshooting

### Map not showing?
- Check your internet connection
- Verify the location string is correct in `config/property.ts`
- Try the "Open in Google Maps" button to verify the location

### Want to customize the map?
- Change zoom level: Modify the `zoom=14` parameter in the iframe src
- Change map type: Add `&maptype=roadmap` or `&maptype=satellite`
- Add markers: Upgrade to JavaScript API option

## Next Steps

The basic embed is working now. If you want to:
- Add markers for nearby attractions
- Customize map styling
- Add directions functionality
- Show multiple locations

Consider upgrading to the Google Maps JavaScript API option.

