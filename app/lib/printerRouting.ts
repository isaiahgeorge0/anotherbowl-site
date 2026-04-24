import type { PrintableDocumentType } from '@/types/printing';

export type PrinterDestination = 'front_of_house' | 'kitchen';

// Scaffold only: this map will later be resolved to real printer endpoints
// (for example WiFi/ESC-POS devices, local print bridge queues, or cloud jobs).
export const PRINTER_ROUTING: Record<PrintableDocumentType, PrinterDestination> = {
  customer_receipt: 'front_of_house',
  kitchen_ticket: 'kitchen',
};
