'use client'

import Calendar from '@/components/Calendar'
import InquiryForm from '@/components/InquiryForm'
import { useAvailability } from '@/hooks/useAvailability'

export default function AvailabilityInquirySync() {
  const { blockedDates, isLoading, lastUpdated } = useAvailability()

  return (
    <>
      <Calendar blockedDates={blockedDates} isLoading={isLoading} lastUpdated={lastUpdated} />
      <InquiryForm blockedDates={blockedDates} />
    </>
  )
}

