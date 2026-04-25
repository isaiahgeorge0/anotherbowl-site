import { NextResponse } from 'next/server';
import {
  getCalendarDateInBusinessZone,
  getCollectionSlotsForReferenceNow,
  getPublicOrderingClosedMessage,
  getWeekdayInBusinessZone,
  getDayScheduleForWeekday,
  OPENING_HOURS_SOURCE_NAME,
} from '@/lib/openingHours';
import { getMaxOrdersPerCollectionSlotFromDb } from '@/lib/orderingSettings';
import { getOnlineOrderingPausedFromDb } from '@/lib/orderingSettings';
import { getTodayCollectionOrderCountsBySlot } from '@/lib/collectionSlotCapacity';

type SlotInfo = { time: string; current: number; max: number; available: boolean; full: boolean };

/**
 * Public: today's collection slot times with capacity. Used to hide full slots at checkout.
 */
export async function GET() {
  const serverNow = new Date();
  const businessDate = getCalendarDateInBusinessZone();
  const weekday = getWeekdayInBusinessZone(serverNow);
  const schedule = getDayScheduleForWeekday(weekday);
  const slotResult = getCollectionSlotsForReferenceNow();
  const orderingPaused = await getOnlineOrderingPausedFromDb();
  const max = await getMaxOrdersPerCollectionSlotFromDb();
  const counts = await getTodayCollectionOrderCountsBySlot(businessDate);

  const slotDiagnostics: Array<{
    time: string;
    current: number;
    max: number;
    available: boolean;
    full: boolean;
    filteredReason: string | null;
  }> = slotResult.slots.map((time) => {
    const current = counts[time] ?? 0;
    const full = current >= max;
    return {
      time,
      current,
      max,
      available: !full,
      full,
      filteredReason: full ? 'full-capacity' : null,
    };
  });

  const selectableSlots = slotDiagnostics.filter((slot) => slot.available);
  const shopOpen = !orderingPaused && selectableSlots.length > 0;
  const message = orderingPaused
    ? 'Ordering is currently paused.'
    : shopOpen
      ? null
      : (slotResult.message?.trim() ?? getPublicOrderingClosedMessage());

  if (process.env.NODE_ENV !== 'production') {
    console.log('[api/collection-availability] diagnostics', {
      serverNowIso: serverNow.toISOString(),
      businessDate,
      openingHoursSource: OPENING_HOURS_SOURCE_NAME,
      weekday,
      open: 'open' in schedule ? schedule.open : null,
      close: 'open' in schedule ? schedule.close : null,
      orderingPaused,
      maxOrdersPerSlot: max,
      slotCandidatesFromOpeningHours: slotResult.slots,
      bookedCountsBySlot: counts,
      slotDiagnostics,
      finalReturnedSlotsCount: selectableSlots.length,
      finalReturnedSlots: selectableSlots.map((slot) => slot.time),
      noSlotsReason: message,
    });
  }

  return NextResponse.json({
    shopOpen,
    message,
    maxPerSlot: max,
    // Public selectable slots only (full slots are intentionally excluded).
    slots: selectableSlots,
  });
}
