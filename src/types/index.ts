import React from 'react';

// --- Types ---

export type Tab = 'dashboard' | 'tables' | 'reservations' | 'menu' | 'inventory' | 'staff' | 'kitchen' | 'reports' | 'admin' | 'qr' | 'ai' | 'management' | 'about_us' | 'expenses';
export type OrderItemStatus = 'pending' | 'sent' | 'ready' | 'defective' | 'replaced' | 'returned' | 'cancelled';

export interface SaleMovementRecord {
  id: number;
  orderId?: number;
  productName: string;
  quantity: number;
  tableNumber: string;
  waiterName: string;
  type: 'Silindi' | 'Geri alma' | 'Xarab' | 'Hədiyyə';
  reason?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  timestamp: number;
  shiftId?: string;
  isClosed?: boolean;
}

export interface StaffMember {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  role: string;
  status: 'on-shift' | 'off-shift';
  docNumber?: string;
  phone?: string;
  attendance?: string[]; // Date strings 'YYYY-MM-DD'
  totalSales?: number;
  salary?: number | string;
  dailySalary?: number | string;
}

export interface OrderItem {
  id: number;
  menuId: number;
  name: string;
  price: number;
  quantity: number;
  status: OrderItemStatus;
  notes?: string;
  deleteReason?: string;
  isGift?: boolean;
  isQR?: boolean;
  isCancellationPrinted?: boolean;
  category?: string;
  orderTime?: string;
}

export interface KitchenItem {
  id: number;
  orderId?: number | string;
  dishName: string;
  tableNumber: string;
  waiterName: string;
  timestamp: Date;
  date?: string;
  status: 'preparing' | 'ready' | 'defective' | 'returned' | 'cancelled' | 'delivered' | 'gift';
  notes?: string;
  quantity: number;
  shiftId?: string;
  isClosed?: boolean;
  isGift?: boolean;
}

export interface Table {
  id: number;
  number: string;
  name?: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  orderTotal?: number;
  waiterName?: string;
}

export interface MenuItem {
  id: number;
  name: string;
  price: number;
  category: string;
  status: 'active' | 'hidden';
  image?: string;
}

export interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  minLevel: number;
  costPrice?: number;
  salePrice?: number;
}

export interface ExpenseItem {
  id: number | string;
  title: string;
  category: string;
  amount: number;
  date: string; // YYYY-MM-DD
  operator?: string;
  notes?: string;
  isClosed?: boolean;
  shiftId?: string;
  timestamp?: number;
}

export interface DefectRecord {
  id: number;
  type: 'defective' | 'returned';
  dishName: string;
  price: number;
  quantity: number;
  tableNumber: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss 24h format
  reason: string;
  waiterName?: string;
  timestamp: number;
  isClosed?: boolean;
  shiftId?: string;
}

export interface InventoryTransaction {
  id: number;
  itemId: number;
  itemName: string;
  quantity: number;
  costPrice: number;
  totalCost: number;
  date: string; // YYYY-MM-DD
}

export interface OrderTransaction {
  id: number;
  tableId: number;
  tableName: string;
  amount: number;
  waiterName: string;
  paymentMethod: 'cash' | 'card' | 'mixed' | 'debt' | 'gift';
  cashAmount?: number;
  cardAmount?: number;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  shiftId?: string;
  isClosed?: boolean;
  timestamp?: number;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
    category?: string;
  }>;
}

export interface Reservation {
  id: number;
  customerName: string;
  tableId: number;
  time: string;
  guests: number;
  status: 'confirmed' | 'pending' | 'arrived' | 'completed' | 'cancelled';
  date: string;
}

export interface AdminSecurityTabProps {
  adminPassword: string;
  setAdminPassword: (p: string) => void;
  setIsAdminUnlocked: (u: boolean) => void;
  addAuditLog: (action: string, category: string, details: string, type: 'info' | 'warning' | 'success') => void;
}

export interface TableQRCodeCardProps {
  table: Table;
  appName: string;
  baseUrl: string;
}

export interface QRManagementTabProps {
  tables: Table[];
  appName: string;
}

export interface AzDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  clearable?: boolean;
  format?: 'text' | 'dd.mm.yyyy';
  prefix?: string;
  activeShiftBusinessDate?: string;
}

export interface DraggableWindowProps {
  title: string;
  onClose?: () => void;
  children: React.ReactNode;
  widthClass?: string;
}

export interface DefectReturnsManagementTabProps {
  mode: 'defective' | 'returned';
  defectRecords?: DefectRecord[];
  records?: DefectRecord[];
  onAddRecord: (record: Omit<DefectRecord, 'id' | 'timestamp'>) => void;
  onDeleteRecord?: (id: number) => void;
  menuItems?: MenuItem[];
  tables?: Table[];
  appName?: string;
  closedShifts?: Record<string, any>;
  activeShiftBusinessDate?: string;
  activeShiftId?: string;
  isShiftClosed?: boolean;
  orderTransactions?: any[];
  activeOrders?: Record<string | number, any[]>;
  auditLogs?: any[];
}
