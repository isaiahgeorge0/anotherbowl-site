import { NextResponse } from 'next/server';
import {
  getCalendarDateInBusinessZone,
  getCollectionSlotsForReferenceNow,
  getPublicOrderingClosedMessage,
} from '@/lib/openingHours';
import { getMaxOrdersPerCollectionSlotFromDb } from '@/lib/orderingSettings';
import { getTodayCollectionOrderCountsBySlot } from '@/lib/collectionSlotCapacity';

type SlotInfo = { time: string; current: number; max: number; available: boolean; full: boolean };

/**
 * Public: today's collection slot times with capacity. Used to hide full slots at checkout.
 */
export async function GET() {
  const businessDate = getCalendarDateInBusinessZone();
  const slotResult = getCollectionSlotsForReferenceNow();
  const max = await getMaxOrdersPerCollectionSlotFromDb();
  const counts = await getTodayCollectionOrderCountsBySlot(businessDate);

  const shopOpen = slotResult.slots.length > 0;
  const message = shopOpen ? null : (slotResult.message?.trim() ?? getPublicOrderingClosedMessage());

  const slotsWithCapacity: SlotInfo[] = slotResult.slots.map((time) => {
    const current = counts[time] ?? 0;
    const full = current >= max;
    return { time, current, max, available: !full, full };
  });
  const selectableSlots = slotsWithCapacity.filter((slot) => slot.available);

  return NextResponse.json({
    shopOpen,
    message,
    maxPerSlot: max,
    // Public selectable slots only (full slots are intentionally excluded).
    slots: selectableSlots,
  });
}
