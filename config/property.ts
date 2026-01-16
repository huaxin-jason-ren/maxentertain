export interface PropertyConfig {
  name: string;
  location: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  description: string;
  longDescription: string;
  amenities: string[];
  policies: {
    checkIn: string;
    checkOut: string;
    cancellation: string;
    houseRules: string[];
  };
  images: string[];
  imagesCompressed?: string[]; // Compressed versions for faster loading
  testimonials: {
    name: string;
    rating: number;
    comment: string;
    date: string;
  }[];
  localArea: {
    title: string;
    description: string;
    attractions: {
      name: string;
      distance: string;
      type: 'restaurant' | 'attraction' | 'activity' | 'beach' | 'shopping';
    }[];
  };
  pricing?: {
    baseRate: number;
    currency: string;
    seasonalRates?: {
      start: string;
      end: string;
      rate: number;
    }[];
  };
  contact: {
    email: string;
    phone?: string;
    whatsapp?: string;
  };
  socialMedia?: {
    instagram?: string;
    facebook?: string;
  };
  // Booking URLs
  booking?: {
    airbnb?: string; // Airbnb listing URL
    bookingCom?: string; // Booking.com listing URL
    vrbo?: string; // VRBO listing URL
    directBooking?: boolean; // Enable direct booking via inquiry form
  };
  // Awards and recognition
  awards?: {
    title: string;
    year: string;
    category: string;
    image?: string; // Path to award image
  }[];
  // iCal feed URLs for automatic calendar sync (Airbnb, Booking.com, VRBO, etc.)
  icalUrls?: string[];
}

export const propertyConfig: PropertyConfig = {
  name: "MAX Entertain Beachside Retreat - Amazing Backyard",
  location: "1975 Point Nepean Road, Tootgarook, Victoria 3941, Australia",
  bedrooms: 6,
  bathrooms: 7,
  maxGuests: 16,
  description: "Brand new family-owned beachfront retreat featuring 6 bedrooms, 5 ensuites, 2 half bathrooms, a solar-heated pool & jacuzzi, home theatre, BBQ — and just 10 metres from the beach!",
  longDescription: `🏡 About This Space:

Welcome to our beautiful family-owned beachfront retreat, thoughtfully designed for families and groups to relax, reconnect and create lasting memories together. With 6 spacious bedrooms, 5 private ensuites and 2 extra bathrooms, everyone enjoys comfort, privacy and plenty of space — plus a private swimming pool and spa, outdoor BBQ area, home theatre, driving arcade and Nintendo Switch to keep all ages entertained from morning to night.

💛 Why Families Love Staying Here:

- ☀️ A solar-heated swimming pool and warm spa mean fun in the water all year round
- 🔥 Under-tile heating in every bathroom keeps mornings cozy and comfortable
- 🎵 In-ceiling speakers let you enjoy music while cooking, playing or relaxing
- 🛡 A secure, modern home so you can truly relax
- 🌊 The beach is just across the road — perfect for morning walks, sandcastles and sunset strolls

🛏 Comfortable Sleeping for Everyone:

Our home comfortably accommodates large families and groups with:

- 👑 4 King beds for parents and couples
- 🛏 2 Bunk beds for kids and teens
- 🛌 2 Single beds
- 🛋 2 Sofa beds for flexible sleeping
- 🛏 3 cots for the little ones

Everyone has a cozy place to rest after a day of fun.

🍽 Living & Dining:

The home features a fully equipped kitchen, perfect for family meals, plus a warm living room with a gas fireplace for relaxed evenings together.
There is also a private theatre room with a large 120-inch screen for movie nights the whole family will love.

🎉 Endless Entertainment for Kids & Adults:

Your family will enjoy:

- 🏊 A large solar-heated pool
- ♨️ A 6-person spa
- 🎮 Arcade games (racing & shooting)
- 🎮 Nintendo Switch (super mario kart, Mario Party and super smash bros)
- 🎤 Karaoke with JBL sound system
- ⛳ Mini golf
- 🤸 Trampoline
- 🚣 4 varity sized kayaks
- 🎬 Netflix
- 🏓 Table tennis
- 🎱 Pool table
- ⚽ Foosball
- 🎯 Reaction stick machine
- 🎲 Varity range of board games

There’s something for every age — no one will be bored here!

📍 Perfect Family Location:

- 🌊 Just 20 metres to the beach — safe, easy access for children
- ♨️ Only 7–8 minutes to famous hot springs
- 🛍 2 km to Rye town centre
- 🛒 6 minutes to supermarkets & shopping

Everything you need for a stress-free holiday is close by.

🔑 Guest Access:

Your family will enjoy full private use of:

- 🚗 Secure parking
- 🏊 Pool and spa
- 🍳 Kitchen & kitchenette
- 🎬 Theatre room

(Only storage rooms are locked.)

🌙 Other Things to Note:

To ensure everyone enjoys a calm and pleasant stay:

- 🚫 No parties
- 🔇 Outdoor areas close between 11pm – 7am
- 🔊 Noise monitoring is in place
- 🎓 No Schoolies bookings

This helps keep the home safe, quiet and comfortable for families and neighbours alike.`,
  amenities: [
    "Wi-Fi",
    "Air Conditioning",
    "Heating",
    "Kitchen",
    "Fully Equipped Kitchen",
    "Dishwasher",
    "Washing Machine",
    "Dryer",
    "TV",
    "Private Theatre Room",
    "120 inch Projector Screen",
    "Netflix",
    "Parking (8 spaces)",
    "Swimming Pool (Solar Heated)",
    "Hot Tub/Spa (6 person)",
    "Garden",
    "Balcony",
    "BBQ Grill",
    "Coffee Maker",
    "Gas Log Fireplace",
    "In-Ceiling Speakers",
    "Smart Home Tech",
    "Security System",
    "Undertile Heating",
    "Racing Arcade (2 seater)",
    "Shooting Arcade (2 players)",
    "Karaoke System",
    "Mini Golf",
    "Trampoline",
    "Table Tennis",
    "Pool Table",
    "Foosball Table",
    "Sea View",
    "Beach Access (20m walk)",
    "Pet Friendly (Pets Welcome)",
  ],
  policies: {
    checkIn: "3:00 PM",
    checkOut: "10:00 AM",
    cancellation: "Add your trip dates to get the cancellation details for this stay",
    houseRules: [
      "STRICTLY NO PARTIES - Mornington Peninsula Shire Council Short Stay Accommodation Code of Conduct rules apply",
      "Outdoor areas including swimming pools, spas, outdoor decking and balconies are not to be used between 11:00 PM to 7:00 AM",
      "This property is monitored by Noise Alarms",
      "THIS PROPERTY DOES NOT ACCEPT SCHOOLIES",
      "Pets welcome (please disclose at booking and follow house guidelines)",
      "No smoking",
    ],
  },
  images: [
    "/images/_DSC7989-2.jpg",
    "/images/_DSC8052-2.jpg",
    "/images/_DSC8056-2.jpg",
    "/images/_DSC7993-2.jpg",
    "/images/_DSC8015-2.jpg",
    "/images/_DSC8072.jpg",
    "/images/_DSC8107.jpg",
    "/images/_DSC7896.jpg",
    "/images/_DSC7916.jpg",
    "/images/_DSC7940.jpg",
    "/images/_DSC7858.jpg",
    "/images/_DSC7912.jpg",
    "/images/_DSC7814.jpg",
    "/images/_DSC7824.jpg",
    "/images/_DSC7833.jpg",
    "/images/_DSC7783.jpg",
    "/images/_DSC7790.jpg",
    "/images/_DSC7799.jpg",
    "/images/_DSC7809.jpg",
    "/images/_DSC7772.jpg",
    "/images/_DSC7732.jpg",
    "/images/_DSC7747.jpg",
    "/images/_DSC7759.jpg",
    "/images/_DSC7658.jpg",
    "/images/_DSC7668.jpg",
    "/images/_DSC7712.jpg",
    "/images/_DSC7718.jpg",
    "/images/IMG_4404.jpg",
    "/images/IMG_4417.jpg",
    "/images/IMG_4449.jpg",
    "/images/IMG_4183.JPG",
    "/images/IMG_0275.jpeg",
    "/images/IMG_0126.jpeg",
    "/images/IMG_4224.JPG",
  ],
  imagesCompressed: [
    "/images/compressed/_DSC7989-2.jpg",
    "/images/compressed/_DSC8052-2.jpg",
    "/images/compressed/_DSC8056-2.jpg",
    "/images/compressed/_DSC7993-2.jpg",
    "/images/compressed/_DSC8015-2.jpg",
    "/images/compressed/_DSC8072.jpg",
    "/images/compressed/_DSC8107.jpg",
    "/images/compressed/_DSC8041.jpg",
    "/images/compressed/_DSC7896.jpg",
    "/images/compressed/_DSC7916.jpg",
    "/images/compressed/_DSC7940.jpg",
    "/images/compressed/_DSC7858.jpg",
    "/images/compressed/_DSC7912.jpg",
    "/images/compressed/_DSC7814.jpg",
    "/images/compressed/_DSC7824.jpg",
    "/images/compressed/_DSC7833.jpg",
    "/images/compressed/_DSC7783.jpg",
    "/images/compressed/_DSC7790.jpg",
    "/images/compressed/_DSC7799.jpg",
    "/images/compressed/_DSC7809.jpg",
    "/images/compressed/_DSC7772.jpg",
    "/images/compressed/_DSC7732.jpg",
    "/images/compressed/_DSC7747.jpg",
    "/images/compressed/_DSC7759.jpg",
    "/images/compressed/_DSC7658.jpg",
    "/images/compressed/_DSC7668.jpg",
    "/images/compressed/_DSC7712.jpg",
    "/images/compressed/_DSC7718.jpg",
    "/images/compressed/IMG_4404.jpg",
    "/images/compressed/IMG_4417.jpg",
    "/images/compressed/IMG_4449.jpg",
    "/images/compressed/IMG_4183.JPG",
    "/images/compressed/IMG_0275.jpeg",
    "/images/compressed/IMG_0126.jpeg",
    "/images/compressed/IMG_4224.JPG",
  ],
  testimonials: [
    {
      name: "Stephen",
      rating: 5,
      comment: "Great house for a group of golfers. Nice big screen TV, great kitchen & BBQ area out on the deck. Some of the guys enjoyed the cinema room also. House accommodated our needs perfectly & Jason the host super responsive which made booking & planning nice & easy.",
      date: "November 2025",
    },
    {
      name: "Julia",
      rating: 5,
      comment: "We had the best weekend staying here. The house was a lot of fun and we hardly left as everything was there. It really is a great set up and Jason was the perfect host.",
      date: "October 2025",
    },
    {
      name: "Sam",
      rating: 5,
      comment: "We all had an exceptional stay. The house catered to all ages and interests, which came into its own when one of the days was very rainy.",
      date: "November 2025",
    },
    {
      name: "Lisa",
      rating: 5,
      comment: "Our stay at Jason's air bnb was absolutely fantastic for our large family. It was the perfect place to celebrate our daughter's 40th birthday and granddaughter's birthday with all our family. Thankyou very much Jason.",
      date: "October 2025",
    },
    {
      name: "Andy",
      rating: 5,
      comment: "Amazing house, very clean and you will not run out of things to do! Thank you Jason",
      date: "October 2025",
    },
  ],
  localArea: {
    title: "Explore the Mornington Peninsula",
    description: "The Mornington Peninsula has long been a favourite destination for coastal holidays and cosy winter escapes. In the warmer months, swimming and surf beaches await whilst seaside restaurants and local markets provide an array of places to eat and drink.",
    attractions: [
      { name: "Beach", distance: "20m walk", type: "beach" },
      { name: "Peninsular Hot Springs", distance: "8 min drive", type: "attraction" },
      { name: "Alba Thermal Springs and Spa", distance: "7 min drive", type: "attraction" },
      { name: "Rye Center", distance: "2 km", type: "shopping" },
      { name: "Rosebud Plaza", distance: "6 min drive", type: "shopping" },
      { name: "Wineries and Cellar Doors", distance: "Various locations", type: "restaurant" },
      { name: "Golf Courses", distance: "Throughout region", type: "activity" },
    ],
  },
  contact: {
    email: "1975pointnepean@gmail.com",
  },
  // Booking URLs
  booking: {
    airbnb: "https://www.airbnb.com.au/rooms/1043607785247725387",
    bookingCom: "https://www.booking.com/hotel/au/amazing-backyard-max-entertain-beachside-retreat.en-gb.html",
    vrbo: "https://www.vrbo.com/en-au/holiday-rental/p9909000",
    directBooking: true, // Enable direct booking via inquiry form
  },
  // Awards and recognition
  awards: [
    {
      title: "Airbnb Host Awards",
      year: "2024",
      category: "Best Family Friendly Stay",
      image: "/images/awards/airbnb_award.jpg",
    },
  ],
  // iCal feed URLs for automatic calendar sync (Airbnb, Booking.com, VRBO, etc.)
  icalUrls: [
    "https://www.airbnb.com/calendar/ical/1043607785247725387.ics?t=f6e91ce90efc4043bde9e05d9cbec26a&locale=en-AU",
    "http://www.vrbo.com/icalendar/9cd7a512422c4e40b041bbc1ec8d1e96.ics?nonTentative",
    "https://ical.booking.com/v1/export?t=75ccae3a-6fcc-4ff6-a1fc-a3cb216c2ec0",
  ],
};

// Blocked dates for calendar (format: YYYY-MM-DD)
// You can update this or import from iCal
export const blockedDates: string[] = [
  // Example blocked dates
  // "2024-06-15",
  // "2024-06-16",
  // "2024-07-01",
  // "2024-07-02",
];


