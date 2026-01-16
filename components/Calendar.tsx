'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar as CalendarIcon, RefreshCw } from 'lucide-react'
import { blockedDates as defaultBlockedDates } from '@/config/property'
import { format, startOfMonth, endOfMonth, addMonths, subMonths, isPast, isToday, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'
import { toZonedTime, formatInTimeZone } from 'date-fns-tz'

export default function Calendar() {
  // Australian timezone (Victoria uses Australia/Melbourne)
  const australianTimezone = 'Australia/Melbourne'
  
  // Get current date in Australian timezone
  const nowAU = toZonedTime(new Date(), australianTimezone)
  const [currentMonth, setCurrentMonth] = useState(nowAU)
  const [blockedDates, setBlockedDates] = useState<string[]>(defaultBlockedDates)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  
  // Get the calendar view (from Monday of first week to Sunday of last week)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }) // Monday = 1
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 }) // Sunday
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const isBlocked = (date: Date) => {
    // Format date in Australian timezone
    const dateStr = formatInTimeZone(date, australianTimezone, 'yyyy-MM-dd')
    return blockedDates.includes(dateStr)
  }

  // Helper to get date string in Australian timezone
  const getDateStrAU = (date: Date) => {
    return formatInTimeZone(date, australianTimezone, 'yyyy-MM-dd')
  }
  
  // Get today's date string in Australian timezone
  const getTodayStrAU = () => {
    return formatInTimeZone(new Date(), australianTimezone, 'yyyy-MM-dd')
  }

  const isAvailable = (date: Date) => {
    // Compare dates in Australian timezone
    const dateStr = getDateStrAU(date)
    const todayStr = getTodayStrAU()
    const isPastDate = dateStr < todayStr
    return !isPastDate && !isBlocked(date)
  }
  
  const isPastDate = (date: Date) => {
    const dateStr = getDateStrAU(date)
    const todayStr = getTodayStrAU()
    return dateStr < todayStr
  }
  
  const isTodayDate = (date: Date) => {
    const dateStr = getDateStrAU(date)
    const todayStr = getTodayStrAU()
    return dateStr === todayStr
  }

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  // Fetch blocked dates from iCal feed
  useEffect(() => {
    const fetchBlockedDates = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/calendar')
        
        if (response.ok) {
          const data = await response.json()
          setBlockedDates(data.blockedDates || [])
          setLastUpdated(data.lastUpdated || null)
        } else {
          console.warn('Failed to fetch calendar data, using default blocked dates')
          setBlockedDates(defaultBlockedDates)
        }
      } catch (error) {
        console.error('Error fetching calendar:', error)
        setBlockedDates(defaultBlockedDates)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBlockedDates()
    
    // Refresh every hour
    const interval = setInterval(fetchBlockedDates, 3600000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section id="calendar" className="section-padding bg-white">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="heading-primary">Availability Calendar</h2>
          <p className="text-luxury text-gray-600">
            Check available dates for your stay
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={prevMonth}
                className="p-2 hover:bg-luxury-light rounded-lg transition-colors"
                aria-label="Previous month"
              >
                ←
              </button>
              <h3 className="text-2xl font-serif font-semibold text-luxury-dark">
                {format(currentMonth, 'MMMM yyyy')}
              </h3>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-luxury-light rounded-lg transition-colors"
                aria-label="Next month"
              >
                →
              </button>
            </div>

            {/* Day Names - Monday to Sunday */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-semibold text-gray-600 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day) => {
                const blocked = isBlocked(day)
                const available = isAvailable(day)
                const past = isPastDate(day)
                const today = isTodayDate(day)
                const isCurrentMonth = day >= monthStart && day <= monthEnd

                return (
                  <div
                    key={day.toString()}
                    className={`
                      aspect-square rounded-lg transition-all
                      ${!isCurrentMonth ? 'opacity-30' : ''}
                      ${past 
                        ? 'bg-gray-100 text-gray-400' 
                        : blocked
                        ? 'bg-red-100 text-red-600'
                        : available
                        ? 'bg-green-50 text-green-700'
                        : 'bg-gray-50 text-gray-400'
                      }
                      ${today ? 'ring-2 ring-luxury-gold' : ''}
                      flex items-center justify-center font-medium
                    `}
                  >
                    {format(day, 'd')}
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-8 pt-8 border-t">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-50 border border-green-200"></div>
                <span className="text-sm text-gray-700">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-100"></div>
                <span className="text-sm text-gray-700">Booked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-100"></div>
                <span className="text-sm text-gray-700">Past</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded ring-2 ring-luxury-gold bg-white"></div>
                <span className="text-sm text-gray-700">Today</span>
              </div>
            </div>

            {/* Note about iCal sync */}
            <div className="mt-6 p-4 bg-luxury-light rounded-lg">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <CalendarIcon size={16} />
                <span>
                  Calendar syncs with other booking platforms. Blocked dates are automatically updated. 
                </span>
                {isLoading && (
                  <RefreshCw className="animate-spin ml-2" size={14} />
                )}
              </div>
              {lastUpdated && !isLoading && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  Last updated: {format(new Date(lastUpdated), 'MMM d, yyyy h:mm a')}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

