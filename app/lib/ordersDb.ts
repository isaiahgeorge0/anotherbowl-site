import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import type { BasketItem, CheckoutOrderType, PaymentStatus, PersistedOrder, StaffOrderStatus } from '@/types/order';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'orders.sqlite');

type OrderRow = {
  id: number;
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string;
  orderType: CheckoutOrderType;
  tableNumber: string | null;
  collectionTime: string | null;
  items: string;
  total: number;
  status: StaffOrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
};

let database: Database.Database | null = null;

const getDatabase = () => {
  if (database) return database;

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  database = new Database(DB_PATH);
  database.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orderNumber TEXT NOT NULL UNIQUE,
      customerName TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      orderType TEXT NOT NULL,
      tableNumber TEXT,
      collectionTime TEXT,
      items TEXT NOT NULL,
      total REAL NOT NULL,
      status TEXT NOT NULL,
      paymentStatus TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
  `);

  return database;
};

const mapOrderRow = (row: OrderRow): PersistedOrder => ({
  ...row,
  items: JSON.parse(row.items) as BasketItem[],
});

export const createOrder = (payload: {
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string;
  orderType: CheckoutOrderType;
  tableNumber?: string;
  collectionTime?: string;
  items: BasketItem[];
  total: number;
}) => {
  const db = getDatabase();
  const now = new Date().toISOString();
  const status: StaffOrderStatus = 'new';
  const paymentStatus: PaymentStatus = 'pending';

  const result = db
    .prepare(
      `INSERT INTO orders (
        orderNumber, customerName, email, phone, orderType, tableNumber, collectionTime,
        items, total, status, paymentStatus, createdAt
      ) VALUES (
        @orderNumber, @customerName, @email, @phone, @orderType, @tableNumber, @collectionTime,
        @items, @total, @status, @paymentStatus, @createdAt
      )`
    )
    .run({
      orderNumber: payload.orderNumber,
      customerName: payload.customerName,
      email: payload.email,
      phone: payload.phone,
      orderType: payload.orderType,
      tableNumber: payload.tableNumber ?? null,
      collectionTime: payload.collectionTime ?? null,
      items: JSON.stringify(payload.items),
      total: payload.total,
      status,
      paymentStatus,
      createdAt: now,
    });

  return Number(result.lastInsertRowid);
};

export const listOrders = (): PersistedOrder[] => {
  const db = getDatabase();
  const rows = db.prepare('SELECT * FROM orders ORDER BY createdAt DESC').all() as OrderRow[];
  return rows.map(mapOrderRow);
};

export const updateOrderStatus = (id: number, status: StaffOrderStatus) => {
  const db = getDatabase();
  const result = db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id);
  return result.changes > 0;
};
