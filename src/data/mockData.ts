import type { 
  Table, 
  MenuItem, 
  InventoryItem, 
  ExpenseItem, 
  DefectRecord, 
  InventoryTransaction, 
  OrderTransaction, 
  Reservation, 
  StaffMember, 
  KitchenItem 
} from '../types';
import { getTodayStr } from '../utils/dateUtils';

export const MOCK_TABLES: Table[] = [
  { id: 1, number: 'Masa 1', capacity: 2, status: 'occupied', orderTotal: 45.50, waiterName: 'Leyla Nuriyeva' },
  { id: 2, number: 'Masa 2', capacity: 4, status: 'available' },
  { id: 3, number: 'Masa 3', capacity: 4, status: 'reserved', waiterName: 'Əhməd Qarayev' },
  { id: 4, number: 'Masa 4', capacity: 6, status: 'occupied', orderTotal: 120.00, waiterName: 'Leyla Nuriyeva' },
  { id: 5, number: 'Masa 5', capacity: 2, status: 'available' },
  { id: 6, number: 'Masa 6', capacity: 4, status: 'available' },
  { id: 7, number: 'Masa 7', capacity: 8, status: 'occupied', orderTotal: 340.00, waiterName: 'Əhməd Qarayev' },
  { id: 8, number: 'Masa 8', capacity: 4, status: 'available' },
  { id: 9, number: 'Masa 9', capacity: 2, status: 'available' },
  { id: 10, number: 'Masa 10', capacity: 6, status: 'available' },
  { id: 11, number: 'Masa 11', capacity: 4, status: 'available' },
  { id: 12, number: 'Masa 12', capacity: 2, status: 'available' },
  { id: 13, number: 'Masa 13', capacity: 4, status: 'available' },
  { id: 14, number: 'Masa 14', capacity: 4, status: 'available' },
  { id: 15, number: 'Masa 15', capacity: 6, status: 'available' },
  { id: 16, number: 'Masa 16', capacity: 2, status: 'available' },
  { id: 17, number: 'Masa 17', capacity: 4, status: 'available' },
  { id: 18, number: 'Masa 18', capacity: 8, status: 'available' },
  { id: 19, number: 'Masa 19', capacity: 2, status: 'available' },
  { id: 20, number: 'Masa 20', capacity: 4, status: 'available' },
];

export const MOCK_MENU: MenuItem[] = [
  { id: 1, name: 'Mərci Şorbası', price: 5.0, category: 'Şorbalar', status: 'active' },
  { id: 2, name: 'Margherita Pizza', price: 12.5, category: 'Pizzalar', status: 'active' },
  { id: 3, name: 'Sezar Salatı', price: 9.0, category: 'Salatlar', status: 'active' },
  { id: 4, name: 'Antrikot', price: 25.0, category: 'Əsas Yeməklər', status: 'active' },
  { id: 5, name: 'Tiramisu', price: 7.0, category: 'Şirniyyatlar', status: 'active' },
  { id: 6, name: 'Ev Sayı Limonad', price: 4.5, category: 'İçkilər', status: 'active' },
];

export const MOCK_INVENTORY: InventoryItem[] = [
  { id: 1, name: 'Un', quantity: 50, unit: 'kq', minLevel: 10, costPrice: 1.20, salePrice: 2.00 },
  { id: 2, name: 'Pendir (Mozzarella)', quantity: 15, unit: 'kq', minLevel: 8, costPrice: 14.50, salePrice: 22.00 },
  { id: 3, name: 'Qara Ət', quantity: 35, unit: 'kq', minLevel: 15, costPrice: 18.00, salePrice: 28.00 },
  { id: 4, name: 'Pomidor', quantity: 40, unit: 'kq', minLevel: 5, costPrice: 2.20, salePrice: 3.50 },
  { id: 5, name: 'Kofe Dənələri', quantity: 12, unit: 'kq', minLevel: 3, costPrice: 25.00, salePrice: 40.00 },
];

export const MOCK_INVENTORY_TRANSACTIONS: InventoryTransaction[] = [
  { id: 101, itemId: 1, itemName: 'Un', quantity: 10, costPrice: 1.20, totalCost: 12.00, date: '2026-06-08' },
  { id: 102, itemId: 2, itemName: 'Pendir (Mozzarella)', quantity: 5, costPrice: 14.50, totalCost: 72.50, date: '2026-06-08' },
  { id: 103, itemId: 3, itemName: 'Qara Ət', quantity: 20, costPrice: 18.00, totalCost: 360.00, date: '2026-06-07' },
  { id: 104, itemId: 4, itemName: 'Pomidor', quantity: 15, costPrice: 2.20, totalCost: 33.00, date: '2026-06-07' },
  { id: 105, itemId: 5, itemName: 'Kofe Dənələri', quantity: 4, costPrice: 25.00, totalCost: 100.00, date: '2026-05-15' },
  { id: 106, itemId: 1, itemName: 'Un', quantity: 30, costPrice: 1.20, totalCost: 36.00, date: '2026-05-20' },
  { id: 107, itemId: 3, itemName: 'Qara Ət', quantity: 10, costPrice: 18.00, totalCost: 180.00, date: '2025-11-10' },
];

export const MOCK_ORDER_TRANSACTIONS: OrderTransaction[] = [
  { 
    id: 201, tableId: 1, tableName: 'Masa 1', amount: 45.50, waiterName: 'Leyla Nuriyeva', paymentMethod: 'cash', date: '2026-06-08', time: '12:45',
    items: [
      { name: 'Kabab Assorti', quantity: 1, price: 32.00, category: 'Milli Yeməklər' },
      { name: 'Təzə Süzmə', quantity: 1, price: 4.50, category: 'Qəlyanaltılar' },
      { name: 'Sərin Qazlı Su', quantity: 3, price: 3.00, category: 'İçkilər' }
    ]
  },
  { 
    id: 202, tableId: 4, tableName: 'Masa 4', amount: 120.00, waiterName: 'Leyla Nuriyeva', paymentMethod: 'card', date: '2026-06-08', time: '14:20',
    items: [
      { name: 'Dana Basdırması', quantity: 2, price: 45.00, category: 'Milli Yeməklər' },
      { name: 'Çoban Salatı', quantity: 2, price: 7.50, category: 'Salatlar' },
      { name: 'Ev Sayğısı Limonad', quantity: 3, price: 5.00, category: 'İçkilər' }
    ]
  },
  { 
    id: 203, tableId: 3, tableName: 'Masa 3', amount: 350.50, waiterName: 'Əhməd Qarayev', paymentMethod: 'cash', date: '2026-06-07', time: '16:10',
    items: [
      { name: 'Şah Plov', quantity: 2, price: 120.00, category: 'Milli Yeməklər' },
      { name: 'Manqal Salatı', quantity: 4, price: 8.00, category: 'Salatlar' },
      { name: 'Meyvə Şirəsi', quantity: 5, price: 7.70, category: 'İçkilər' }
    ]
  },
  { 
    id: 204, tableId: 5, tableName: 'Masa 5', amount: 215.00, waiterName: 'Aysel Əliyeva', paymentMethod: 'card', date: '2026-06-07', time: '18:30',
    items: [
      { name: 'Lülə Kabab', quantity: 10, price: 18.00, category: 'Milli Yeməklər' },
      { name: 'Sərin Ayrand', quantity: 7, price: 5.00, category: 'İçkilər' }
    ]
  },
  { 
    id: 205, tableId: 2, tableName: 'Masa 2', amount: 310.00, waiterName: 'Əhməd Qarayev', paymentMethod: 'cash', date: '2026-05-15', time: '13:15',
    items: [
      { name: 'Dana Basdırması', quantity: 4, price: 45.00, category: 'Milli Yeməklər' },
      { name: 'Meyvə Assortisi', quantity: 2, price: 65.00, category: 'Desertlər' }
    ]
  },
  { 
    id: 206, tableId: 6, tableName: 'Masa 6', amount: 180.20, waiterName: 'Aysel Əliyeva', paymentMethod: 'card', date: '2026-05-20', time: '19:40',
    items: [
      { name: 'Toyuq Çığırtması', quantity: 3, price: 25.00, category: 'Milli Yeməklər' },
      { name: 'Türk Paxlavası', quantity: 5, price: 21.04, category: 'Desertlər' }
    ]
  },
  { id: 207, tableId: 7, tableName: 'Masa 7', amount: 420.00, waiterName: 'Leyla Nuriyeva', paymentMethod: 'cash', date: '2025-11-12', time: '15:00' },
  { id: 208, tableId: 8, tableName: 'Masa 8', amount: 325.10, waiterName: 'Əhməd Qarayev', paymentMethod: 'card', date: '2025-08-22', time: '20:15' },
];

export const MOCK_EXPENSES: ExpenseItem[] = [
  { id: 1, title: 'İşıq və Qaz Kommunal Ödənişi', category: 'Kommunal', amount: 145.00, date: '2026-06-08', operator: 'Sistem Admini', notes: 'İyun ayı kommunal ödənişi' },
  { id: 2, title: 'Təzə Tərəvəz və Ərzaq Təchizatı', category: 'Təchizat', amount: 85.50, date: '2026-06-08', operator: 'Anbardar Tural', notes: 'Nağd bazar alış-verişi' },
  { id: 3, title: 'Mətbəx Avadanlığı Təmiri', category: 'Təmir/Avariya', amount: 60.00, date: '2026-06-07', operator: 'Sistem Admini', notes: 'Sobanın termostat dəyişimi' },
  { id: 4, title: 'Arenda/İcarə Haqqı', category: 'Arenda', amount: 500.00, date: '2026-06-01', operator: 'Sistem Admini', notes: 'Aylıq obyekt icarəsi' }
];

export const MOCK_RESERVATIONS: Reservation[] = [
  { id: 1, customerName: 'İlqar Məmmədov', tableId: 3, time: '19:00', guests: 4, status: 'confirmed', date: getTodayStr() },
  { id: 2, customerName: 'Aysel Əliyeva', tableId: 2, time: '20:30', guests: 2, status: 'pending', date: getTodayStr() },
  { id: 3, customerName: 'Kənan Bağırov', tableId: 5, time: '14:00', guests: 3, status: 'completed', date: getTodayStr() },
  { id: 4, customerName: 'Tural Əliyev', tableId: 8, time: '18:00', guests: 5, status: 'confirmed', date: getTodayStr() },
  { id: 5, customerName: 'Rəşad Nağıyev', tableId: 12, time: '21:00', guests: 2, status: 'pending', date: getTodayStr() },
];

export const MOCK_STAFF: StaffMember[] = [
  { 
    id: 1, 
    name: 'Əhməd Qarayev', 
    firstName: 'Əhməd',
    lastName: 'Qarayev',
    role: 'Aşpaz', 
    status: 'on-shift', 
    docNumber: 'AZE1234567', 
    phone: '+994 50 111 22 33',
    attendance: ['2026-05-25', '2026-05-26', '2026-05-27', '2026-05-28', '2026-05-29', '2026-05-30'],
    totalSales: 0 
  },
  { 
    id: 2, 
    name: 'Leyla Nuriyeva', 
    firstName: 'Leyla',
    lastName: 'Nuriyeva',
    role: 'Ofisiant', 
    status: 'on-shift', 
    docNumber: 'AZE7654321', 
    phone: '+994 55 222 33 44',
    attendance: ['2026-05-26', '2026-05-27', '2026-05-28', '2026-05-29', '2026-05-30'],
    totalSales: 350.50 
  },
  { 
    id: 3, 
    name: 'Səbinə Musayeva', 
    firstName: 'Səbinə',
    lastName: 'Musayeva',
    role: 'Kassir', 
    status: 'off-shift', 
    docNumber: 'AZE9876543', 
    phone: '+994 70 333 44 55',
    attendance: ['2026-05-25', '2026-05-27', '2026-05-28'],
    totalSales: 0 
  },
  { 
    id: 4, 
    name: 'Tural Əliyev', 
    firstName: 'Tural',
    lastName: 'Əliyev',
    role: 'Ofisiant', 
    status: 'on-shift', 
    docNumber: 'AZE3456789', 
    phone: '+994 50 444 55 66',
    attendance: ['2026-05-26', '2026-05-28', '2026-05-29', '2026-05-30'],
    totalSales: 120.00 
  },
  { 
    id: 5, 
    name: 'Günel Məmmədova', 
    firstName: 'Günel',
    lastName: 'Məmmədova',
    role: 'Ofisiant', 
    status: 'on-shift', 
    docNumber: 'AZE9871234', 
    phone: '+994 77 555 66 77',
    attendance: ['2026-05-27', '2026-05-28', '2026-05-29', '2026-05-30'],
    totalSales: 215.00 
  },
];

export const MOCK_KITCHEN: KitchenItem[] = [
  { 
    id: 1, 
    dishName: 'Margherita Pizza', 
    tableNumber: 'Masa 4', 
    waiterName: 'Leyla Nuriyeva', 
    timestamp: new Date(new Date().setHours(12, 30)),
    status: 'ready',
    quantity: 2
  },
  { 
    id: 2, 
    dishName: 'Antrikot', 
    tableNumber: 'Masa 1', 
    waiterName: 'Tural Əliyev', 
    timestamp: new Date(new Date().setHours(13, 15)),
    status: 'preparing',
    quantity: 1,
    notes: 'Medium rare'
  },
  { 
    id: 3, 
    dishName: 'Sezar Salatı', 
    tableNumber: 'Masa 7', 
    waiterName: 'Əhməd Qarayev', 
    timestamp: new Date(new Date().setHours(11, 45)),
    status: 'defective',
    quantity: 1,
    notes: 'Məhsul xarab çıxıb - Geri qaytarılıb'
  }
];

export const MOCK_DEFECT_RECORDS: DefectRecord[] = [
  {
    id: 1,
    type: 'defective',
    dishName: 'Sezar Salatı',
    price: 12.00,
    quantity: 1,
    tableNumber: 'Masa 7',
    date: getTodayStr(),
    time: '11:45:00',
    reason: 'Sousu xarab çıxıb / Tərkibi standartlara uyğun deyil',
    waiterName: 'Əhməd Qarayev',
    timestamp: Date.now() - 3600000 * 3
  },
  {
    id: 2,
    type: 'defective',
    dishName: 'Antrikot Steyk',
    price: 24.00,
    quantity: 1,
    tableNumber: 'Masa 3',
    date: getTodayStr(),
    time: '14:20:15',
    reason: 'Həddindən artıq yanıb / Qoxusu dəyişib',
    waiterName: 'Tural Əliyev',
    timestamp: Date.now() - 3600000 * 2
  },
  {
    id: 3,
    type: 'returned',
    dishName: 'Margherita Pizza',
    price: 14.50,
    quantity: 1,
    tableNumber: 'Masa 4',
    date: getTodayStr(),
    time: '13:10:00',
    reason: 'Müştəri sifarişdən imtina etdi (gecikmə səbəbilə)',
    waiterName: 'Leyla Nuriyeva',
    timestamp: Date.now() - 3600000 * 4
  },
  {
    id: 4,
    type: 'returned',
    dishName: 'Təbii Portağal Şirəsi',
    price: 6.00,
    quantity: 2,
    tableNumber: 'Masa 2',
    date: getTodayStr(),
    time: '15:40:30',
    reason: 'Səhv sifariş / Müştəri istəmədi',
    waiterName: 'Günel Məmmədova',
    timestamp: Date.now() - 3600000 * 1
  }
];
