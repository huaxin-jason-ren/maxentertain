'use client'

import { propertyConfig } from '@/config/property'
// React Icons - Font Awesome for more illustrative icons
import { 
  FaWifi,
  FaSnowflake,
  FaFire,
  FaUtensils,
  FaTshirt,
  FaTv,
  FaCar,
  FaSwimmingPool,
  FaHotTub,
  FaTree,
  FaUmbrellaBeach,
  FaFireAlt,
  FaCoffee,
  FaHome,
  FaSpeakerDeck,
  FaShieldAlt,
  FaGamepad,
  FaTableTennis,
  FaGolfBall,
  FaChild,
  FaTable,
  FaDice,
  FaFilm,
  FaMusic,
  FaMicrophone,
  FaBasketballBall,
  FaStar,
  FaSoap,
  FaVideo
} from 'react-icons/fa'
import { 
  MdLocalParking,
  MdKitchen,
  MdAcUnit,
  MdLocalLaundryService,
  MdMovie,
  MdSecurity,
  MdSmartphone,
  MdSpa
} from 'react-icons/md'
import { SiNetflix } from 'react-icons/si'

const amenityIcons: Record<string, any> = {
  // Internet & Tech
  'Wi-Fi': FaWifi,
  'Smart Home Tech': FaHome,
  'Security System': FaShieldAlt,
  
  // Climate Control
  'Air Conditioning': FaSnowflake,
  'Heating': FaFire,
  'Undertile Heating': FaFire,
  
  // Kitchen & Dining
  'Kitchen': FaUtensils,
  'Fully Equipped Kitchen': MdKitchen,
  'Dishwasher': FaSoap,
  'Coffee Maker': FaCoffee,
  'BBQ Grill': FaFireAlt,
  
  // Laundry
  'Washing Machine': FaTshirt,
  'Dryer': MdLocalLaundryService,
  
  // Entertainment
  'TV': FaTv,
  'Netflix': SiNetflix,
  'Private Theatre Room': FaFilm,
  '120 inch Projector Screen': FaVideo,
  'In-Ceiling Speakers': FaSpeakerDeck,
  'Karaoke System': FaMicrophone,
  
  // Parking & Transportation
  'Parking': FaCar,
  'Parking (8 spaces)': MdLocalParking,
  
  // Outdoor & Recreation
  'Swimming Pool': FaSwimmingPool,
  'Swimming Pool (Solar Heated)': FaSwimmingPool,
  'Hot Tub/Spa': FaHotTub,
  'Hot Tub/Spa (6 person)': MdSpa,
  'Garden': FaTree,
  'Balcony': FaUmbrellaBeach,
  
  // Games & Activities
  'Racing Arcade': FaGamepad,
  'Shooting Arcade': FaGamepad,
  'Table Tennis': FaTableTennis,
  'Pool Table': FaTable,
  'Foosball Table': FaDice,
  'Mini Golf': FaGolfBall,
  'Trampoline': FaChild,
  
  // Home Features
  'Gas Log Fireplace': FaFire,
  'Sea View': FaUmbrellaBeach,
  'Beach Access': FaUmbrellaBeach,
}

const getIcon = (amenity: string) => {
  // Try exact match first
  if (amenityIcons[amenity]) {
    return amenityIcons[amenity]
  }
  
  // Try partial match
  const amenityLower = amenity.toLowerCase()
  for (const [key, Icon] of Object.entries(amenityIcons)) {
    if (amenityLower.includes(key.toLowerCase()) || key.toLowerCase().includes(amenityLower)) {
      return Icon
    }
  }
  
  // Default icon
  return FaStar
}

export default function Amenities() {
  return (
    <section id="amenities" className="section-padding bg-gradient-to-b from-white to-luxury-light">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="heading-primary">Amenities & Features</h2>
          <p className="text-luxury text-gray-600 max-w-2xl mx-auto">
            Everything you need for a comfortable and memorable stay
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {propertyConfig.amenities.map((amenity, index) => {
            const Icon = getIcon(amenity)
            return (
              <div
                key={index}
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer group hover:-translate-y-1 hover:scale-[1.02]"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-luxury-gold/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-luxury-gold/20 transition-colors">
                    <Icon className="text-luxury-gold" size={28} />
                  </div>
                  <span className="text-gray-700 font-medium text-sm md:text-base">
                    {amenity}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

