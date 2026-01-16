# Award Badge Setup Guide

## Award Display

Your Airbnb Host Awards badge is now configured and will display in two locations:
1. **Hero Section** - Prominently displayed below the property description
2. **Property Details Section** - Shown at the top of the property details

## Adding the Award Image

If you have the actual award image file, you can add it:

1. **Place the image** in `public/images/awards/` directory:
   ```
   public/images/awards/airbnb-host-awards-2024.png
   ```

2. **Update the config** in `config/property.ts`:
   ```typescript
   awards: [
     {
       title: "Airbnb Host Awards",
       year: "2024",
       category: "Best Family Friendly Stay",
       image: "/images/awards/airbnb-host-awards-2024.png", // Update this path
     },
   ],
   ```

3. **If using an image**, update the components to display it:
   - The current implementation shows a styled badge
   - To use an image instead, replace the badge div with an `<Image>` component

## Current Implementation

The award badge is currently displayed as a styled component with:
- Yellow gradient background (matching Airbnb award colors)
- Airbnb logo icon
- Award text: "Airbnb Host Awards", "Finalist 2024", "Best Family Friendly Stay"

This creates a professional, eye-catching badge that highlights your achievement!

