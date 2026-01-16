import { NextResponse } from 'next/server'
import ICAL from 'ical.js'
import { propertyConfig } from '@/config/property'
import { fromZonedTime, toZonedTime, formatInTimeZone } from 'date-fns-tz'

// Helper function to parse a single iCal feed
async function parseICalFeed(icalUrl: string, australianTimezone: string): Promise<{ blockedDates: string[], eventCount: number }> {
  const blockedDates: string[] = []
  
  try {
    const response = await fetch(icalUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
      next: {
        revalidate: 3600, // Revalidate every hour (cache for 1 hour)
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch iCal feed: ${response.statusText}`)
    }

    const icalData = await response.text()

    // Parse the iCal data
    const jcalData = ICAL.parse(icalData)
    const comp = new ICAL.Component(jcalData)
    const vevents = comp.getAllSubcomponents('vevent')

    vevents.forEach((vevent) => {
      const event = new ICAL.Event(vevent)
      const startDate = event.startDate.toJSDate()
      const endDate = event.endDate.toJSDate()

      // Convert dates to Australian timezone
      const checkInAU = toZonedTime(startDate, australianTimezone)
      const endDateAU = toZonedTime(endDate, australianTimezone)

      // Get the date string in Australian timezone (YYYY-MM-DD)
      // This ensures we're working with the correct day regardless of server timezone
      const checkInDateStr = formatInTimeZone(startDate, australianTimezone, 'yyyy-MM-dd')
      const endDateStr = formatInTimeZone(endDate, australianTimezone, 'yyyy-MM-dd')
      
      // Parse back to Date objects for the start of day in Australian timezone
      const [checkInYear, checkInMonth, checkInDay] = checkInDateStr.split('-').map(Number)
      const checkIn = new Date(Date.UTC(checkInYear, checkInMonth - 1, checkInDay))
      
      const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number)
      const checkOut = new Date(Date.UTC(endYear, endMonth - 1, endDay))
      
      // In iCal format, endDate is typically exclusive (represents the day after check-out)
      // So if check-in is Jan 5 and check-out is Jan 10, the event is Jan 5-11 (exclusive)
      // We need to block Jan 5-10 (check-in to check-out inclusive)
      // Subtract 1 day from checkOut since it's exclusive
      const blockEndDate = new Date(checkOut)
      blockEndDate.setUTCDate(blockEndDate.getUTCDate() - 1)
      
      // Only block dates from check-in onwards (never before check-in)
      const currentDate = new Date(checkIn)
      while (currentDate <= blockEndDate) {
        // Format date in Australian timezone as YYYY-MM-DD
        const dateStr = formatInTimeZone(currentDate, australianTimezone, 'yyyy-MM-dd')
        if (!blockedDates.includes(dateStr)) {
          blockedDates.push(dateStr)
        }
        currentDate.setUTCDate(currentDate.getUTCDate() + 1)
      }
    })

    return { blockedDates, eventCount: vevents.length }
  } catch (error) {
    console.error(`Error parsing iCal feed ${icalUrl}:`, error)
    // Return empty result instead of throwing - allows other feeds to still work
    return { blockedDates: [], eventCount: 0 }
  }
}

export async function GET() {
  try {
    // Get iCal URLs from config or environment variable
    // Support both single URL (backward compatibility) and multiple URLs
    let icalUrls: string[] = []
    
    if (propertyConfig.icalUrls && propertyConfig.icalUrls.length > 0) {
      icalUrls = propertyConfig.icalUrls
    } else if (process.env.NEXT_PUBLIC_ICAL_URL) {
      icalUrls = [process.env.NEXT_PUBLIC_ICAL_URL]
    } else if (process.env.NEXT_PUBLIC_ICAL_URLS) {
      // Support comma-separated URLs in environment variable
      icalUrls = process.env.NEXT_PUBLIC_ICAL_URLS.split(',').map(url => url.trim())
    }

    if (icalUrls.length === 0) {
      return NextResponse.json(
        { error: 'No iCal URLs configured' },
        { status: 400 }
      )
    }

    // Australian timezone (Victoria uses Australia/Melbourne)
    const australianTimezone = 'Australia/Melbourne'

    // Fetch and parse all iCal feeds in parallel
    const feedResults = await Promise.all(
      icalUrls.map(url => parseICalFeed(url, australianTimezone))
    )

    // Merge all blocked dates from all feeds
    const allBlockedDates = new Set<string>()
    let totalEventCount = 0
    const feedStatus: { url: string; success: boolean; eventCount: number }[] = []

    feedResults.forEach((result, index) => {
      result.blockedDates.forEach(date => allBlockedDates.add(date))
      totalEventCount += result.eventCount
      feedStatus.push({
        url: icalUrls[index],
        success: result.eventCount > 0 || result.blockedDates.length > 0,
        eventCount: result.eventCount
      })
    })

    // Convert Set to sorted array
    const blockedDates = Array.from(allBlockedDates).sort()

    return NextResponse.json({
      blockedDates,
      lastUpdated: new Date().toISOString(),
      eventCount: totalEventCount,
      feedCount: icalUrls.length,
      feedStatus, // Include status of each feed for debugging
    })
  } catch (error) {
    console.error('Error fetching iCal feeds:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch calendar data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

