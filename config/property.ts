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
  photoSections?: Array<{
    id: string;
    title: string;
    images: string[]; // Use original (non-compressed) `/images/...` paths
  }>;
  testimonials: {
    name: string;
    rating: number;
    comment: string;
    highlight?: string[];
    source?: 'airbnb' | 'booking' | 'vrbo';
    sourceUrl?: string;
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

- 🌊 Just 10 metres to the beach — safe, easy access for children
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
    "Beach Access (10m walk)",
    "Pet Friendly (Pets Welcome)",
  ],
  policies: {
    checkIn: "3:00 PM",
    checkOut: "10:00 AM",
    cancellation:
      "More than 14 days before check-in: full refund. 7–14 days before check-in: 50% refund. Less than 7 days before check-in: no refund.",
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
    "/images/_DSC8041.jpg",
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
  photoSections: [
    {
      id: "exterior",
      title: "Exterior",
      images: ["/images/_DSC8107.jpg"],
    },
    {
      id: "backyard",
      title: "Backyard and Pool",
      images: [
        "/images/_DSC8072.jpg",
        "/images/_DSC8056-2.jpg",
        "/images/_DSC7993-2.jpg",
        "/images/_DSC7989-2.jpg",
        "/images/_DSC8015-2.jpg",
        "/images/_DSC8052-2.jpg",
        "/images/_DSC8041.jpg",
        "/images/IMG_4404.jpg",
        "/images/IMG_4417.jpg",
        "/images/IMG_0126.jpeg",
      ],
    },
    {
      id: "living",
      title: "Living, Dining and Kitchen",
      images: [
        "/images/_DSC7814.jpg",
        "/images/_DSC7790.jpg",
        "/images/_DSC7833.jpg",
        "/images/_DSC7824.jpg",
        "/images/_DSC7940.jpg",
        "/images/_DSC7799.jpg",
        "/images/_DSC7809.jpg",
      ],
    },
    {
      id: "bedrooms",
      title: "Bedrooms",
      images: [
        "/images/_DSC7668.jpg",
        "/images/_DSC7712.jpg",
        "/images/_DSC7732.jpg",
        "/images/_DSC7747.jpg",
        "/images/_DSC7783.jpg",
        "/images/_DSC7772.jpg",
      ],
    },
    {
      id: "bathrooms",
      title: "Bathrooms",
      images: [
        "/images/_DSC7658.jpg",
        "/images/_DSC7718.jpg",
        "/images/_DSC7759.jpg",
        "/images/_DSC7916.jpg",
      ],
    },
    {
      id: "laundry",
      title: "Laundry",
      images: ["/images/_DSC7912.jpg"],
    },
    {
      id: "entertainment",
      title: "Games and Theatre",
      images: [
        "/images/_DSC7896.jpg",
        "/images/_DSC7858.jpg",
        "/images/IMG_4224.JPG",
        "/images/IMG_4449.jpg",
      ],
    },
    {
      id: "views",
      title: "Nearby and Views",
      images: ["/images/IMG_4183.JPG"],
    },
    {
      id: "extras",
      title: "Extras",
      images: ["/images/IMG_0275.jpeg"],
    },
  ],
  testimonials: [
    {
      name: "Stephen",
      rating: 5,
      comment: "Great house for a group of golfers. Nice big screen TV, great kitchen & BBQ area out on the deck. Some of the guys enjoyed the cinema room also. House accommodated our needs perfectly & Jason the host super responsive which made booking & planning nice & easy.",
      highlight: ["big screen TV", "BBQ", "cinema room", "super responsive"],
      source: "airbnb",
      sourceUrl: "https://www.airbnb.com.au/rooms/1043607785247725387",
      date: "November 2025",
    },
    {
      name: "Julia",
      rating: 5,
      comment: "We had the best weekend staying here. The house was a lot of fun and we hardly left as everything was there. It really is a great set up and Jason was the perfect host.",
      highlight: ["best weekend", "lot of fun", "everything was there", "perfect host"],
      source: "airbnb",
      sourceUrl: "https://www.airbnb.com.au/rooms/1043607785247725387",
      date: "October 2025",
    },
    {
      name: "Sam",
      rating: 5,
      comment: "We all had an exceptional stay. The house catered to all ages and interests, which came into its own when one of the days was very rainy.",
      highlight: ["exceptional", "all ages", "very rainy"],
      source: "airbnb",
      sourceUrl: "https://www.airbnb.com.au/rooms/1043607785247725387",
      date: "November 2025",
    },
    {
      name: "Lisa",
      rating: 5,
      comment: "Our stay at Jason's air bnb was absolutely fantastic for our large family. It was the perfect place to celebrate our daughter's 40th birthday and granddaughter's birthday with all our family. Thankyou very much Jason.",
      highlight: ["absolutely fantastic", "large family", "perfect place", "40th birthday"],
      source: "airbnb",
      sourceUrl: "https://www.airbnb.com.au/rooms/1043607785247725387",
      date: "October 2025",
    },
    {
      name: "Andy",
      rating: 5,
      comment: "Amazing house, very clean and you will not run out of things to do! Thank you Jason",
      highlight: ["very clean", "not run out of things to do"],
      source: "airbnb",
      sourceUrl: "https://www.airbnb.com.au/rooms/1043607785247725387",
      date: "October 2025",
    },
    {
      name: "Mohammad",
      rating: 5,
      comment:
        "Excellent house with 100% matching with pictures and descriptions. For a large family with children, it's an exceptional find. The host is very helpful and quick to respond. We thoroughly enjoyed our stay.",
      highlight: ["100% matching", "exceptional", "quick to respond", "large family"],
      source: "airbnb",
      sourceUrl: "https://www.airbnb.com.au/rooms/1043607785247725387/reviews",
      date: "1 day ago",
    },
    {
      name: "Jayne",
      rating: 5,
      comment:
        "Amazing House, it had everything for the kids, very clean, we had a great time would highly recommend it, one of the best houses we have stayed in",
      highlight: ["everything for the kids", "very clean", "highly recommend", "best houses"],
      source: "airbnb",
      sourceUrl: "https://www.airbnb.com.au/rooms/1043607785247725387/reviews",
      date: "4 days ago",
    },
    {
      name: "Osama",
      rating: 5,
      comment:
        "The house is more than amazing for all ages and so elegant. Jason is a great host always reachable and more than a nice person really appreciate what he did for us during our stay. We recommend this house and this host sooo much.",
      highlight: ["amazing", "all ages", "great host", "always reachable"],
      source: "airbnb",
      sourceUrl: "https://www.airbnb.com.au/rooms/1043607785247725387/reviews",
      date: "1 week ago",
    },
    {
      name: "Sara",
      rating: 5,
      comment:
        "This was our second time staying at Jason’s! Such a great location and the house is full of activities for kids and adults of all ages! Also one of the cleanest AirBnb’s we’ve ever stayed at.",
      highlight: ["second time", "great location", "full of activities", "cleanest"],
      source: "airbnb",
      sourceUrl: "https://www.airbnb.com.au/rooms/1043607785247725387/reviews",
      date: "1 week ago",
    },
    {
      name: "Julio",
      rating: 5,
      comment: "Awesome house and host - 10/10",
      highlight: ["Awesome", "host", "10/10"],
      source: "airbnb",
      sourceUrl: "https://www.airbnb.com.au/rooms/1043607785247725387/reviews",
      date: "2 weeks ago",
    },
    {
      name: "Madison",
      rating: 5,
      comment:
        "We were so happy with our stay! Jason was a great host and always responded promptly to any questions we had. The house was perfect in every way, spotlessly clean and filled with so many great amenities. Thank you again for a wonderful stay!",
      highlight: ["responded promptly", "spotlessly clean", "great amenities", "wonderful stay"],
      source: "airbnb",
      sourceUrl: "https://www.airbnb.com.au/rooms/1043607785247725387/reviews",
      date: "2 weeks ago",
    },
    {
      name: "Karen",
      rating: 5,
      comment: "Property had everything we needed for our family getaway.",
      highlight: ["everything we needed", "family getaway"],
      source: "booking",
      sourceUrl: "https://www.booking.com/hotel/au/amazing-backyard-max-entertain-beachside-retreat.en-gb.html",
      date: "Booking.com guest review",
    },
    {
      name: "Piper",
      rating: 5,
      comment: "The facilities were fantastic and made it a great holiday with friends.",
      highlight: ["facilities", "fantastic", "holiday with friends"],
      source: "booking",
      sourceUrl: "https://www.booking.com/hotel/au/amazing-backyard-max-entertain-beachside-retreat.en-gb.html",
      date: "Booking.com guest review",
    },
    {
      name: "Pascale",
      rating: 5,
      comment:
        "Everything was perfect! We came in the middle of winter so weren’t able to use the epic pool but there are so many other activities to do. The kids had a great time and didn’t want to leave!",
      highlight: ["Everything was perfect", "epic pool", "other activities", "didn’t want to leave"],
      source: "booking",
      sourceUrl: "https://www.booking.com/hotel/au/amazing-backyard-max-entertain-beachside-retreat.en-gb.html",
      date: "Booking.com guest review",
    },
  ],
  localArea: {
    title: "Explore the Mornington Peninsula",
    description: "The Mornington Peninsula has long been a favourite destination for coastal holidays and cosy winter escapes. In the warmer months, swimming and surf beaches await whilst seaside restaurants and local markets provide an array of places to eat and drink.",
    attractions: [
      { name: "Beach", distance: "10m walk", type: "beach" },
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


