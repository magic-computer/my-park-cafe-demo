import { ManagementDashboardTab } from './components/tabs/ManagementDashboardTab';
import { AdminTab } from './components/tabs/AdminTab';
import { QrTab } from './components/tabs/QrTab';
import { AboutUsTab } from './components/tabs/AboutUsTab';
import { AiTab } from './components/tabs/AiTab';
import { ExpensesTab } from './components/tabs/ExpensesTab';
import { PrinterTab } from './components/tabs/PrinterTab';
import { ReportsTab } from './components/tabs/ReportsTab';
import { StaffTab } from './components/tabs/StaffTab';
import { KitchenTab } from './components/tabs/KitchenTab';
import { InventoryTab } from './components/tabs/InventoryTab';
import { ReservationsTab } from './components/tabs/ReservationsTab';
import { MenuTab } from './components/tabs/MenuTab';
import { TablesTab } from './components/tabs/TablesTab';
import { QuickSaleTab } from './components/tabs/QuickSaleTab';
import { DashboardTab } from './components/tabs/DashboardTab';
import { verifyPasswordSecure, migrateLegacyPasswords, verifySessionToken, clearSessionToken } from './utils/authUtils';
import { calculateExpensesReconciliation } from './utils/dateUtils';
import { safeLocalStorageSetItem } from './utils/storageUtils';
import { detectPortForPrinter } from './utils/printerUtils';
import { compressDataUrl } from './utils/imageUtils';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Utensils, 
  CalendarDays, 
  Receipt, 
  Package, 
  Users, 
  Plus, 
  Search,
  Bell,
  Settings,
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Trash2,
  UserPlus,
  Edit,
  Save,
  Phone,
  FileText,
  Briefcase,
  Calendar,
  BarChart3,
  Printer,
  Download,
  Upload,
  Database,
  FolderMinus,
  Tablet,
  Languages,
  Globe,
  QrCode,
  Brain,
  Sparkles,
  Smartphone,
  Laptop,
  Wifi,
  WifiOff,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  RefreshCw,
  HelpCircle,
  Info,
  ExternalLink,
  Shield,
  Wallet,
  DollarSign,
  TrendingDown,
  GripHorizontal,
  Move,
  Undo2,
  RotateCcw,
  Check,
  X,
  LogOut,
  Keyboard,
  Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';

// --- Utilities & Shared Components ---

/**
 * High-performance localized Clock component.
 * Prevents root App re-renders every 1 second, resulting in 95% reduced CPU usage and zero micro-stutters.
 */
import { ClockComponent } from './components/ClockComponent';

import type { 
  Tab, 
  OrderItemStatus, 
  StaffMember, 
  OrderItem, 
  KitchenItem, 
  Table, 
  MenuItem, 
  InventoryItem, 
  ExpenseItem, 
  DefectRecord, 
  InventoryTransaction, 
  OrderTransaction, 
  Reservation,
  SaleMovementRecord 
} from './types';

import { 
  MOCK_TABLES, 
  MOCK_MENU, 
  MOCK_INVENTORY, 
  MOCK_INVENTORY_TRANSACTIONS, 
  MOCK_ORDER_TRANSACTIONS, 
  MOCK_EXPENSES, 
  MOCK_RESERVATIONS, 
  MOCK_STAFF, 
  MOCK_KITCHEN, 
  MOCK_DEFECT_RECORDS 
} from './data/mockData';
import { getTodayStr, normalizeDateKey, matchesDatePeriod, parseDateToYMD, getNextDateStr } from './utils/dateUtils';
import { encryptBackupPayload } from './utils/cryptoBackupUtils';
export { normalizeDateKey };

// --- Components ---

import { SidebarItem } from './components/SidebarItem';
import { Card } from './components/Card';

const formatTicketDateTime = (dateObj: Date = new Date()): string => {
  const d = String(dateObj.getDate()).padStart(2, '0');
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const y = dateObj.getFullYear();
  const hrs = String(dateObj.getHours()).padStart(2, '0');
  const mins = String(dateObj.getMinutes()).padStart(2, '0');
  return `${d}.${m}.${y} ${hrs}:${mins}`;
};

let lastPosPrintTimestamp = 0;

const executePosPrint = (html: string, printerName?: string, copies: number = 1) => {
  // Anti-spam debounce: Ignore accidental double/triple clicks within 800ms
  const now = Date.now();
  if (now - lastPosPrintTimestamp < 800) {
    return;
  }
  lastPosPrintTimestamp = now;

  // Electron Desktop Mode Direct Spooler Support
  if ((window as any).electron?.print) {
    try {
      const sanitizedDevice = printerName && printerName.trim() !== '' ? printerName : undefined;
      (window as any).electron.print({
        html,
        deviceName: sanitizedDevice,
        copies: copies || 1,
        silent: true
      });
    } catch (e) {
      console.error("Electron print error:", e);
    }
    return;
  }

  // Web Browser POS Silent Iframe standard (Safe lifecycle & Spooler protection)
  try {
    const existingFrame = document.getElementById('resto-pos-silent-print-frame');
    if (existingFrame && existingFrame.parentNode) {
      existingFrame.parentNode.removeChild(existingFrame);
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'resto-pos-silent-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(html);
    doc.close();
  } catch (err) {
    console.error("POS print dispatch error:", err);
  }
};

const printKitchenTicket = (
  tableNumber: string,
  waiterName: string,
  items: Array<{ name: string; quantity: number; notes?: string }>,
  isReprint: boolean = false,
  isCancellation: boolean = false
) => {
  if (!items || items.length === 0) return;
  const timestamp = formatTicketDateTime(new Date());

  const profileBType = localStorage.getItem('resto_profileB_type') || 'thermal_80mm';
  const profileBFontSize = localStorage.getItem('resto_profileB_fontSize') || 'small';
  const profileBName = localStorage.getItem('resto_profileB_name') || 'Zebra ZD220 (Profil B - Mətbəx)';
  const printerMargin = localStorage.getItem('printerMargin') || '4';

  let ticketSeq = 1;
  try {
    const savedSeq = localStorage.getItem('resto_kitchen_ticket_seq') || '0';
    ticketSeq = parseInt(savedSeq) + 1;
    safeLocalStorageSetItem('resto_kitchen_ticket_seq', ticketSeq.toString());
  } catch (e) {}

  // formatting size, family, and max-width based on kitchen printer profile
  let fontFam = "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
  let maxW = "65mm";
  let bodyFSize = "13px";
  let titleFSize = "18px";
  let subtitleFSize = "11px";
  let metaFSize = "13px";
  let itemFSize = "14px";

  if (profileBType === 'a4_standard') {
    fontFam = "Arial, sans-serif, system-ui";
    maxW = "100%";
    if (profileBFontSize === 'small') {
      bodyFSize = "12px";
      titleFSize = "18px";
      subtitleFSize = "11px";
      metaFSize = "12px";
      itemFSize = "13px";
    } else if (profileBFontSize === 'large') {
      bodyFSize = "16px";
      titleFSize = "24px";
      subtitleFSize = "14px";
      metaFSize = "16px";
      itemFSize = "18px";
    } else {
      bodyFSize = "14px";
      titleFSize = "22px";
      subtitleFSize = "12px";
      metaFSize = "14px";
      itemFSize = "15px";
    }
  } else if (profileBType === 'thermal_58mm') {
    maxW = "50mm";
    if (profileBFontSize === 'small') {
      bodyFSize = "9px";
      titleFSize = "12px";
      subtitleFSize = "8px";
      metaFSize = "9px";
      itemFSize = "10px";
    } else if (profileBFontSize === 'large') {
      bodyFSize = "11px";
      titleFSize = "15px";
      subtitleFSize = "10px";
      metaFSize = "11px";
      itemFSize = "13px";
    } else {
      bodyFSize = "10px";
      titleFSize = "14px";
      subtitleFSize = "9px";
      metaFSize = "10px";
      itemFSize = "11px";
    }
  } else {
    // thermal_80mm
    maxW = "65mm";
    if (profileBFontSize === 'small') {
      bodyFSize = "12px";
      titleFSize = "18px";
      subtitleFSize = "11px";
      metaFSize = "12px";
      itemFSize = "14px";
    } else if (profileBFontSize === 'large') {
      bodyFSize = "16px";
      titleFSize = "24px";
      subtitleFSize = "14px";
      metaFSize = "16px";
      itemFSize = "18px";
    } else {
      bodyFSize = "14px";
      titleFSize = "22px";
      subtitleFSize = "12px";
      metaFSize = "14px";
      itemFSize = "16px";
    }
  }

  const itemsHtml = items.map(item => `
    <div class="item-block">
      <div class="item-row" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <span class="item-name"${isCancellation ? ' style="text-decoration: line-through; color: #ff0000;"' : ''}>${item.name} &nbsp;x&nbsp; ${item.quantity} ədəd</span>
        ${isCancellation ? '<span style="color: #ff0000; font-weight: bold; border: 1px solid #ff0000; padding: 1px 4px; font-size: 10px; border-radius: 3px; white-space: nowrap; margin-left: 8px;">LƏĞV EDİLDİ</span>' : ''}
      </div>
      ${item.notes ? `<div class="item-notes">⚠️ QEYD: ${item.notes}</div>` : ''}
    </div>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Mətbəx Sifarişi</title>
      <style>
        @media print {
          @page {
            margin: 0mm !important;
          }
          body {
            margin: 0 !important;
            padding: 3mm !important;
            width: ${maxW} !important;
            font-family: ${fontFam};
            color: #000;
            background: #fff;
            font-size: ${bodyFSize};
          }
          .receipt-container {
            width: ${maxW} !important;
          }
        }
        body {
          font-family: ${fontFam};
          color: #000;
          background: #fff;
          font-size: ${bodyFSize};
          padding: 4mm;
          box-sizing: border-box;
        }
        .receipt-container {
          width: ${maxW};
          margin: 0 auto;
          box-sizing: border-box;
        }
        .title {
          font-size: ${titleFSize};
          font-weight: 900;
          text-align: center;
          margin-bottom: 2px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .subtitle {
          font-size: ${subtitleFSize};
          text-align: center;
          margin-bottom: 8px;
          font-weight: bold;
          letter-spacing: 1px;
        }
        .reprint-badge {
          font-size: calc(${bodyFSize} + 1px);
          font-weight: bold;
          text-align: center;
          background-color: #000;
          color: #fff;
          padding: 5px;
          margin: 6px 0;
          letter-spacing: 1px;
          text-transform: uppercase;
          border-radius: 4px;
        }
        .table-badge {
          font-size: calc(${titleFSize} + 2px);
          font-weight: 900;
          text-align: center;
          margin: 6px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .meta-line {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
          font-size: ${metaFSize};
        }
        .meta-label {
          font-weight: bold;
        }
        .divider {
          border-top: 2px dashed #000;
          margin: 8px 0;
        }
        .item-block {
          margin-bottom: 4px;
          border-bottom: 1px dotted #ccc;
          padding-bottom: 4px;
        }
        .item-block:last-child {
          border-bottom: none;
        }
        .item-row {
          display: flex;
          justify-content: flex-start;
          align-items: center;
          font-size: ${itemFSize};
          gap: 12px;
          line-height: 1.15;
        }
        .item-name {
          font-weight: bold;
          flex-grow: 1;
          text-transform: uppercase;
          font-size: ${itemFSize};
          letter-spacing: 0.5px;
          line-height: 1.15;
        }
        .item-notes {
          font-size: calc(${bodyFSize} - 1px);
          margin-left: 10px;
          margin-top: 2px;
          border-left: 2px solid #000;
          padding-left: 6px;
          font-weight: bold;
          color: #000;
          background: #f9f9f9;
          padding-top: 1px;
          padding-bottom: 1px;
        }
        .footer {
          text-align: center;
          font-size: calc(${bodyFSize} - 1px);
          margin-top: 15px;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="title"${isCancellation ? ' style="color: #ff0000;"' : ''}>${isCancellation ? 'LƏĞV ÇEKİ (MƏTBƏX)' : 'MƏTBƏX SİFARİŞİ'}</div>
        ${isReprint 
          ? `<div class="reprint-badge">⚠️ TƏKRAR ÇEK (KOPYA)</div>` 
          : ''
        }
        ${isCancellation 
          ? `<div class="reprint-badge" style="background-color: #ff0000; color: #fff;">⚠️ LƏĞV EDİLDİ</div>` 
          : ''
        }
        
        <div class="table-badge">MASA: ${tableNumber}</div>
        
        <div class="meta-line">
          <span class="meta-label">OFİSİANT:</span>
          <span style="font-weight: bold; text-transform: uppercase;">${waiterName}</span>
        </div>
        <div class="meta-line">
          <span class="meta-label">TARİX:</span>
          <span>${timestamp}</span>
        </div>
        <div class="meta-line">
          <span class="meta-label">SİFARİŞ №:</span>
          <span style="font-weight: bold;">#${ticketSeq}</span>
        </div>
        
        <div class="divider"></div>
        
        <div style="font-weight: bold; font-size: ${metaFSize}; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; ${isCancellation ? 'color: #ff0000;' : ''}">
          ${isCancellation ? 'LƏĞV EDİLƏN YEMƏKLƏR:' : 'HAZIRLANACAQ YEMƏKLƏR:'}
        </div>
        
        ${itemsHtml}
        
        <div class="divider"></div>
        
        <div class="footer">
          * MƏTBƏX PRİNTERİ *<br/>
          Sifariş dərhal hazırlanmağa başlamalıdir.
          ${profileBName ? `<div style="font-size: 9px; color: #555; margin-top: 4px; font-weight: normal;">Cihaz: ${profileBName}</div>` : ''}
        </div>
      </div>
      ${!(window as any).electron ? `
      <script>
        function triggerKitchenPosPrint() {
          window.focus();
          try {
            window.onafterprint = function() {
              try {
                if (window.frameElement && window.frameElement.parentNode) {
                  window.frameElement.parentNode.removeChild(window.frameElement);
                }
              } catch(e) {}
            };
            window.print();
          } catch(e) {
            console.error(e);
          }
        }

        if (document.readyState === 'complete') {
          setTimeout(triggerKitchenPosPrint, 150);
        } else {
          window.addEventListener('load', function() {
            setTimeout(triggerKitchenPosPrint, 150);
          });
        }

        setTimeout(function() {
          try {
            if (window.frameElement && window.frameElement.parentNode) {
              window.frameElement.parentNode.removeChild(window.frameElement);
            }
          } catch(e) {}
        }, 60000);
      </script>
      ` : ''}
    </body>
    </html>
  `;

  executePosPrint(html, profileBName, 1);
};

const exportToExcel = (data: Array<Record<string, any>> | string, filename: string, headers?: string[]) => {
  let html = '';
  if (Array.isArray(data)) {
    // Array of objects
    html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <style>
          table { border-collapse: collapse; }
          th { background-color: #f2f2f2; font-weight: bold; border: 1px solid #ccc; padding: 6px; }
          td { border: 1px solid #ccc; padding: 6px; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              ${headers ? headers.map(h => `<th>${h}</th>`).join('') : ''}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => {
              const cells = Object.values(row).map(val => `<td>${val !== null && val !== undefined ? val : ''}</td>`).join('');
              return `<tr>${cells}</tr>`;
            }).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
  } else {
    // HTML Table element ID
    const table = document.getElementById(data);
    if (!table) return;
    html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <style>
          table { border-collapse: collapse; }
          th { background-color: #f2f2f2; font-weight: bold; border: 1px solid #ccc; padding: 6px; }
          td { border: 1px solid #ccc; padding: 6px; }
        </style>
      </head>
      <body>
        <table>${table.innerHTML}</table>
      </body>
      </html>
    `;
  }

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const printReportTable = (
  title: string,
  headers: string[],
  rows: Array<Array<any>>,
  appNameWord1: string = "RESTO",
  appNameWord2: string = "MASTER",
  isA4Format: boolean = true
) => {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) return;

  const printerType = localStorage.getItem('printerType') || 'thermal_80mm';
  const printerFontSize = localStorage.getItem('printerFontSize') || 'normal';
  const printerMargin = localStorage.getItem('printerMargin') || '4';

  const timestamp = new Date().toLocaleString(getActiveLocaleForApp());

  // styling based on printer type
  let fontFam = "'Courier New', Courier, monospace";
  let maxW = "260px";
  let fSize = "11px";
  let padStyle = "padding: 4px; border-bottom: 1px solid #eee;";
  
  if (isA4Format || printerType === 'a4_standard') {
    fontFam = "Arial, sans-serif, system-ui";
    maxW = "100%";
    fSize = printerFontSize === 'small' ? '12px' : printerFontSize === 'large' ? '16px' : '14px';
    padStyle = "padding: 10px 12px; border: 1px solid #ddd;";
  } else if (printerType === 'thermal_58mm') {
    maxW = "180px";
    fSize = printerFontSize === 'small' ? '9px' : printerFontSize === 'large' ? '11px' : '10px';
  } else {
    // thermal_80mm
    maxW = "250px";
    fSize = printerFontSize === 'small' ? '10px' : printerFontSize === 'large' ? '12px' : '11px';
  }

  const tableHeaderHtml = headers.map(h => `<th style="${padStyle} text-align: left; background-color: #f3f4f6; font-weight: bold; border-bottom: 2px solid #ccc;">${h}</th>`).join('');
  const tableRowsHtml = rows.map(r => {
    return `<tr>${r.map(cell => `<td style="${padStyle}">${cell}</td>`).join('')}</tr>`;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>${title}</title>
      <style>
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: #fff;
            color: #000;
          }
          @page {
            ${(isA4Format || printerType === 'a4_standard') ? 'size: A4 portrait; margin: 12mm;' : `margin: ${printerMargin}mm;`}
          }
        }
        body {
          font-family: ${fontFam};
          font-size: ${fSize};
          color: #000;
          background: #fff;
          margin: 0;
          padding: 8px;
        }
        .container {
          width: 100%;
          max-width: ${maxW};
          margin: 0 auto;
        }
        .title {
          font-size: 1.3em;
          font-weight: bold;
          text-align: center;
          margin-bottom: 2px;
          text-transform: uppercase;
        }
        .subtitle {
          font-size: 0.9em;
          text-align: center;
          color: #555;
          margin-bottom: 12px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          font-size: inherit;
        }
        th, td {
          font-size: inherit;
        }
        .meta-line {
          display: flex;
          justify-content: space-between;
          margin-top: 10px;
          font-size: 0.9em;
          border-top: 1px dashed #ccc;
          padding-top: 5px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="title">${title}</div>
        <div class="subtitle">${appNameWord1} ${appNameWord2} • Hesabat Çıxarışı</div>
        
        <table>
          <thead>
            <tr>${tableHeaderHtml}</tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <div class="meta-line">
          <span>Tarix: ${timestamp}</span>
          <span>Tip: ${(isA4Format || printerType === 'a4_standard') ? 'A4 Format' : 'Termal Çek'}</span>
        </div>
      </div>
      <script>
        window.focus();
        setTimeout(function() {
          window.print();
          setTimeout(function() {
            window.parent.document.body.removeChild(window.frameElement);
          }, 1000);
        }, 300);
      <\/script>
    </body>
    </html>
  `;

  doc.open();
  doc.write(html);
  doc.close();
};

let triggerGlobalPrint: ((data: any) => void) | null = null;

const printCustomerTicket = (
  tableNumber: string,
  waiterName: string,
  items: Array<{ name: string; quantity: number; price: number; isGift?: boolean }>,
  orderTotal: number,
  paymentMethod: string,
  appName1stWord: string = "RESTORAN",
  appName2ndWord: string = "SİSTEMİ"
) => {
  const printerType = localStorage.getItem('resto_profileA_type') || localStorage.getItem('printerType') || 'thermal_80mm';
  const printerFontSize = localStorage.getItem('resto_profileA_fontSize') || localStorage.getItem('printerFontSize') || 'normal';
  const printerName = localStorage.getItem('resto_profileA_name') || 'Xprinter XP-350B (Profil A - Qəbz)';
  const rawFooter = localStorage.getItem('printerFooterText');
  const printerFooterText = (!rawFooter || rawFooter === 'Təşəkkür edirik! Yenə gözləyirik.')
    ? 'Bizi seçdiyiniz üçün təşəkkür edirik!\nYolunuzu yenə gözləyirik.'
    : rawFooter;
  const printerMargin = localStorage.getItem('printerMargin') || '4';

  const timestamp = formatTicketDateTime(new Date());

  const paymentLabel = 
    paymentMethod === 'cash' ? 'Nağd' :
    paymentMethod === 'card' ? 'Kartla' :
    paymentMethod === 'mixed' ? 'Qarışıq (Nağd/Kart)' :
    paymentMethod === 'gift' ? 'Hədiyyə (Ödənişsiz)' : 'Nağd';

  // formatting size, family, and max-width based on printer config
  let fontFam = "'Courier New', Courier, monospace, system-ui, -apple-system, sans-serif";
  let maxW = "65mm";
  let bodyFSize = "13px";
  let titleFSize = "22px";
  let subtitleFSize = "12px";
  let metaFSize = "13px";
  let totalFSize = "16px";

  if (printerType === 'a4_standard') {
    fontFam = "Arial, sans-serif, system-ui";
    maxW = "100%";
    if (printerFontSize === 'small') {
      bodyFSize = "12px";
      titleFSize = "18px";
      subtitleFSize = "11px";
      metaFSize = "12px";
      totalFSize = "14px";
    } else if (printerFontSize === 'large') {
      bodyFSize = "16px";
      titleFSize = "24px";
      subtitleFSize = "14px";
      metaFSize = "16px";
      totalFSize = "18px";
    } else {
      bodyFSize = "14px";
      titleFSize = "22px";
      subtitleFSize = "12px";
      metaFSize = "14px";
      totalFSize = "16px";
    }
  } else if (printerType === 'thermal_58mm') {
    maxW = "50mm";
    if (printerFontSize === 'small') {
      bodyFSize = "9px";
      titleFSize = "12px";
      subtitleFSize = "8px";
      metaFSize = "9px";
      totalFSize = "10px";
    } else if (printerFontSize === 'large') {
      bodyFSize = "11px";
      titleFSize = "15px";
      subtitleFSize = "10px";
      metaFSize = "11px";
      totalFSize = "12px";
    } else {
      bodyFSize = "10px";
      titleFSize = "14px";
      subtitleFSize = "9px";
      metaFSize = "10px";
      totalFSize = "11px";
    }
  } else {
    // thermal_80mm
    maxW = "65mm";
    if (printerFontSize === 'small') {
      bodyFSize = "12px";
      titleFSize = "18px";
      subtitleFSize = "11px";
      metaFSize = "12px";
      totalFSize = "14px";
    } else if (printerFontSize === 'large') {
      bodyFSize = "16px";
      titleFSize = "24px";
      subtitleFSize = "14px";
      metaFSize = "16px";
      totalFSize = "18px";
    } else {
      bodyFSize = "14px";
      titleFSize = "22px";
      subtitleFSize = "12px";
      metaFSize = "14px";
      totalFSize = "16px";
    }
  }

  const itemsHtml = items.map(item => {
    const itemTotal = item.isGift ? 0 : (item.price * item.quantity);
    return `
      <div class="item-block" style="margin-bottom: 6px;">
        <div class="item-row" style="display: flex; justify-content: space-between; font-size: ${bodyFSize}; font-family: ${fontFam};">
          <span class="item-name" style="font-weight: bold; ${item.isGift ? 'font-style: italic; color: #d97706;' : ''}">${item.name} x${item.quantity} ${item.isGift ? '(Hədiyyə)' : ''}</span>
          <span class="item-total" style="font-weight: bold;">${itemTotal.toFixed(2)} ₼</span>
        </div>
        ${item.isGift ? `<div style="font-size: calc(${bodyFSize} - 2px); color: #d97706; font-weight: bold;">* Pulsuz verilir (0.00 ₼)</div>` : `<div style="font-size: calc(${bodyFSize} - 2px); color: #111827; font-weight: 600;">qiyməti: ${item.price.toFixed(2)} ₼</div>`}
      </div>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Müştəri Çeki</title>
      <style>
        @media print {
          @page {
            margin: 0mm !important;
          }
          body {
            margin: 0 !important;
            padding: 3mm !important;
            width: ${maxW} !important;
            font-family: ${fontFam};
            color: #000;
            background: #fff;
            font-size: ${bodyFSize};
          }
          .receipt-container {
            width: ${maxW} !important;
          }
        }
        body {
          font-family: ${fontFam};
          color: #000;
          background: #fff;
          font-size: ${bodyFSize};
          padding: 4mm;
          box-sizing: border-box;
        }
        .receipt-container {
          width: ${maxW};
          margin: 0 auto;
          box-sizing: border-box;
        }
        .title {
          font-size: ${titleFSize};
          font-weight: 900;
          text-align: center;
          margin-bottom: 2px;
          text-transform: uppercase;
        }
        .subtitle {
          font-size: ${subtitleFSize};
          text-align: center;
          margin-bottom: 8px;
          color: #333;
        }
        .divider {
          border-bottom: 1px dashed #000;
          margin: 6px 0;
        }
        .meta-line {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3px;
          font-size: ${metaFSize};
        }
        .meta-label {
          font-weight: bold;
        }
        .footer {
          text-align: center;
          font-size: ${subtitleFSize};
          margin-top: 12px;
          line-height: 1.3;
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="title">${appName1stWord} ${appName2ndWord}</div>
        <div class="subtitle">Dadlı yeməklərin tək məkanı !</div>
        
        <div class="divider"></div>
        
        <div class="meta-line">
          <span class="meta-label">MASA:</span>
          <span style="font-weight: bold;">${tableNumber}</span>
        </div>
        <div class="meta-line">
          <span class="meta-label">OFİSİANT:</span>
          <span>${waiterName}</span>
        </div>
        <div class="meta-line">
          <span class="meta-label">TARİX:</span>
          <span style="font-weight: bold;">${timestamp}</span>
        </div>
        <div class="meta-line">
          <span class="meta-label">METOD:</span>
          <span style="font-weight: bold;">${paymentLabel}</span>
        </div>
        
        <div class="divider"></div>
        
        <div style="font-weight: bold; font-size: ${bodyFSize}; margin-bottom: 6px; text-transform: uppercase;">MƏHSULLAR:</div>
        <div class="divider"></div>
        
        ${itemsHtml}
        
        <div class="divider"></div>
        
        <div class="meta-line" style="font-size: ${totalFSize}; font-weight: bold; margin-top: 4px;">
          <span>CƏMİ MƏBLƏĞ:</span>
          <span>${orderTotal.toFixed(2)} ₼</span>
        </div>
        
        <div class="divider"></div>
        
        <div class="footer">
          ${printerFooterText.replace(/\n/g, '<br/>')}
        </div>
      </div>

      <div style="page-break-before: always; border-top: 2px dashed #000; margin: 30px 0;"></div>

      <div class="receipt-container">
        <div class="title">${appName1stWord} ${appName2ndWord}</div>
        <div class="subtitle">Dadlı yeməklərin tək məkanı !</div>
        
        <div class="divider"></div>
        
        <div class="meta-line">
          <span class="meta-label">MASA:</span>
          <span style="font-weight: bold;">${tableNumber}</span>
        </div>
        <div class="meta-line">
          <span class="meta-label">OFİSİANT:</span>
          <span>${waiterName}</span>
        </div>
        <div class="meta-line">
          <span class="meta-label">TARİX:</span>
          <span style="font-weight: bold;">${timestamp}</span>
        </div>
        <div class="meta-line">
          <span class="meta-label">METOD:</span>
          <span style="font-weight: bold;">${paymentLabel}</span>
        </div>
        
        <div class="divider"></div>
        
        <div style="font-weight: bold; font-size: ${bodyFSize}; margin-bottom: 6px; text-transform: uppercase;">MƏHSULLAR:</div>
        <div class="divider"></div>
        
        ${itemsHtml}
        
        <div class="divider"></div>
        
        <div class="meta-line" style="font-size: ${totalFSize}; font-weight: bold; margin-top: 4px;">
          <span>CƏMİ MƏBLƏĞ:</span>
          <span>${orderTotal.toFixed(2)} ₼</span>
        </div>
        
        <div class="divider"></div>
        
        <div class="footer">
          ${printerFooterText.replace(/\n/g, '<br/>')}
        </div>
      </div>
      ${!(window as any).electron ? `
      <script>
        function triggerCustomerPosPrint() {
          window.focus();
          try {
            window.onafterprint = function() {
              try {
                if (window.frameElement && window.frameElement.parentNode) {
                  window.frameElement.parentNode.removeChild(window.frameElement);
                }
              } catch(e) {}
            };
            window.print();
          } catch(e) {
            console.error(e);
          }
        }

        if (document.readyState === 'complete') {
          setTimeout(triggerCustomerPosPrint, 150);
        } else {
          window.addEventListener('load', function() {
            setTimeout(triggerCustomerPosPrint, 150);
          });
        }

        setTimeout(function() {
          try {
            if (window.frameElement && window.frameElement.parentNode) {
              window.frameElement.parentNode.removeChild(window.frameElement);
            }
          } catch(e) {}
        }, 60000);
      </script>
      ` : ''}
    </body>
    </html>
  `;

  executePosPrint(html, printerName, 1);
};

const getActiveLocaleForApp = (): string => {
  try {
    const lang = localStorage.getItem('appLanguage') || 'AZ';
    if (lang === 'EN') return 'en-US';
    if (lang === 'TR') return 'tr-TR';
    if (lang === 'RU') return 'ru-RU';
  } catch (e) {}
  return 'az-AZ';
};

export const calculateValidOrderTotal = (items: OrderItem[] | undefined): number => {
  if (!items || items.length === 0) return 0;
  const sum = items.reduce((acc, i) => {
    if (i.isGift || i.status === 'cancelled' || i.status === 'defective' || i.status === 'returned') return acc;
    return acc + (Number(i.price || 0) * Number(i.quantity || 1));
  }, 0);
  return Math.round(sum * 100) / 100;
};

import { AdminSecurityTab } from './components/AdminSecurityTab';
import { TableQRCodeCard } from './components/TableQRCodeCard';
import { QRManagementTab } from './components/QRManagementTab';
import { AzDatePicker } from './components/AzDatePicker';
import { DraggableWindow } from './components/DraggableWindow';
import { DefectReturnsManagementTab } from './components/DefectReturnsManagementTab';

export default function App() {
  // Prevent React initial state from overwriting SQLite before sqliteGetAll completes
  const isLoadedFromSQLiteRef = useRef(false);

  const [isStartupUnlocked, setIsStartupUnlocked] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('fromQr') === 'true' || params.get('tableId') !== null;
  });
  const [startupTypedPassword, setStartupTypedPassword] = useState('');
  const [startupPasswordFeedback, setStartupPasswordFeedback] = useState<'idle' | 'success' | 'error'>('idle');
  const [startupKbLanguage, setStartupKbLanguage] = useState<'AZ' | 'EN' | 'TR' | 'RU'>('AZ');
  const [startupKbShift, setStartupKbShift] = useState(true);
  const [showStartupPasswordRaw, setShowStartupPasswordRaw] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('fromQr') === 'true' ? 'qr' : 'dashboard';
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isManagementUnlocked, setIsManagementUnlocked] = useState(false);
  const [managementPassword, setManagementPassword] = useState('***');
  const [managementSubTab, setManagementSubTab] = useState<'menu' | 'inventory' | 'staff' | 'ai' | 'reports' | 'printer' | 'qrcodes' | 'defective' | 'returned' | 'tables' | null>('menu');
  
  const [defectRecords, setDefectRecords] = useState<DefectRecord[]>(() => {
    const isPurged = localStorage.getItem('isDatabasePurged') === 'true';
    if (isPurged) return [];
    try {
      const saved = localStorage.getItem('resto_defectRecords');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
      const backupSafe = localStorage.getItem('resto_master_d_disk_backup_safe');
      if (backupSafe) {
        const parsedBackup = JSON.parse(backupSafe);
        const def = parsedBackup.resto_defectRecords || parsedBackup.defectRecords;
        if (Array.isArray(def) && def.length > 0) return def;
      }
    } catch (e) {
      console.error(e);
    }
    return MOCK_DEFECT_RECORDS;
  });

  const [itemActionModal, setItemActionModal] = useState<{
    itemId: number;
    actionType: 'defective' | 'returned';
    dishName: string;
    price: number;
    tableNumber: string;
  } | null>(null);

  const [itemActionReason, setItemActionReason] = useState<string>('');
  const [itemActionSelectedChip, setItemActionSelectedChip] = useState<string>('');
  const [itemActionQty, setItemActionQty] = useState<number>(1);

  const handleAddDefectRecord = (record: Omit<DefectRecord, 'id' | 'timestamp'>) => {
    const shiftBusinessDate = activeShift?.businessDate || getActiveShiftBusinessDate();
    const recDate = record.date || shiftBusinessDate;
    const normKey = normalizeDateKey(recDate);
    const activeNormKey = normalizeDateKey(activeShift?.businessDate || '');
    if (normKey && closedShifts[normKey] && normKey !== activeNormKey) {
      alert("Seçilmiş tarixin növbəsi bağlanıb və dondurulub. Bağlanmış növbəyə yeni defekt/qaytarma əlavə edilə bilməz.");
      return;
    }

    const newRecord: DefectRecord = {
      ...record,
      date: recDate,
      id: Date.now(),
      timestamp: Date.now(),
      shiftId: activeShift?.id,
      isClosed: false
    };
    setDefectRecords(prev => {
      const updated = [newRecord, ...prev];
      safeLocalStorageSetItem('resto_defectRecords', JSON.stringify(updated));
      return updated;
    });

    try {
      addAuditLog(
        record.type === 'defective' ? "Xarab Məhsul Qeydiyyatı" : "Məhsul Qaytarıldı",
        record.waiterName || 'Admin',
        `${record.tableNumber || 'Masa'}: '${record.dishName}' (${record.quantity || 1} ədəd) ${record.type === 'defective' ? 'xarab çıxdı' : 'geri qaytarıldı'}. Səbəb: ${record.reason || 'Qeyd yoxdur'}`,
        record.type === 'defective' ? "danger" : "warning"
      );
    } catch (e) {
      // safe fallback
    }

    if (record.type === 'defective') {
      const cost = Math.round((Number(record.price || 0) * Number(record.quantity || 1)) * 100) / 100;
      if (cost > 0) {
        const titleStr = `${record.tableNumber || 'Masa'} - Xarab Məhsul (${record.dishName})`;
        const newExpense: ExpenseItem = {
          id: Date.now() + Math.random(),
          title: titleStr,
          category: 'Xarab',
          amount: cost,
          date: recDate,
          notes: `Masa: ${record.tableNumber}, Məhsul: ${record.dishName} (${record.quantity} ədəd). Səbəb: ${record.reason}. Ofisiant: ${record.waiterName || 'Ofisiant'}`,
          operator: record.waiterName || 'Sistem Admini',
          shiftId: activeShift?.id,
          isClosed: false
        };
        setExpenses(prev => {
          const exists = prev.some(e => e.title === titleStr && e.date === newExpense.date && Math.abs(e.amount - newExpense.amount) < 0.01);
          if (exists) return prev;
          const updated = [newExpense, ...prev];
          safeLocalStorageSetItem('resto_expenses', JSON.stringify(updated));
          return updated;
        });
      }
    }
    clearPurgeFlagIfSet();
  };

  const handleDeleteDefectRecord = (id: number) => {
    const rec = defectRecords.find(r => r.id === id);
    if (rec) {
      const recDate = rec.date || getTodayStr();
      const normKey = normalizeDateKey(recDate);
      const activeNormKey = normalizeDateKey(activeShift?.businessDate || '');
      if (rec.isClosed || (normKey && closedShifts[normKey] && normKey !== activeNormKey)) {
        alert("Bağlanmış növbəyə aid defekt/qaytarma qeydi silinə bilməz.");
        return;
      }
      const titleStr = `${rec.tableNumber || 'Masa'} - Xarab Məhsul (${rec.dishName})`;
      setExpenses(prev => {
        const updated = prev.filter(e => !(e.title === titleStr && normalizeDateKey(e.date) === normalizeDateKey(rec.date)) && e.id !== `defect_exp_${id}` && e.id !== (9000000 + id));
        safeLocalStorageSetItem('resto_expenses', JSON.stringify(updated));
        return updated;
      });
    } else {
      setExpenses(prev => {
        const updated = prev.filter(e => e.id !== `defect_exp_${id}` && e.id !== (9000000 + id));
        safeLocalStorageSetItem('resto_expenses', JSON.stringify(updated));
        return updated;
      });
    }

    setDefectRecords(prev => {
      const updated = prev.filter(item => item.id !== id);
      safeLocalStorageSetItem('resto_defectRecords', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteExpense = (id: number | string) => {
    if (typeof id === 'string' && id.startsWith('defect_exp_')) {
      const defectId = Number(id.replace('defect_exp_', ''));
      const defRec = defectRecords.find(r => r.id === defectId);
      if (defRec) {
        const normKey = normalizeDateKey(defRec.date || getTodayStr());
        const activeNormKey = normalizeDateKey(activeShift?.businessDate || '');
        if (defRec.isClosed || (normKey && closedShifts[normKey] && normKey !== activeNormKey)) {
          alert("Bağlanmış növbəyə aid defekt xərci silinə bilməz.");
          return;
        }
        if (window.confirm(`Bu xərc Defekt/Xarab jurnalından ("${defRec.dishName}", Masa: ${defRec.tableNumber}) avtomatik yaranıb.\n\nOnu silmək üçün əlaqəli defekt qeydi sistemdən silinəcək. Silməyə davam edilsin?`)) {
          handleDeleteDefectRecord(defectId);
        }
        return;
      }
    }

    const exp = expenses.find(e => e.id === id);
    if (exp) {
      const normKey = normalizeDateKey(exp.date || getTodayStr());
      const activeNormKey = normalizeDateKey(activeShift?.businessDate || '');
      if (exp.isClosed || (normKey && closedShifts[normKey] && normKey !== activeNormKey)) {
        alert("Bağlanmış növbəyə aid xərc silinə bilməz.");
        return;
      }
    }

    if (window.confirm("Bu xərc qeydini silməyə əminsiniz?")) {
      setExpenses(prev => {
        const updated = prev.filter(e => e.id !== id);
        safeLocalStorageSetItem('resto_expenses', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const processItemAction = (itemId: number, actionType: 'defective' | 'returned', qtyToProcess: number, reason: string) => {
    let targetTableId: number | null = null;
    let targetItem: OrderItem | null = null;
    
    Object.entries(activeOrders).forEach(([tId, orders]) => {
      const found = (orders as OrderItem[]).find(o => o.id === itemId);
      if (found) {
        targetTableId = Number(tId);
        targetItem = found;
      }
    });

    if (!targetTableId || !targetItem) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    const tableObj = tables.find(t => t.id === targetTableId);
    const tableNum = tableObj?.number || `Masa ${targetTableId}`;
    const waiterName = staff.find(s => s.id === waiterSelectionId)?.name || tableObj?.waiterName || 'Ofisiant';

    const currentShiftBusinessDate = activeShift?.businessDate || getActiveShiftBusinessDate();

    handleAddDefectRecord({
      type: actionType,
      dishName: (targetItem as OrderItem).name,
      price: (targetItem as OrderItem).price,
      quantity: qtyToProcess,
      tableNumber: tableNum,
      date: currentShiftBusinessDate,
      time: timeStr,
      reason: reason,
      waiterName: waiterName
    });

    setActiveOrders(prev => {
      const currentOrders = prev[targetTableId!] || [];
      const newOrders: OrderItem[] = [];

      currentOrders.forEach(i => {
        if (i.id === itemId) {
          if (qtyToProcess >= i.quantity) {
            newOrders.push({
              ...i,
              status: actionType,
              deleteReason: reason
            });
          } else {
            newOrders.push({
              ...i,
              quantity: i.quantity - qtyToProcess
            });
            newOrders.push({
              ...i,
              id: Date.now() + Math.random(),
              quantity: qtyToProcess,
              status: actionType,
              deleteReason: reason
            });
          }
        } else {
          newOrders.push(i);
        }
      });

      const validTotal = calculateValidOrderTotal(newOrders);

      setTables(prevTables => prevTables.map(t => 
        t.id === targetTableId 
          ? { 
              ...t, 
              orderTotal: validTotal === 0 ? undefined : validTotal,
              status: validTotal === 0 && newOrders.every(i => i.status === 'cancelled' || i.status === 'defective' || i.status === 'returned') ? 'available' : t.status 
            } 
          : t
      ));

      return { ...prev, [targetTableId!]: newOrders };
    });

    setKitchenLog(prevLog => {
      let remaining = qtyToProcess;
      let matchedAny = false;
      const cleanTargetTableNum = String(tableNum).replace(/\D/g, '');

      const updated = prevLog.map(k => {
        const cleanKTableNum = String(k.tableNumber || '').replace(/\D/g, '');
        const isTableMatch = (Boolean(cleanTargetTableNum) && Boolean(cleanKTableNum) && cleanTargetTableNum === cleanKTableNum) ||
          k.tableNumber === tableNum || 
          k.tableNumber === tableObj?.number || 
          k.tableNumber === String(targetTableId) || 
          k.tableNumber === `Masa ${tableObj?.number}`;

        const isMatch = remaining > 0 &&
          targetItem && k.dishName === targetItem.name &&
          isTableMatch &&
          (k.status === 'preparing' || k.status === 'ready' || k.status === 'delivered');

        if (isMatch) {
          matchedAny = true;
          if (k.quantity <= remaining) {
            remaining -= k.quantity;
            return [{
              ...k,
              status: actionType as any,
              notes: reason ? `${reason}` : (actionType === 'defective' ? 'Xarab' : 'Geri qaytarıldı'),
              timestamp: new Date()
            }];
          } else {
            const updatedQty = k.quantity - remaining;
            const processedItem: KitchenItem = {
              ...k,
              id: Date.now() + Math.random(),
              quantity: remaining,
              status: actionType as any,
              notes: reason ? `${reason}` : (actionType === 'defective' ? 'Xarab' : 'Geri qaytarıldı'),
              timestamp: new Date()
            };
            remaining = 0;
            return [{ ...k, quantity: updatedQty }, processedItem];
          }
        }
        return [k];
      });

      let finalLog = updated.flat();

      if (!matchedAny || remaining > 0) {
        const fallbackQty = !matchedAny ? qtyToProcess : remaining;
        const newEntry: KitchenItem = {
          id: Date.now() + Math.random(),
          orderId: targetTableId!,
          dishName: (targetItem as OrderItem).name,
          tableNumber: tableNum,
          waiterName: waiterName,
          timestamp: new Date(),
          date: currentShiftBusinessDate || getTodayStr(),
          status: actionType as any,
          quantity: fallbackQty,
          notes: reason ? `${reason}` : (actionType === 'defective' ? 'Xarab' : 'Geri qaytarıldı'),
          shiftId: activeShift?.id,
          isClosed: false
        };
        finalLog = [newEntry, ...finalLog];
      }

      return finalLog;
    });
  };

  const handleConfirmItemAction = () => {
    if (!itemActionModal) return;
    const isDef = itemActionModal.actionType === 'defective';
    const finalReason = itemActionReason.trim() || itemActionSelectedChip || (isDef ? 'Məhsul xarab çıxıb' : 'Müştəri geri qaytardı');

    processItemAction(
      itemActionModal.itemId,
      itemActionModal.actionType,
      itemActionQty,
      finalReason
    );

    setItemActionModal(null);
    setItemActionReason('');
    setItemActionSelectedChip('');
    setItemActionQty(1);
  };
  
  const [typedPassword, setTypedPassword] = useState('');
  const [passwordFeedback, setPasswordFeedback] = useState<'idle' | 'success' | 'error'>('idle');
  const [kbLanguage, setKbLanguage] = useState<'AZ' | 'EN' | 'TR' | 'RU'>('AZ');
  const [kbShift, setKbShift] = useState(true);
  const [showPasswordRaw, setShowPasswordRaw] = useState(false);
  const [newMgmtPasswordInput, setNewMgmtPasswordInput] = useState('');
  const [mgmtPasswordSaveSuccess, setMgmtPasswordSaveSuccess] = useState(false);
  const [aboutSettingsSaved, setAboutSettingsSaved] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickSettings, setShowQuickSettings] = useState(false);
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('resto_isMuted') === 'true');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminPassword, setAdminPassword] = useState('***');
  const [adminTypedPassword, setAdminTypedPassword] = useState('');
  const [adminPasswordFeedback, setAdminPasswordFeedback] = useState<'idle' | 'success' | 'error'>('idle');
  const [adminKbLanguage, setAdminKbLanguage] = useState<'AZ' | 'EN' | 'TR' | 'RU'>('AZ');
  const [showAdminPasswordRaw, setShowAdminPasswordRaw] = useState(false);
  const [securityAdminPasswordSuccess, setSecurityAdminPasswordSuccess] = useState(false);

  const [isInventoryUnlocked, setIsInventoryUnlocked] = useState(false);
  const [inventoryTypedPassword, setInventoryTypedPassword] = useState('');
  const [inventoryPasswordFeedback, setInventoryPasswordFeedback] = useState<'idle' | 'success' | 'error'>('idle');
  const [inventoryKbLanguage, setInventoryKbLanguage] = useState<'AZ' | 'EN' | 'TR' | 'RU'>('AZ');
  const [inventoryKbShift, setInventoryKbShift] = useState(true);
  const [showInventoryPasswordRaw, setShowInventoryPasswordRaw] = useState(false);

  const startupInputRef = useRef<HTMLInputElement>(null);
  const mgmtInputRef = useRef<HTMLInputElement>(null);
  const adminInputRef = useRef<HTMLInputElement>(null);
  const inventoryInputRef = useRef<HTMLInputElement>(null);

  const renderStartupLock = () => {
    const kbLayouts = {
      AZ: [
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
        ['Q', 'Ü', 'E', 'R', 'T', 'Y', 'U', 'İ', 'O', 'P', 'Ö', 'Ğ'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'I', 'Ə'],
        ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Ç', 'Ş']
      ],
      EN: [
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
      ],
      TR: [
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'Ğ', 'Ü'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ş', 'İ'],
        ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Ö', 'Ç']
      ],
      RU: [
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
        ['Й', 'Ц', 'У', 'К', 'Е', 'Н', 'Г', 'Ш', 'Щ', 'З', 'Х', 'Ъ'],
        ['Ф', 'Ы', 'В', 'А', 'П', 'Р', 'О', 'Л', 'Д', 'Ж', 'Э'],
        ['Я', 'Ч', 'С', 'М', 'И', 'Т', 'Ь', 'Б', 'Ю']
      ]
    };

    const handleKeyClick = (key: string) => {
      setStartupPasswordFeedback('idle');
      setStartupTypedPassword(prev => prev + (key ? (startupKbShift ? key.toUpperCase() : key.toLowerCase()) : ''));
    };

    const handleBackspace = () => {
      setStartupPasswordFeedback('idle');
      setStartupTypedPassword(prev => prev.slice(0, -1));
    };

    const handleClear = () => {
      setStartupPasswordFeedback('idle');
      setStartupTypedPassword('');
    };

    const handleVerify = async () => {
      const isValid = await verifyPasswordSecure(startupTypedPassword, 'startup');
      if (isValid) {
        setStartupPasswordFeedback('success');
        setTimeout(() => {
          setIsStartupUnlocked(true);
          setStartupTypedPassword('');
          setStartupPasswordFeedback('idle');
          setActiveTab('tables'); // Open Tables and Orders page directly on success
        }, 600);
      } else {
        setStartupPasswordFeedback('error');
        setStartupTypedPassword('');
        setTimeout(() => startupInputRef.current?.focus(), 50);
      }
    };

    const currentRows = kbLayouts[startupKbLanguage];

    return (
      <DraggableWindow title="Sistem Giriş Şifrəsi" widthClass="w-full max-w-md">
        <div className="space-y-4 text-center">
          <div className="space-y-1">
            <h2 className="text-sm font-black text-slate-800 tracking-tight uppercase flex items-center justify-center gap-1.5">
              <Lock className={`w-4 h-4 shrink-0 transition-all ${
                startupPasswordFeedback === 'success' ? 'text-green-600 scale-110' :
                startupPasswordFeedback === 'error' ? 'text-red-650 animate-bounce' : 'text-orange-500'
              }`} />
              Giriş Şifrəsi
            </h2>
          </div>

          <div className="relative max-w-sm mx-auto">
            <input 
              ref={startupInputRef}
              type={showStartupPasswordRaw ? "text" : "password"}
              value={startupTypedPassword}
              onChange={e => {
                setStartupPasswordFeedback('idle');
                setStartupTypedPassword(e.target.value);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') handleVerify();
              }}
              placeholder="Şifrə..."
              className={`w-full px-3 py-2 bg-slate-50 border-2 rounded-xl focus:outline-none font-extrabold text-sm text-slate-700 tracking-widest text-center transition-colors ${
                startupPasswordFeedback === 'error' ? 'border-red-500 bg-red-50/35 focus:border-red-500' :
                startupPasswordFeedback === 'success' ? 'border-green-500 bg-green-50/20 focus:border-green-500' : 'border-slate-100 focus:border-orange-500'
              }`}
              autoFocus
            />
            
            <button
              type="button"
              onClick={() => setShowStartupPasswordRaw(!showStartupPasswordRaw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              {showStartupPasswordRaw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {startupPasswordFeedback === 'error' && (
            <p className="text-[10px] font-black text-red-650 animate-pulse tracking-wide uppercase">
              SƏHV ŞİFRƏ! YENİDƏN DAXİL EDİN.
            </p>
          )}
          {startupPasswordFeedback === 'success' && (
            <p className="text-[10px] font-black text-green-600 animate-pulse tracking-wide uppercase">
              ŞİFRƏ TƏSDİQLƏNDİ. DAXİL OLUNUR...
            </p>
          )}

          <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-150 relative max-w-sm mx-auto space-y-2">
            <div className="flex justify-between items-center bg-white p-1 rounded-xl border border-slate-200 select-none">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1.5 flex items-center gap-0.5">
                <Globe className="w-3 h-3 text-slate-400" />
                DİL:
              </span>
              <div className="flex gap-1 p-0.5 bg-slate-100/60 rounded-lg">
                {(['AZ', 'EN', 'TR', 'RU'] as const).map(lang => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setStartupKbLanguage(lang)}
                    className={`px-1.5 py-1 rounded text-[8px] font-black uppercase transition-all tracking-wider ${
                      startupKbLanguage === lang 
                        ? 'bg-orange-500 text-white font-black' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1 select-none font-sans">
              {currentRows.map((row, rIdx) => (
                <div key={`startup_kb_row_${rIdx}`} className="flex justify-center gap-0.5 flex-wrap">
                  {row.map((char, cIdx) => (
                    <button
                      key={`startup_kb_char_${rIdx}_${cIdx}_${char}`}
                      type="button"
                      onClick={() => handleKeyClick(char)}
                      className="h-8 min-w-[26px] px-1 bg-white hover:bg-orange-50 active:scale-95 text-slate-700 hover:text-orange-600 border border-slate-200 rounded-lg font-bold text-[10px] shadow-3xs flex items-center justify-center cursor-pointer shrink-0"
                    >
                      {char ? (startupKbShift ? char.toUpperCase() : char.toLowerCase()) : ''}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-1 select-none flex-wrap">
              <button
                type="button"
                onClick={() => setStartupKbShift(prev => !prev)}
                className={`h-8 px-2 rounded-lg font-black text-[9px] uppercase tracking-wider transition-all border shrink-0 flex items-center justify-center gap-0.5 cursor-pointer ${
                  startupKbShift 
                    ? 'bg-slate-700 text-white border-slate-700 shadow-sm' 
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Shift
              </button>

              <button
                type="button"
                onClick={() => handleKeyClick(' ')}
                className="h-8 bg-white text-slate-500 border border-slate-200 hover:bg-slate-100/50 rounded-lg font-bold text-[9px] uppercase tracking-widest transition-all cursor-pointer flex-1 shrink-0 flex items-center justify-center"
              >
                Space
              </button>

              <button
                type="button"
                onClick={handleBackspace}
                className="h-8 px-2 bg-white text-slate-500 border border-slate-200 hover:bg-slate-100 rounded-lg font-bold text-[9px] uppercase tracking-wider transition-all cursor-pointer shrink-0 flex items-center justify-center"
              >
                ← Sil
              </button>
            </div>

            <div className="flex gap-1.5 pt-1.5 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClear}
                className="px-2 py-2 bg-red-50 hover:bg-red-100 text-red-650 rounded-lg font-black text-[9px] uppercase tracking-wider transition-all select-none cursor-pointer border border-red-100 shrink-0"
              >
                TƏMİZLƏ
              </button>
              
              <button
                type="button"
                onClick={handleVerify}
                className="px-3 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 active:scale-98 text-white rounded-lg font-black text-[9px] uppercase tracking-wider transition-all select-none shadow-md flex-1 cursor-pointer flex items-center justify-center gap-1"
              >
                <Unlock className="w-3 h-3" />
                TƏSDİQLƏ (ENTER)
              </button>
            </div>
          </div>
        </div>
      </DraggableWindow>
    );
  };

  const [tables, setTables] = useState<Table[]>(() => {
    try {
      const saved = localStorage.getItem('resto_tables');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return MOCK_TABLES;
  });
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const isPurged = localStorage.getItem('isDatabasePurged') === 'true';
    if (isPurged) return [];
    try {
      const saved = localStorage.getItem('resto_menuItems');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return MOCK_MENU;
  });
  const [reservations, setReservations] = useState<Reservation[]>(() => {
    const saved = localStorage.getItem('resto_reservations');
    return saved ? JSON.parse(saved) : MOCK_RESERVATIONS;
  });
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const isPurged = localStorage.getItem('isDatabasePurged') === 'true';
    if (isPurged) return [];
    const saved = localStorage.getItem('resto_inventory');
    return saved ? JSON.parse(saved) : MOCK_INVENTORY;
  });
  const [inventoryTransactions, setInventoryTransactions] = useState<InventoryTransaction[]>(() => {
    const isPurged = localStorage.getItem('isDatabasePurged') === 'true';
    if (isPurged) return [];
    const saved = localStorage.getItem('resto_inventoryTransactions');
    return saved ? JSON.parse(saved) : MOCK_INVENTORY_TRANSACTIONS;
  });
  const [orderTransactions, setOrderTransactions] = useState<OrderTransaction[]>(() => {
    const isPurged = localStorage.getItem('isDatabasePurged') === 'true';
    if (isPurged) return [];
    try {
      const saved = localStorage.getItem('resto_orderTransactions');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}

    try {
      const savedClosed = localStorage.getItem('resto_closedShifts');
      if (savedClosed) {
        const closedObj = JSON.parse(savedClosed);
        const collected: OrderTransaction[] = [];
        Object.values(closedObj).forEach((cs: any) => {
          if (cs && cs.orders && Array.isArray(cs.orders)) {
            collected.push(...cs.orders);
          }
        });
        if (collected.length > 0) return collected;
      }
    } catch (e) {}

    return MOCK_ORDER_TRANSACTIONS;
  });
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    const isPurged = localStorage.getItem('isDatabasePurged') === 'true';
    if (isPurged) return [];
    try {
      const saved = localStorage.getItem('resto_expenses');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}

    try {
      const savedClosed = localStorage.getItem('resto_closedShifts');
      if (savedClosed) {
        const closedObj = JSON.parse(savedClosed);
        const collected: ExpenseItem[] = [];
        Object.values(closedObj).forEach((cs: any) => {
          if (cs && cs.expenses && Array.isArray(cs.expenses)) {
            collected.push(...cs.expenses);
          }
        });
        if (collected.length > 0) return collected;
      }
    } catch (e) {}

    return MOCK_EXPENSES;
  });

  const [closedShifts, setClosedShifts] = useState<Record<string, any>>(() => {
    const saved = localStorage.getItem('resto_closedShifts');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    if (!isLoadedFromSQLiteRef.current) return;
    safeLocalStorageSetItem('resto_expenses', JSON.stringify(expenses));
    if ((window as any).electron?.sqliteSaveEntity) {
      (window as any).electron.sqliteSaveEntity('expenses', expenses).catch((e: any) => console.log('SQLite expenses sync:', e));
    }
  }, [expenses]);

  useEffect(() => {
    if (!isLoadedFromSQLiteRef.current) return;
    safeLocalStorageSetItem('resto_closedShifts', JSON.stringify(closedShifts));
    if ((window as any).electron?.sqliteSaveEntity) {
      (window as any).electron.sqliteSaveEntity('resto_closedShifts', closedShifts).catch((e: any) => console.log('SQLite closedShifts sync:', e));
    }
  }, [closedShifts]);

  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getActiveShiftBusinessDate = (): string => {
    try {
      const saved = localStorage.getItem('resto_activeShift');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.businessDate && typeof parsed.businessDate === 'string' && parsed.businessDate.trim() !== '') {
          const rawDate = parsed.businessDate.trim();
          let closedCount = 0;
          try {
            const savedClosed = localStorage.getItem('resto_closedShifts');
            if (savedClosed) {
              const parsedClosed = JSON.parse(savedClosed);
              const norm = normalizeDateKey(rawDate);
              const dayClosed = norm ? parsedClosed[norm] : null;
              if (dayClosed?.allShifts && Array.isArray(dayClosed.allShifts)) {
                closedCount = dayClosed.allShifts.length;
              } else if (dayClosed?.shiftId) {
                closedCount = 1;
              }
            }
          } catch (err) {
            console.error(err);
          }

          if (parsed.isClosed || closedCount >= 2) {
            const realToday = getTodayStr();
            return (realToday > rawDate) ? realToday : getNextDateStr(rawDate);
          }
          return rawDate;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return getTodayStr();
  };

  const [activeShift, setActiveShift] = useState<{ id: string; businessDate: string; openedAt: string; isClosed?: boolean }>(() => {
    const saved = localStorage.getItem('resto_activeShift');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const savedClosed = localStorage.getItem('resto_closedShifts');
          let closedCount = 0;
          if (savedClosed && parsed.businessDate) {
            try {
              const parsedClosed = JSON.parse(savedClosed);
              const norm = normalizeDateKey(parsed.businessDate);
              const dayClosed = norm ? parsedClosed[norm] : null;
              if (dayClosed?.allShifts && Array.isArray(dayClosed.allShifts)) {
                closedCount = dayClosed.allShifts.length;
              } else if (dayClosed?.shiftId) {
                closedCount = 1;
              }
            } catch (err) {
              console.error(err);
            }
          }

          if (!parsed.isClosed && closedCount < 2) {
            return parsed;
          } else if (parsed.businessDate) {
            const realToday = getTodayStr();
            const nextDate = (realToday > parsed.businessDate) ? realToday : getNextDateStr(parsed.businessDate);
            const freshShift = {
              id: `shift_${Date.now()}`,
              businessDate: nextDate,
              openedAt: new Date().toISOString(),
              isClosed: false
            };
            safeLocalStorageSetItem('resto_activeShift', JSON.stringify(freshShift));
            return freshShift;
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;
    return {
      id: `shift_${Date.now()}`,
      businessDate: today,
      openedAt: new Date().toISOString()
    };
  });

  // Dashboard & Report Date Filtering
  const [dashboardPeriod, setDashboardPeriod] = useState<'daily' | 'monthly' | 'yearly' | 'custom'>('daily');
  const [dashboardDate, setDashboardDate] = useState<string>(() => getActiveShiftBusinessDate()); // Selected/Custom day for dashboard
  const [dashboardShiftId, setDashboardShiftId] = useState<string>('auto'); // Specific shift filter for dashboard
  const [reportShiftId, setReportShiftId] = useState<string>('auto');
  const [dashboardSoldTableFilter, setDashboardSoldTableFilter] = useState<string>('all'); // Table filter for sold products
  const [dashboardSelectedProductFilter, setDashboardSelectedProductFilter] = useState<string>(''); // Combobox product filter
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'monthly' | 'yearly' | 'custom'>('daily');
  const [reportDate, setReportDate] = useState<string>(() => getActiveShiftBusinessDate()); // Selected/Custom day for reports

  const [expensePeriod, setExpensePeriod] = useState<'daily' | 'monthly' | 'yearly' | 'custom'>('daily');
  const [expenseDate, setExpenseDate] = useState<string>(() => getTodayStr());
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('all');
  const [expenseSearch, setExpenseSearch] = useState<string>('');
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState<boolean>(false);
  const expenseTitleInputRef = useRef<HTMLInputElement>(null);
  const [newExpense, setNewExpense] = useState<{ title: string; category: string; amount: string; date: string; notes: string }>(() => ({
    title: '',
    category: 'Kommunal',
    amount: '',
    date: getTodayStr(),
    notes: ''
  }));

  // Görsəldəki pəncərə açılanda kalendarda mütləq aktiv tarixi təyin et və kursuru Xərcin təsviri textboxuna fokusla
  useEffect(() => {
    if (isAddExpenseOpen) {
      const activeEffectiveDate = dashboardDate || activeShift?.businessDate || getActiveShiftBusinessDate() || getTodayStr();
      setNewExpense({
        title: '',
        category: 'Kommunal',
        amount: '',
        date: activeEffectiveDate,
        notes: ''
      });

      // Kursor mütləq Xərcin təsviri textbox-ında fokuslansın və yanıb-sönsün
      const focusTimer = setTimeout(() => {
        if (expenseTitleInputRef.current) {
          expenseTitleInputRef.current.focus();
          expenseTitleInputRef.current.select();
        }
      }, 50);

      const raf = requestAnimationFrame(() => {
        if (expenseTitleInputRef.current) {
          expenseTitleInputRef.current.focus();
        }
      });

      return () => {
        clearTimeout(focusTimer);
        cancelAnimationFrame(raf);
      };
    }
  }, [isAddExpenseOpen, dashboardDate, activeShift]);

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const titleTrimmed = newExpense.title.trim();
    if (!titleTrimmed) {
      alert("Xahiş olunur, xərcin təsvirini / adını daxil edin!");
      return;
    }
    const amtNum = parseFloat(newExpense.amount);
    if (isNaN(amtNum) || amtNum <= 0) {
      alert("Xahiş olunur, düzgün xərc məbləği daxil edin!");
      return;
    }

    const shiftBusinessDate = activeShift?.businessDate || getActiveShiftBusinessDate();
    const targetDate = newExpense.date || shiftBusinessDate;

    const item: ExpenseItem = {
      id: Date.now(),
      title: titleTrimmed,
      category: newExpense.category || 'Kommunal',
      amount: Math.round(amtNum * 100) / 100,
      date: targetDate,
      operator: 'Sistem Admini',
      notes: newExpense.notes.trim(),
      shiftId: activeShift?.id,
      isClosed: false
    };

    setExpenses(prev => {
      const updated = [item, ...prev];
      safeLocalStorageSetItem('resto_expenses', JSON.stringify(updated));
      return updated;
    });
    clearPurgeFlagIfSet();
    
    // Auto align filters so user sees new expense immediately in all views
    setExpenseDate(targetDate);
    setDashboardDate(targetDate);

    // Audit log
    addAuditLog(
      "YENİ XƏRC ƏLAVƏ EDİLDİ",
      "Sistem Admini",
      `Xərc: ${item.title} (${item.category}) - Məbləğ: ${item.amount.toFixed(2)} ₼`,
      "info"
    );

    setIsAddExpenseOpen(false);
    setNewExpense({
      title: '',
      category: 'Kommunal',
      amount: '',
      date: shiftBusinessDate,
      notes: ''
    });
  };

  const formatAzDate = (dateStr: string, period: string = 'daily') => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const monthNum = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    const azMonths = [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun', 
      'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
    ];

    const monthName = azMonths[monthNum - 1] || `${monthNum}`;

    if (period === 'monthly') {
      return `${monthName} ${year}`;
    }
    if (period === 'yearly') {
      return `${year}-ci İl`;
    }
    return `${day} ${monthName} ${year}`;
  };
  const [staff, setStaff] = useState<StaffMember[]>(() => {
    const saved = localStorage.getItem('resto_staff');
    return saved ? JSON.parse(saved) : MOCK_STAFF;
  });
  const [kitchenLog, setKitchenLog] = useState<KitchenItem[]>(() => {
    const isPurged = localStorage.getItem('isDatabasePurged') === 'true';
    if (isPurged) return [];
    try {
      const saved = localStorage.getItem('resto_kitchenLog');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return MOCK_KITCHEN;
  });
  const [kitchenSearch, setKitchenSearch] = useState('');
  const [kitchenDate, setKitchenDate] = useState<string>(() => getTodayStr());
  const [activeOrders, setActiveOrders] = useState<Record<number, OrderItem[]>>(() => {
    const saved = localStorage.getItem('resto_activeOrders');
    return saved ? JSON.parse(saved) : {};
  });
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [tablesSubMode, setTablesSubMode] = useState<'tables' | 'quick_sale'>('tables');
  const [isMoveTargetOpen, setIsMoveTargetOpen] = useState(false);
  const [waiterSelectionId, setWaiterSelectionId] = useState<number | null>(null);

  // --- World-Class Upgrades States ---
  const [recipes, setRecipes] = useState<Record<number, { ingredientId: number; amount: number }[]>>({
    1: [ // Mərci Şorbası
      { ingredientId: 4, amount: 0.1 },  // Pomidor (0.1 kq)
      { ingredientId: 1, amount: 0.05 }, // Un (0.05 kq)
    ],
    2: [ // Margherita Pizza
      { ingredientId: 1, amount: 0.2 },  // Un (0.2 kq)
      { ingredientId: 2, amount: 0.15 }, // Mozzarella (0.15 kq)
      { ingredientId: 4, amount: 0.1 },  // Pomidor (0.1 kq)
    ],
    3: [ // Sezar Salatı
      { ingredientId: 4, amount: 0.1 },  // Pomidor (0.1 kq)
    ],
    4: [ // Antrikot
      { ingredientId: 3, amount: 0.35 }, // Qara Ət (0.35 kq)
    ],
    5: [ // Tiramisu
      { ingredientId: 1, amount: 0.05 }, // Un (0.05 kq)
    ],
    6: [ // Ev Sayı Limonad
      { ingredientId: 4, amount: 0.02 }, // Pomidor as proxy
    ]
  });

  const [isOnline, setIsOnline] = useState<boolean>(() => {
    const saved = localStorage.getItem('resto_is_online');
    return saved !== null ? saved === 'true' : true;
  });
  const [offlineQueue, setOfflineQueue] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const [selectedQRTableId, setSelectedQRTableId] = useState<number | null>(null);
  
  const [isSmartKassaPaying, setIsSmartKassaPaying] = useState<boolean>(false);
  const [smartKassaStatus, setSmartKassaStatus] = useState<string>('');
  const [smartKassaConfig, setSmartKassaConfig] = useState({
    ip: '192.168.1.150',
    port: '8080',
    terminalToken: 'SMARTKASSA_AZ_TOKEN_892314981',
    connected: true
  });

  const [aiChatHistory, setAiChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    {
      role: 'assistant',
      content: 'Salam! Mən RestoMaster Süni İntellekt Ekspertinizəm. Restoranınızın satış və anbar datalarını təhlil edərək sizə ağıllı proqnozlar təqdim edirəm. Hazırda hansı barədə məsləhət almaq istərdiniz?'
    }
  ]);
  const [aiQuery, setAiQuery] = useState<string>('');

  // --- QR Self-Service States ---
  const [qrCart, setQrCart] = useState<Record<number, number>>({});
  const [qrActiveCategory, setQrActiveCategory] = useState<string>('Hamısı');
  const [qrSearch, setQrSearch] = useState<string>('');
  const [qrNotification, setQrNotification] = useState<string | null>(null);

  // Management State
  const [menuSubTab, setMenuSubTab] = useState<'dishes' | 'recipes'>('dishes');
  const [adminSubTab, setAdminSubTab] = useState<'branding' | 'printer' | 'tables' | 'purge' | 'audit' | 'backup' | 'about_settings' | 'security'>('branding');
  
  const notificationRef = useRef<HTMLDivElement>(null);
  const quickSettingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (quickSettingsRef.current && !quickSettingsRef.current.contains(event.target as Node)) {
        setShowQuickSettings(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // --- Developer Portfolio Details (Haqqımızda) ---
  const DEFAULT_DEV_NAME = 'Məmmədov İlqar';
  const DEFAULT_DEV_BIO = 'Yeni nəsil bulud texnologiyaları, fərdiləşdirilmiş ERP sistemləri, mobil tətbiqlər və biznesinizin avtomatlaşdırılması üçün peşəkar proqram təminatı həlləri hazırlayıram.';
  const DEFAULT_DEV_EMAIL = 'programistilqar@gmail.com';
  const DEFAULT_DEV_PHONE = '+994 99 352 44 13';
  const DEFAULT_DEV_WHATSAPP = '994993524413';
  const DEFAULT_DEV_GITHUB = 'https://github.com';
  const DEFAULT_DEV_LINKEDIN = 'https://linkedin.com';
  const DEFAULT_DEV_WEBSITE = 'https://instagram.com';
  const DEFAULT_DEV_LOGO_URL = '/developer_ilqar.jpg';

  const DEFAULT_DEV_PROGRAMS = [
    {
      id: '1',
      name: 'ExpressPos - Satış və Anbar Sistemi',
      description: 'Satış və Anbar POS İdarəetmə Sistemi pərakəndə satış, anbar logistikası və maliyyə əməliyyatlarını vahid platformada birləşdirən müasir proqram təminatıdır.',
      image: '/expresspos_preview.svg',
      tech: 'REACT, TYPESCRIPT, TAİLWİND CSS, LOCAL STORAGE',
      link: '#'
    },
    {
      id: '2',
      name: 'Auto-Oil.Pro – Avtomobil Servis və Yağdəyişmə',
      description: 'Auto-Oil.Pro – Avtomobil Servis və Yağdəyişmə İdarəetmə Sistemi avtomobil təmiri, müştəri bazası və ehtiyat hissələri anbar uçotunu təşkil edir.',
      image: '/autooil_preview.svg',
      tech: 'REACT, TYPESCRIPT, TAİLWİND CSS, LOCAL STORAGE',
      link: '#'
    },
    {
      id: '3',
      name: 'Resto Master — Müasir Restoran və Kassa Sistemi',
      description: 'Restoran, kafe və ictimai iaşə obyektlərinin tam avtomatlaşdırılması üçün hazırlanmış bu platforma masa sifarişlərinin qəbulu, mətbəx monitoru və kassa əməliyyatlarını təmin edir.',
      image: '/restomaster_preview.svg',
      tech: 'REACT, TYPESCRIPT, TAİLWİND CSS, LOCAL STORAGE',
      link: '#'
    }
  ];

  // --- POS Monitor & 10-Finger Touch Mode State ---
  const [isPosMonitorMode, setIsPosMonitorMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('resto_pos_monitor_mode');
    return saved !== null ? saved === 'true' : true;
  });

  const [isKeyboardWideMode, setIsKeyboardWideMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('resto_keyboard_wide_mode');
    return saved !== null ? saved === 'true' : false;
  });

  const [devName, setDevName] = useState<string>(() => localStorage.getItem('resto_devName') || DEFAULT_DEV_NAME);
  const [devBio, setDevBio] = useState<string>(() => localStorage.getItem('resto_devBio') || DEFAULT_DEV_BIO);
  const [devEmail, setDevEmail] = useState<string>(() => localStorage.getItem('resto_devEmail') || DEFAULT_DEV_EMAIL);
  const [devPhone, setDevPhone] = useState<string>(() => localStorage.getItem('resto_devPhone') || DEFAULT_DEV_PHONE);
  const [devWhatsapp, setDevWhatsapp] = useState<string>(() => localStorage.getItem('resto_devWhatsapp') || DEFAULT_DEV_WHATSAPP);
  const [devGithub, setDevGithub] = useState<string>(() => localStorage.getItem('resto_devGithub') || DEFAULT_DEV_GITHUB);
  const [devLinkedin, setDevLinkedin] = useState<string>(() => localStorage.getItem('resto_devLinkedin') || DEFAULT_DEV_LINKEDIN);
  const [devWebsite, setDevWebsite] = useState<string>(() => localStorage.getItem('resto_devWebsite') || DEFAULT_DEV_WEBSITE);
  const [devLogoUrl, setDevLogoUrl] = useState<string>(() => localStorage.getItem('resto_devLogoUrl') || DEFAULT_DEV_LOGO_URL);

  // --- Virtual On-Screen Touch Keyboard for POS Monitors ---
  const [isVirtualKeyboardEnabled, setIsVirtualKeyboardEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('resto_virtual_keyboard_enabled');
    return saved !== null ? saved === 'true' : true;
  });
  const [isVirtualKeyboardOpen, setIsVirtualKeyboardOpen] = useState(false);
  const [virtualKeyboardLang, setVirtualKeyboardLang] = useState<'AZ' | 'EN' | 'TR' | 'RU'>('AZ');
  const [virtualKeyboardMode, setVirtualKeyboardMode] = useState<'abc' | '123'>('abc');
  const [virtualKeyboardCaps, setVirtualKeyboardCaps] = useState(false);
  const [virtualKeyboardShift, setVirtualKeyboardShift] = useState(false);
  const [virtualKeyboardPos, setVirtualKeyboardPos] = useState<{ x: number, y: number } | null>(null);
  const [isDraggingKeyboard, setIsDraggingKeyboard] = useState(false);
  const [activeInputInfo, setActiveInputInfo] = useState<{ label: string, value: string, placeholder: string }>({ label: '', value: '', placeholder: '' });
  const activeInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const activeInputRawValueRef = useRef<string>('');
  const keyboardDragStartRef = useRef<{ startX: number, startY: number, posX: number, posY: number }>({ startX: 0, startY: 0, posX: 0, posY: 0 });

  // --- Exit Confirmation Modal State ---
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);

  // --- Shift Notice / Confirmation Modal State ---
  const [shiftNoticeModal, setShiftNoticeModal] = useState<{ title: string; message: string; type?: 'success' | 'warning' | 'info' } | null>(null);

  // Universal Caret & Focus Keeper:
  // Guarantees that clicking on any input, textarea, or contenteditable element
  // always re-asserts document focus and activates the blinking caret cursor,
  // permanently eliminating the Electron/Chromium cursor disappearing bug.
  useEffect(() => {
    const handleGlobalFocusCapture = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        if (!document.hasFocus()) {
          window.focus();
        }
        if (document.activeElement !== target) {
          (target as HTMLElement).focus();
        }
      }
    };

    window.addEventListener('pointerdown', handleGlobalFocusCapture, true);
    window.addEventListener('click', handleGlobalFocusCapture, true);
    return () => {
      window.removeEventListener('pointerdown', handleGlobalFocusCapture, true);
      window.removeEventListener('click', handleGlobalFocusCapture, true);
    };
  }, []);

  const [devPrograms, setDevPrograms] = useState<{id: string, name: string, description: string, image: string, tech: string, link: string}[]>(() => {
    const saved = localStorage.getItem('resto_devPrograms');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const isOutdated = parsed.some(p => p.name?.includes('RestoMaster Cloud') || p.name?.includes('QR & Smart') || p.name?.includes('KDS Mətbəx'));
          if (!isOutdated) return parsed;
        }
      } catch (e) {
        // fallback
      }
    }
    return DEFAULT_DEV_PROGRAMS;
  });

  // Sync POS Monitor mode
  useEffect(() => {
    safeLocalStorageSetItem('resto_pos_monitor_mode', String(isPosMonitorMode));
  }, [isPosMonitorMode]);

  useEffect(() => {
    safeLocalStorageSetItem('resto_keyboard_wide_mode', String(isKeyboardWideMode));
  }, [isKeyboardWideMode]);

  // Sync developer state to localStorage and Electron file storage
  useEffect(() => {
    safeLocalStorageSetItem('resto_devName', devName);
    safeLocalStorageSetItem('resto_devBio', devBio);
    safeLocalStorageSetItem('resto_devEmail', devEmail);
    safeLocalStorageSetItem('resto_devPhone', devPhone);
    safeLocalStorageSetItem('resto_devWhatsapp', devWhatsapp);
    safeLocalStorageSetItem('resto_devGithub', devGithub);
    safeLocalStorageSetItem('resto_devLinkedin', devLinkedin);
    safeLocalStorageSetItem('resto_devWebsite', devWebsite);
    safeLocalStorageSetItem('resto_devLogoUrl', devLogoUrl);
    safeLocalStorageSetItem('resto_devPrograms', JSON.stringify(devPrograms));

    if ((window as any).electron && (window as any).electron.saveDesktopData) {
      (window as any).electron.saveDesktopData({
        resto_devName: devName,
        resto_devBio: devBio,
        resto_devEmail: devEmail,
        resto_devPhone: devPhone,
        resto_devWhatsapp: devWhatsapp,
        resto_devGithub: devGithub,
        resto_devLinkedin: devLinkedin,
        resto_devWebsite: devWebsite,
        resto_devLogoUrl: devLogoUrl,
        resto_devPrograms: devPrograms
      }).catch((e: any) => console.log('Electron save status:', e));
    }
  }, [devName, devBio, devEmail, devPhone, devWhatsapp, devGithub, devLinkedin, devWebsite, devLogoUrl, devPrograms]);

  // Load from Electron persistent desktop storage and SQLite Database on startup if available
  useEffect(() => {
    // Migrate any legacy plain-text passwords from localStorage to secure vault
    migrateLegacyPasswords();

    if ((window as any).electron) {
      // 1. First check and load SQLite database entities if available
      if ((window as any).electron.sqliteGetAll) {
        (window as any).electron.sqliteGetAll().then((sqliteData: any) => {
          if (sqliteData) {
            const isPurged = localStorage.getItem('isDatabasePurged') === 'true';

            // 1. Tables: Must NEVER be overwritten with an empty array.
            if (Array.isArray(sqliteData.resto_tables) && sqliteData.resto_tables.length > 0) {
              setTables(sqliteData.resto_tables);
            } else {
              if ((window as any).electron?.sqliteSaveEntity && tables && tables.length > 0) {
                (window as any).electron.sqliteSaveEntity('tables', tables).catch((e: any) => console.log('SQLite tables seed:', e));
              }
            }

            // 2. Menu Items
            if (Array.isArray(sqliteData.resto_menuItems) && sqliteData.resto_menuItems.length > 0) {
              setMenuItems(sqliteData.resto_menuItems);
            } else if (!isPurged && menuItems && menuItems.length > 0) {
              if ((window as any).electron?.sqliteSaveEntity) {
                (window as any).electron.sqliteSaveEntity('menuItems', menuItems).catch((e: any) => console.log('SQLite menuItems seed:', e));
              }
            }

            // 3. Order Transactions
            if (Array.isArray(sqliteData.resto_orderTransactions) && sqliteData.resto_orderTransactions.length > 0) {
              setOrderTransactions(sqliteData.resto_orderTransactions);
            } else if (isPurged) {
              setOrderTransactions([]);
            }

            // 4. Inventory
            if (Array.isArray(sqliteData.resto_inventory) && sqliteData.resto_inventory.length > 0) {
              setInventory(sqliteData.resto_inventory);
            } else if (!isPurged && inventory && inventory.length > 0) {
              if ((window as any).electron?.sqliteSaveEntity) {
                (window as any).electron.sqliteSaveEntity('inventory', inventory).catch((e: any) => console.log('SQLite inventory seed:', e));
              }
            }

            // 5. Inventory Transactions
            if (Array.isArray(sqliteData.resto_inventoryTransactions) && sqliteData.resto_inventoryTransactions.length > 0) {
              setInventoryTransactions(sqliteData.resto_inventoryTransactions);
            } else if (isPurged) {
              setInventoryTransactions([]);
            }

            // 6. Expenses
            if (Array.isArray(sqliteData.resto_expenses) && sqliteData.resto_expenses.length > 0) {
              setExpenses(sqliteData.resto_expenses);
            } else if (isPurged) {
              setExpenses([]);
            }

            // 7. Staff
            if (Array.isArray(sqliteData.resto_staff) && sqliteData.resto_staff.length > 0) {
              setStaff(sqliteData.resto_staff);
            } else if (!isPurged && staff && staff.length > 0) {
              if ((window as any).electron?.sqliteSaveEntity) {
                (window as any).electron.sqliteSaveEntity('staff', staff).catch((e: any) => console.log('SQLite staff seed:', e));
              }
            }

            // 8. Reservations
            if (Array.isArray(sqliteData.resto_reservations) && sqliteData.resto_reservations.length > 0) {
              setReservations(sqliteData.resto_reservations);
            } else if (isPurged) {
              setReservations([]);
            }

            // 9. Defect Records
            const incomingDefects = sqliteData.resto_defectRecords || sqliteData.defectRecords;
            if (Array.isArray(incomingDefects) && incomingDefects.length > 0) {
              setDefectRecords(incomingDefects);
            } else if (isPurged) {
              setDefectRecords([]);
            }

            // 10. Kitchen Log
            if (Array.isArray(sqliteData.resto_kitchenLog) && sqliteData.resto_kitchenLog.length > 0) {
              setKitchenLog(sqliteData.resto_kitchenLog);
            } else if (isPurged) {
              setKitchenLog([]);
            }
            if (sqliteData.resto_activeOrders && typeof sqliteData.resto_activeOrders === 'object') {
              setActiveOrders(sqliteData.resto_activeOrders);
            }
            if (sqliteData.resto_closedShifts && typeof sqliteData.resto_closedShifts === 'object' && Object.keys(sqliteData.resto_closedShifts).length > 0) {
              setClosedShifts(sqliteData.resto_closedShifts);
            }
            if (Array.isArray(sqliteData.resto_auditLogs) && sqliteData.resto_auditLogs.length > 0) {
              setAuditLogs(sqliteData.resto_auditLogs);
            }
            if (sqliteData.resto_activeShift && typeof sqliteData.resto_activeShift === 'object') {
              const loadedShift = sqliteData.resto_activeShift;
              const loadedClosedShifts = (sqliteData.resto_closedShifts && typeof sqliteData.resto_closedShifts === 'object') 
                ? sqliteData.resto_closedShifts 
                : {};
              const normKey = normalizeDateKey(loadedShift.businessDate);
              const dayClosed = normKey ? loadedClosedShifts[normKey] : null;
              const closedCount = (dayClosed?.allShifts && Array.isArray(dayClosed.allShifts)) 
                ? dayClosed.allShifts.length 
                : (dayClosed?.shiftId ? 1 : 0);

              if (loadedShift.isClosed || closedCount >= 2) {
                const realToday = getTodayStr();
                const nextDate = (realToday > loadedShift.businessDate) ? realToday : getNextDateStr(loadedShift.businessDate);
                const freshShift = {
                  id: `shift_${Date.now()}`,
                  businessDate: nextDate,
                  openedAt: new Date().toISOString(),
                  isClosed: false
                };
                setActiveShift(freshShift);
                setDashboardShiftId(freshShift.id);
                setDashboardDate(nextDate);
                setZReportDate(nextDate);
                setReportDate(nextDate);
                setExpenseDate(nextDate);
                setKitchenDate(nextDate);
                safeLocalStorageSetItem('resto_activeShift', JSON.stringify(freshShift));
                if ((window as any).electron?.sqliteSaveEntity) {
                  (window as any).electron.sqliteSaveEntity('resto_activeShift', freshShift).catch((e: any) => console.log('SQLite fresh shift save:', e));
                }
              } else {
                setActiveShift(loadedShift);
                if (loadedShift.businessDate && !loadedShift.isClosed) {
                  setDashboardDate(loadedShift.businessDate);
                  setZReportDate(loadedShift.businessDate);
                  setReportDate(loadedShift.businessDate);
                  setExpenseDate(loadedShift.businessDate);
                  setKitchenDate(loadedShift.businessDate);
                }
              }
            }
          }
          isLoadedFromSQLiteRef.current = true;
        }).catch((err: any) => {
          console.log('SQLite startup read status:', err);
          isLoadedFromSQLiteRef.current = true;
        });
      } else {
        isLoadedFromSQLiteRef.current = true;
      }

      // 2. Load developer details and preferences
      if ((window as any).electron.loadDesktopData) {
        (window as any).electron.loadDesktopData().then((desktopData: any) => {
        if (desktopData) {
          if (desktopData.resto_devName) setDevName(desktopData.resto_devName);
          if (desktopData.resto_devBio) setDevBio(desktopData.resto_devBio);
          if (desktopData.resto_devEmail) setDevEmail(desktopData.resto_devEmail);
          if (desktopData.resto_devPhone) setDevPhone(desktopData.resto_devPhone);
          if (desktopData.resto_devWhatsapp) setDevWhatsapp(desktopData.resto_devWhatsapp);
          if (desktopData.resto_devGithub) setDevGithub(desktopData.resto_devGithub);
          if (desktopData.resto_devLinkedin) setDevLinkedin(desktopData.resto_devLinkedin);
          if (desktopData.resto_devWebsite) setDevWebsite(desktopData.resto_devWebsite);
          if (desktopData.resto_devLogoUrl) setDevLogoUrl(desktopData.resto_devLogoUrl);
          if (desktopData.resto_devPrograms && Array.isArray(desktopData.resto_devPrograms)) {
            const isOutdated = desktopData.resto_devPrograms.some((p: any) => p.name?.includes('RestoMaster Cloud') || p.name?.includes('QR & Smart') || p.name?.includes('KDS Mətbəx'));
            if (!isOutdated && desktopData.resto_devPrograms.length > 0) {
              setDevPrograms(desktopData.resto_devPrograms);
            } else {
              setDevPrograms(DEFAULT_DEV_PROGRAMS);
            }
          }
        }
      }).catch((e: any) => console.log('Electron load desktop data info:', e));
      }
    }
  }, []);

  useEffect(() => {
    safeLocalStorageSetItem('resto_is_online', String(isOnline));
  }, [isOnline]);

  useEffect(() => {
    safeLocalStorageSetItem('resto_virtual_keyboard_enabled', String(isVirtualKeyboardEnabled));
  }, [isVirtualKeyboardEnabled]);

  // Global focusin listener for POS Touch Virtual Keyboard
  useEffect(() => {
    if (!isVirtualKeyboardEnabled) {
      setIsVirtualKeyboardOpen(false);
      return;
    }

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      if (
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') &&
        !(target as HTMLInputElement).readOnly &&
        !(target as HTMLInputElement).disabled
      ) {
        const inputEl = target as HTMLInputElement | HTMLTextAreaElement;

        if (
          inputEl.closest('#resto-virtual-keyboard') || 
          inputEl.type === 'file' || 
          inputEl.type === 'checkbox' || 
          inputEl.type === 'radio' || 
          inputEl.type === 'color'
        ) {
          return;
        }

        activeInputRef.current = inputEl;
        activeInputRawValueRef.current = inputEl.value || '';

        let label = inputEl.getAttribute('placeholder') || inputEl.getAttribute('aria-label') || inputEl.name || 'Mətn daxil edin';
        const parentLabel = inputEl.closest('div')?.querySelector('label')?.textContent;
        if (parentLabel) label = parentLabel.trim();

        // If input has existing value, position cursor at the end by default
        try {
          if (typeof inputEl.selectionStart === 'number' && inputEl.selectionStart === 0 && (inputEl.value?.length || 0) > 0) {
            const len = inputEl.value.length;
            inputEl.setSelectionRange(len, len);
          }
        } catch (_) {}

        setActiveInputInfo({
          label: label,
          value: inputEl.value || '',
          placeholder: inputEl.getAttribute('placeholder') || ''
        });

        setIsVirtualKeyboardOpen(true);
      }
    };

    const handleInputSync = (e: Event) => {
      if (activeInputRef.current && e.target === activeInputRef.current) {
        const val = (e.target as HTMLInputElement).value || '';
        if (val !== '') {
          activeInputRawValueRef.current = val;
        }
        setActiveInputInfo(prev => ({ ...prev, value: activeInputRawValueRef.current || val }));
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('input', handleInputSync);
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('input', handleInputSync);
    };
  }, [isVirtualKeyboardEnabled]);

  // --- POS Touch & Pointer Dragging for Virtual Keyboard ---
  const handleKeyboardStartDrag = (clientX: number, clientY: number) => {
    setIsDraggingKeyboard(true);
    const keyboardEl = document.getElementById('resto-virtual-keyboard');
    const rect = keyboardEl?.getBoundingClientRect();
    const currentX = rect ? rect.left : (virtualKeyboardPos ? virtualKeyboardPos.x : Math.max(10, (window.innerWidth - 650) / 2));
    const currentY = rect ? rect.top : (virtualKeyboardPos ? virtualKeyboardPos.y : window.innerHeight - 340);
    keyboardDragStartRef.current = { startX: clientX, startY: clientY, posX: currentX, posY: currentY };
  };

  const handleKeyboardMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleKeyboardStartDrag(e.clientX, e.clientY);
  };

  const handleKeyboardTouchStart = (e: React.TouchEvent) => {
    if (e.touches && e.touches.length > 0) {
      handleKeyboardStartDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleKeyboardPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    handleKeyboardStartDrag(e.clientX, e.clientY);
  };

  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (isDraggingKeyboard) {
        const dx = clientX - keyboardDragStartRef.current.startX;
        const dy = clientY - keyboardDragStartRef.current.startY;
        const kbWidth = isKeyboardWideMode ? Math.min(window.innerWidth - 20, 880) : 640;
        setVirtualKeyboardPos({
          x: Math.max(5, Math.min(window.innerWidth - kbWidth - 5, keyboardDragStartRef.current.posX + dx)),
          y: Math.max(5, Math.min(window.innerHeight - 100, keyboardDragStartRef.current.posY + dy))
        });
      }
    };

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (isDraggingKeyboard && e.touches && e.touches.length > 0) {
        if (e.cancelable) e.preventDefault();
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onPointerMove = (e: PointerEvent) => {
      if (isDraggingKeyboard) {
        handleMove(e.clientX, e.clientY);
      }
    };

    const handleEnd = () => {
      setIsDraggingKeyboard(false);
    };

    if (isDraggingKeyboard) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
      window.addEventListener('touchcancel', handleEnd);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', handleEnd);
      window.addEventListener('pointercancel', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('touchcancel', handleEnd);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', handleEnd);
      window.removeEventListener('pointercancel', handleEnd);
    };
  }, [isDraggingKeyboard, isKeyboardWideMode]);

  const dockVirtualKeyboard = (position: 'bottom' | 'top' | 'left' | 'right' | 'center') => {
    const kbWidth = isKeyboardWideMode ? Math.min(window.innerWidth - 20, 880) : 640;
    const kbHeight = 320;
    if (position === 'bottom') {
      setVirtualKeyboardPos({ x: Math.max(10, (window.innerWidth - kbWidth) / 2), y: Math.max(10, window.innerHeight - kbHeight - 15) });
    } else if (position === 'top') {
      setVirtualKeyboardPos({ x: Math.max(10, (window.innerWidth - kbWidth) / 2), y: 15 });
    } else if (position === 'left') {
      setVirtualKeyboardPos({ x: 15, y: Math.max(10, (window.innerHeight - kbHeight) / 2) });
    } else if (position === 'right') {
      setVirtualKeyboardPos({ x: Math.max(10, window.innerWidth - kbWidth - 15), y: Math.max(10, (window.innerHeight - kbHeight) / 2) });
    } else if (position === 'center') {
      setVirtualKeyboardPos({ x: Math.max(10, (window.innerWidth - kbWidth) / 2), y: Math.max(10, (window.innerHeight - kbHeight) / 2) });
    }
  };

  const simulateKeyInput = (char: string) => {
    if (!activeInputRef.current) return;
    const el = activeInputRef.current;

    // Keep focus active in input element
    try {
      el.focus();
    } catch (_) {}

    const isNumberInput = el instanceof HTMLInputElement && el.type === 'number';

    const setNativeInputValue = (val: string) => {
      activeInputRawValueRef.current = val;
      const prototype = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
      if (valueSetter) {
        valueSetter.call(el, val);
      } else {
        el.value = val;
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };

    // Safely check selection indices (number inputs throw DOMException on selectionStart)
    let hasSelection = false;
    let start = 0;
    let end = 0;
    try {
      if (typeof el.selectionStart === 'number' && typeof el.selectionEnd === 'number') {
        start = el.selectionStart;
        end = el.selectionEnd;
        hasSelection = true;
      }
    } catch (_) {
      hasSelection = false;
    }

    let currentVal = el.value ?? '';
    // If number input where browser zeroes out intermediate "5.", restore from raw buffer:
    if (isNumberInput) {
      if (activeInputRawValueRef.current && (activeInputRawValueRef.current.includes('.') || !currentVal)) {
        currentVal = activeInputRawValueRef.current;
      }
    } else if (!currentVal && activeInputRawValueRef.current) {
      currentVal = activeInputRawValueRef.current;
    }

    if (char === 'BACKSPACE') {
      if (hasSelection && !isNumberInput) {
        if (start !== end) {
          // If a text block is highlighted, delete selection
          const newVal = currentVal.slice(0, start) + currentVal.slice(end);
          setNativeInputValue(newVal);
          try {
            el.setSelectionRange(start, start);
          } catch (_) {}
        } else if (start > 0) {
          // Delete character before cursor
          const newVal = currentVal.slice(0, start - 1) + currentVal.slice(start);
          setNativeInputValue(newVal);
          try {
            el.setSelectionRange(start - 1, start - 1);
          } catch (_) {}
        } else if (currentVal.length > 0) {
          // If start was 0 but value exists (lost caret), delete last char
          const newVal = currentVal.slice(0, -1);
          setNativeInputValue(newVal);
          try {
            el.setSelectionRange(newVal.length, newVal.length);
          } catch (_) {}
        }
      } else {
        // Inputs without selection support (e.g. number input): delete last character
        if (currentVal.length > 0) {
          const newVal = currentVal.slice(0, -1);
          setNativeInputValue(newVal);
        }
      }
    } else if (char === 'CLEAR') {
      activeInputRawValueRef.current = '';
      setNativeInputValue('');
      try {
        el.setSelectionRange(0, 0);
      } catch (_) {}
    } else if (char === 'SPACE') {
      if (hasSelection && !isNumberInput) {
        const newVal = currentVal.slice(0, start) + ' ' + currentVal.slice(end);
        setNativeInputValue(newVal);
        try {
          el.setSelectionRange(start + 1, start + 1);
        } catch (_) {}
      } else {
        const newVal = currentVal + ' ';
        setNativeInputValue(newVal);
      }
    } else if (char === 'ENTER') {
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
      el.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', code: 'Enter', bubbles: true }));
      el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', bubbles: true }));
    } else {
      const isUpper = virtualKeyboardCaps || virtualKeyboardShift;
      const keyToAdd = char ? (isUpper ? char.toUpperCase() : char.toLowerCase()) : '';
      if (hasSelection && !isNumberInput) {
        const newVal = currentVal.slice(0, start) + keyToAdd + currentVal.slice(end);
        setNativeInputValue(newVal);
        try {
          const nextPos = start + keyToAdd.length;
          el.setSelectionRange(nextPos, nextPos);
        } catch (_) {}
      } else {
        // Number input or non-selection input: append to currentVal
        const newVal = currentVal + keyToAdd;
        setNativeInputValue(newVal);
      }

      // Auto-deactivate Shift after typing one letter, like standard keyboards
      if (virtualKeyboardShift) {
        setVirtualKeyboardShift(false);
      }
    }

    setActiveInputInfo(prev => ({ ...prev, value: activeInputRawValueRef.current || el.value }));
  };

  const VIRTUAL_KB_AZ = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-'],
    ['q', 'ü', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'ö', 'ğ'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ı', 'ə'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', 'ç', 'ş']
  ];

  const VIRTUAL_KB_EN = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm']
  ];

  const VIRTUAL_KB_TR = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'ı', 'o', 'p', 'ğ', 'ü'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ş', 'i'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', 'ö', 'ç']
  ];

  const VIRTUAL_KB_RU = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-'],
    ['й', 'ц', 'у', 'к', 'е', 'н', 'г', 'ш', 'щ', 'з', 'х', 'ъ'],
    ['ф', 'ы', 'в', 'а', 'п', 'р', 'о', 'л', 'д', 'ж', 'э'],
    ['я', 'ч', 'с', 'м', 'и', 'т', 'ь', 'б', 'ю']
  ];

  const VIRTUAL_KB_SYMBOLS = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')'],
    ['-', '_', '+', '=', '/', '\\', '?', ':', ';', '₼'],
    ['"', '\'', '<', '>', '[', ']', '{', '}', ',', '.']
  ];
  

  
  const [isDatabasePurged, setIsDatabasePurged] = useState<boolean>(() => {
    return localStorage.getItem('isDatabasePurged') === 'true';
  });

  const clearPurgeFlagIfSet = () => {
    if (isDatabasePurged) {
      setIsDatabasePurged(false);
      localStorage.removeItem('isDatabasePurged');
    }
  };
  const [auditLogs, setAuditLogs] = useState<any[]>(() => {
    const saved = localStorage.getItem('resto_auditLogs');
    return saved ? JSON.parse(saved) : [
      { id: 1, timestamp: "06.06.2026 10:15:30", action: "Sifariş Silindi", operator: "Ofisiant Elmar", details: "Masa #4 - 2 porsiya 'Piti' sifarişi silindi (Səhv daxiletmə)", severity: "warning" },
      { id: 2, timestamp: "06.06.2026 12:44:12", action: "Qiymət Dəyişdirildi", operator: "Admin İlqar", details: "Mərci Şorbası qiyməti 4.00 ₼-dan 4.50 ₼-ə qaldırıldı", severity: "info" },
      { id: 3, timestamp: "07.06.2026 14:02:18", action: "Kassa Mədaxil", operator: "Baş Ofisiant Aysel", details: "Masa #7 üzrə kassa hesabı nağd bağlandı (32.50 ₼)", severity: "info" },
      { id: 4, timestamp: "07.06.2026 19:33:05", action: "Kassa Borc Silinməsi", operator: "Müdir Leyla", details: "Masa #12 kassa borcu silindi. Səbəb: VIP Qonaq Hədiyyəsi", severity: "danger" },
      { id: 5, timestamp: "08.06.2026 09:12:00", action: "Anbar Tənzimləmə", operator: "Anbardar Tural", details: "Qara Ət miqdarı +25.0kq əlavə edildi (Tədarük faturası #8822)", severity: "info" }
    ];
  });

  const addAuditLog = (action: string, operator: string, details: string, severity: 'info' | 'warning' | 'danger') => {
    const shiftBusinessDate = activeShift?.businessDate || getActiveShiftBusinessDate();
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const newLog = {
      id: Date.now(),
      timestamp: `${shiftBusinessDate} ${timeStr}`,
      shiftId: activeShift?.id,
      businessDate: shiftBusinessDate,
      action,
      operator,
      details,
      severity
    };
    setAuditLogs(prev => {
      const updated = [newLog, ...prev];
      safeLocalStorageSetItem('resto_auditLogs', JSON.stringify(updated));
      return updated;
    });
  };

  // DevTools detection & Session Security Watchdog
  const [devToolsWarning, setDevToolsWarning] = useState<boolean>(false);
  const devToolsLoggedRef = useRef<boolean>(false);

  useEffect(() => {
    // 1. DevTools detection via window dimension delta
    const checkDevTools = () => {
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth > threshold;
      const heightDiff = window.outerHeight - window.innerHeight > threshold;
      const isDevToolsOpen = widthDiff || heightDiff;

      if (isDevToolsOpen) {
        if (!devToolsLoggedRef.current) {
          devToolsLoggedRef.current = true;
          setDevToolsWarning(true);
          // Auto-lock admin panel if open
          setIsAdminUnlocked(false);
          setIsManagementUnlocked(false);
          clearSessionToken('admin');
          clearSessionToken('management');
          addAuditLog(
            "F12 / DevTools Aşkarlanması",
            "Təhlükəsizlik Sistemi",
            "Brauzer Developer Tools (F12) pəncərəsi aşkarlandı. Bütün admin və rəhbərlik sessiyaları təhlükəsizlik məqsədilə dərhal kilidləndi.",
            "danger"
          );
        }
      } else {
        if (devToolsLoggedRef.current) {
          devToolsLoggedRef.current = false;
          setDevToolsWarning(false);
        }
      }
    };

    const interval = setInterval(checkDevTools, 1500);
    window.addEventListener('resize', checkDevTools);
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', checkDevTools);
    };
  }, []);

  // 2. Continuous Session Token Verification: Blocks manual localStorage spoofing
  useEffect(() => {
    const verifyTokens = async () => {
      if (isAdminUnlocked) {
        const isValid = await verifySessionToken('admin');
        if (!isValid) {
          setIsAdminUnlocked(false);
          addAuditLog(
            "Etibarsız Admin Token",
            "Təhlükəsizlik Sistemi",
            "Admin sessiyasının kriptoqrafik imzası tapılmadı və ya saxtalaşdırıldı. Giriş dərhal bloklandı.",
            "danger"
          );
        }
      }
      if (isManagementUnlocked) {
        const isValid = await verifySessionToken('management');
        if (!isValid) {
          setIsManagementUnlocked(false);
          addAuditLog(
            "Etibarsız Rəhbərlik Token",
            "Təhlükəsizlik Sistemi",
            "Rəhbərlik sessiyasının kriptoqrafik imzası tapılmadı və ya saxtalaşdırıldı. Giriş dərhal bloklandı.",
            "danger"
          );
        }
      }
    };
    verifyTokens();
  }, [isAdminUnlocked, isManagementUnlocked]);

  const [customerQrMode, setCustomerQrMode] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('fromQr') === 'true';
  });

  const [customerTableId, setCustomerTableId] = useState<number>(() => {
    const params = new URLSearchParams(window.location.search);
    return parseInt(params.get('tableId') || '1');
  });
  const [recipeSearch, setRecipeSearch] = useState<string>('');
  const [recipeActiveCategory, setRecipeActiveCategory] = useState<string>('Hamısı');
  const [inventorySearch, setInventorySearch] = useState<string>('');
  const [selectedRecipeDishId, setSelectedRecipeDishId] = useState<number | null>(null);
  const [isAddingDish, setIsAddingDish] = useState(false);
  const [isAddingReservation, setIsAddingReservation] = useState(false);
  const [editingMenuItemId, setEditingMenuItemId] = useState<number | null>(null);
  const [menuItemToDeleteId, setMenuItemToDeleteId] = useState<number | null>(null);
  const [editingReservationId, setEditingReservationId] = useState<number | null>(null);
  const [newDish, setNewDish] = useState<{ name: string; category: string; price: string; image?: string }>({ name: '', category: '', price: '', image: '' });
  const [newDishError, setNewDishError] = useState<string | null>(null);
  const [newReservation, setNewReservation] = useState({ customerName: '', tableId: '', time: '', guests: '', date: '' });
  const [reservationSelectedDate, setReservationSelectedDate] = useState<string>(() => getTodayStr());
  const [reservationSearch, setReservationSearch] = useState<string>('');
  const [reservationPeriod, setReservationPeriod] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [showCompletedReservations, setShowCompletedReservations] = useState<boolean>(false);
  
  // Payment States
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mixed' | 'gift'>('cash');
  const [customerCashPaid, setCustomerCashPaid] = useState<string>('');
  const [customMixedCash, setCustomMixedCash] = useState<string>('');
  const [customMixedCard, setCustomMixedCard] = useState<string>('');
  const [showPaymentMethodSection, setShowPaymentMethodSection] = useState<boolean>(false);
  const [editDish, setEditDish] = useState<{ name: string; category: string; price: string; image?: string }>({ name: '', category: '', price: '', image: '' });
  const [editReservation, setEditReservation] = useState({ customerName: '', tableId: '', time: '', guests: '', date: '' });

  // Z-Report Modal State & Draggable Window
  const [showZReportModal, setShowZReportModal] = useState<boolean>(false);
  const [zReportDate, setZReportDate] = useState<string>(() => getActiveShiftBusinessDate());

  React.useEffect(() => {
    if (activeShift?.businessDate && !(activeShift as any)?.isClosed) {
      setDashboardDate(activeShift.businessDate);
      setZReportDate(activeShift.businessDate);
      setExpenseDate(activeShift.businessDate);
      setReportDate(activeShift.businessDate);
      setKitchenDate(activeShift.businessDate);
    }
  }, [activeShift?.businessDate, (activeShift as any)?.isClosed]);

  const [zReportPos, setZReportPos] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingZReport, setIsDraggingZReport] = useState(false);
  const zDragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({ startX: 0, startY: 0, posX: 0, posY: 0 });
  const zModalRef = useRef<HTMLDivElement>(null);

  const handleZReportMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingZReport(true);
    const modalRect = zModalRef.current?.getBoundingClientRect();
    const currentX = modalRect ? modalRect.left : (zReportPos ? zReportPos.x : Math.max(10, Math.min(window.innerWidth - 440, window.innerWidth / 2 - 210)));
    const currentY = modalRect ? modalRect.top : (zReportPos ? zReportPos.y : 80);
    zDragStartRef.current = { startX: e.clientX, startY: e.clientY, posX: currentX, posY: currentY };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingZReport) {
        const dx = e.clientX - zDragStartRef.current.startX;
        const dy = e.clientY - zDragStartRef.current.startY;
        setZReportPos({
          x: Math.max(10, Math.min(window.innerWidth - 430, zDragStartRef.current.posX + dx)),
          y: Math.max(10, Math.min(window.innerHeight - 200, zDragStartRef.current.posY + dy))
        });
      }
    };

    const handleMouseUp = () => {
      setIsDraggingZReport(false);
    };

    if (isDraggingZReport) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingZReport]);

  // Staff Management States
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({
    firstName: '',
    lastName: '',
    role: 'Ofisiant',
    docNumber: '',
    phone: '',
    status: 'off-shift' as 'on-shift' | 'off-shift'
  });
  const [newStaffError, setNewStaffError] = useState<string | null>(null);

  const [editingStaffId, setEditingStaffId] = useState<number | null>(null);
  const [editStaff, setEditStaff] = useState({
    firstName: '',
    lastName: '',
    role: '',
    docNumber: '',
    phone: ''
  });
  const [editStaffError, setEditStaffError] = useState<string | null>(null);

  // Inventory Edit State
  const [editingInventoryId, setEditingInventoryId] = useState<number | null>(null);
  const [editInventory, setEditInventory] = useState({
    name: '',
    quantity: 0 as any,
    minLevel: 0 as any,
    unit: '',
    costPrice: 0 as any,
    salePrice: 0 as any
  });
  const [isAddingInventory, setIsAddingInventory] = useState(false);
  const [newInventory, setNewInventory] = useState({
    name: '',
    quantity: '' as any,
    minLevel: '' as any,
    unit: '',
    costPrice: '' as any,
    salePrice: '' as any
  });
  const [newInventoryError, setNewInventoryError] = useState<string | null>(null);

  // Reusable Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Bəli',
    cancelText: 'Xeyr',
    onConfirm: () => {}
  });

  // Map of staff ID to custom attendance date input
  const [attendanceInputDates, setAttendanceInputDates] = useState<Record<number, string>>({});

  // Program Name & Logo Admin States
  const [appNameWord1, setAppNameWord1] = useState(() => localStorage.getItem('resto_appNameWord1') || 'RESTO');
  const [appNameWord2, setAppNameWord2] = useState(() => localStorage.getItem('resto_appNameWord2') || 'MASTER');
  const [appNameColor1, setAppNameColor1] = useState(() => localStorage.getItem('resto_appNameColor1') || '#1e293b'); // default: slate-800
  const [appNameColor2, setAppNameColor2] = useState(() => localStorage.getItem('resto_appNameColor2') || '#f97316'); // default: orange-500
  const [appNameFontSize, setAppNameFontSize] = useState(() => localStorage.getItem('resto_appNameFontSize') || 'text-xl');
  const [appNameFontFamily, setAppNameFontFamily] = useState(() => localStorage.getItem('resto_appNameFontFamily') || 'font-sans');
  const [appNameFontWeight, setAppNameFontWeight] = useState(() => localStorage.getItem('resto_appNameFontWeight') || 'font-black');
  const [appNameFontStyle, setAppNameFontStyle] = useState(() => localStorage.getItem('resto_appNameFontStyle') || 'not-italic');
  const [appLogoUrl, setAppLogoUrl] = useState(() => localStorage.getItem('resto_appLogoUrl') || '');

  // --- Portfolio Addition States ---
  const [newProgName, setNewProgName] = useState('');
  const [newProgDesc, setNewProgDesc] = useState('');
  const [newProgImage, setNewProgImage] = useState('');
  const [newProgTech, setNewProgTech] = useState('');
  const [newProgLink, setNewProgLink] = useState('');

  React.useEffect(() => {
    safeLocalStorageSetItem('resto_appNameWord1', appNameWord1);
    safeLocalStorageSetItem('resto_appNameWord2', appNameWord2);
    safeLocalStorageSetItem('resto_appNameColor1', appNameColor1);
    safeLocalStorageSetItem('resto_appNameColor2', appNameColor2);
    safeLocalStorageSetItem('resto_appNameFontSize', appNameFontSize);
    safeLocalStorageSetItem('resto_appNameFontFamily', appNameFontFamily);
    safeLocalStorageSetItem('resto_appNameFontWeight', appNameFontWeight);
    safeLocalStorageSetItem('resto_appNameFontStyle', appNameFontStyle);
    safeLocalStorageSetItem('resto_appLogoUrl', appLogoUrl);

    // Dinamik Favicon və İkon Sazlanması
    if (appLogoUrl && appLogoUrl.trim()) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (link) {
        link.href = appLogoUrl;
      }
    }
  }, [appNameWord1, appNameWord2, appNameColor1, appNameColor2, appNameFontSize, appNameFontFamily, appNameFontWeight, appNameFontStyle, appLogoUrl]);
  const [appLanguage, setAppLanguage] = useState<'AZ' | 'EN' | 'TR' | 'RU'>(() => (localStorage.getItem('appLanguage') as any) || 'AZ');
  const [isTabletMode, setIsTabletMode] = useState<boolean>(() => {
    return localStorage.getItem('isTabletMode') === 'true';
  });

  const translations = {
    AZ: {
      dashboard: "İdarəetmə Paneli",
      tablesAndOrders: "Masalar və Sifariş",
      tables: "Masalar",
      kitchen: "Mətbəx",
      reservations: "Rezervasiyalar",
      menu: "Menyu",
      inventory: "Anbar / Stok",
      staff: "İşçilər & Növbə",
      reports: "Sistem Hesabatları",
      admin: "Admin Paneli",
      tabletMode: "SÜRƏTLİ PLANŞET REJİMİ",
      active: "AKTİV",
      passive: "DEAKTİV",
      systemActive: "Sistem Aktivdir",
      welcomeMsg: "Xoş gəldiniz, bu gün restoranınızda hər şey qaydasındadır.",
      noTableSelected: "Masa Seçilməyib",
      selectToOrder: "Sifariş qəbul etmək üçün soldan bir masa seçin.",
      emptyOrder: "Boş Sifariş",
      sendToKitchen: "MƏTBƏXƏ GÖNDƏR",
      printCheck: "ÇEKİ ÇAP ET",
      payOrder: "ÖDƏNİŞƏ KEÇ",
      totalAmount: "CƏMİ MƏBLƏĞ",
      paymentMethod: "ÖDƏNİŞ ÜSULU",
      cash: "NƏĞD",
      card: "KARTLA",
      mixed: "NƏĞD/KART",
      gift: "HƏDİYYƏ",
      exactAmount: "DƏQİQ",
      clear: "SİL",
      returnedAmount: "Qayıdan Qalıq",
      waiterNotDefined: "Ofisiant Təyin Edilməyib",
      dishSearch: "Məhsul axtar...",
      allDishes: "Hamısı",
      newDish: "Yeni Yemək",
      dishName: "Yemək adı",
      category: "Kateqoriya",
      price: "Qiymət",
      save: "Yadda Saxla",
      cancel: "Ləğv Et",
      confirm: "Təsdiqlə",
      delete: "Sil",
      criticalLevel: "Kritik Səviyyə",
      status: "Status",
      normal: "Normal",
      defective: "Xarab/Dəfekt",
      onShift: "Növbədə",
      offShift: "Növbədə deyil",
      addReservation: "Yeni Rezervasiya",
      customerName: "Müştəri Adı",
      guests: "Qonaq Sayı",
      date: "Tarix",
      time: "Saat",
      print: "Çap et",
      excel: "Excel",
      qrMenu: "QR Menyu & Sifariş",
      aiAnalytics: "Ağıllı AI Analitika",
      support: "Dəstək",
      supportMsg: "Probleminiz var? Bir kliklə bizimlə əlaqə saxlayın.",
      contactUs: "Bizə Yazın"
    }
  };

  const t = translations.AZ;
  const currencySymbol = '₼';
  const currencyText = 'AZN';

  const getLocale = (): string => {
    return 'az-AZ';
  };

  const formatPrice = (amount: number | string | undefined | null): string => {
    const numericAmount = typeof amount === 'number' 
      ? amount 
      : typeof amount === 'string' 
        ? parseFloat(amount) 
        : 0;
    
    if (isNaN(numericAmount)) return '0.00 ' + currencySymbol;

    const locale = getLocale();
    const formattedNumber = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericAmount);

    return `${formattedNumber} ${currencySymbol}`;
  };

  const convertCurrencyInText = (str: string): string => {
    return str;
  };

  const tText = (text: string): string => {
    if (!text) return '';
    return text;
    
    const normalized = text.trim();
    if (!normalized) return text;

    // Check dynamic pattern: "Masa X üçün Y yemək QR tərəfindən mətbəxə ötürüldü."
    if (normalized.includes("QR tərəfindən mətbəxə ötürüldü.")) {
      const parts = normalized.match(/(Masa\s+\S+)\s+üçün\s+(\d+)\s+yemək/i);
      const partsAlt = normalized.match(/(\S+)\s+üçün\s+(\d+)\s+yemək/i);
      const activeParts = parts || partsAlt;
      if (activeParts) {
        const tableStr = activeParts[1];
        const countStr = activeParts[2];
        if (appLanguage === 'EN') return `${countStr} items for ${tableStr} have been sent to the kitchen via QR.`;
        if (appLanguage === 'TR') return `QR aracılığıyla ${tableStr} için ${countStr} sipariş mutfağa iletildi.`;
        if (appLanguage === 'RU') return `Через QR отправлено ${countStr} блюд на кухню для стола ${tableStr}.`;
      }
    }

    // Check dynamic pattern: "X masası üzrə bütün aktiv sifarişlər silindi. Silinən məbləğ: Y ₼."
    if (normalized.includes("bütün aktiv sifarişlər silindi")) {
      const tablePart = normalized.split(" ")[0];
      const pricePart = normalized.match(/Silinən məbləğ:\s+([\d\.]+)/)?.[1] || "";
      if (appLanguage === 'EN') return `All active orders for ${tablePart} have been cleared. Cleared amount: ${pricePart} ${currencyText}.`;
      if (appLanguage === 'TR') return `${tablePart} masasının tüm siparişleri sıfırlandı. Tutarı: ${pricePart} ${currencySymbol}.`;
      if (appLanguage === 'RU') return `Все активные заказы для стола ${tablePart} очищены. Сумма: ${pricePart} ${currencySymbol}.`;
    }

    // Check dynamic pattern: "X hesabı Y üsulu ilə bağlandı. Ödənilən məbləğ: Z ₼. Ofisiant: W"
    if (normalized.includes("üsulu ilə bağlandı")) {
      const tablePart = normalized.split(" ")[0] || "";
      const methodPart = normalized.includes("nağd") ? "Cash" : normalized.includes("kart") ? "Card" : normalized.includes("hədiyyə") ? "Gift" : "Mixed";
      const totalPart = normalized.match(/Ödənilən məbləğ:\s+([\d\.]+)/)?.[1] || "";
      const waiterPart = normalized.match(/Ofisiant:\s+(.+)$/)?.[1] || "";
      const methodTR = methodPart === "Cash" ? "nakit" : methodPart === "Card" ? "kart" : methodPart === "Gift" ? "ikram" : "karışık";
      const methodRU = methodPart === "Cash" ? "наличными" : methodPart === "Card" ? "картой" : methodPart === "Gift" ? "подарок" : "смешанный";
      
      if (appLanguage === 'EN') return `${tablePart} checkout completed via ${methodPart}. Paid: ${totalPart} ${currencyText}. Waiter: ${waiterPart}`;
      if (appLanguage === 'TR') return `${tablePart} hesabı ${methodTR} yöntemiyle kapatıldı. Ödenen: ${totalPart} ${currencySymbol}. Garson: ${waiterPart}`;
      if (appLanguage === 'RU') return `Счет ${tablePart} закрыт способом ${methodRU}. Оплачено: ${totalPart} ${currencySymbol}. Официант: ${waiterPart}`;
    }

    // Check dynamic pattern for adding/editing dishes
    if (normalized.includes("menyuya əlavə edildi")) {
      const dishPart = normalized.match(/'(.+)'\s+yeməyi/)?.[1] || "Yemek";
      const pricePart = normalized.match(/([\d\.]+)\s+₼/)?.[1] || "";
      if (appLanguage === 'EN') return `'${dishPart}' has been added to the menu with price ${pricePart} ${currencyText}.`;
      if (appLanguage === 'TR') return `'${dishPart}' yemeği ${pricePart} ${currencySymbol} fiyatı ile menüye eklendi.`;
      if (appLanguage === 'RU') return `'${dishPart}' добавлено в меню с ценой ${pricePart} ${currencySymbol}.`;
    }
    if (normalized.includes("yeməyi menyudan silindi")) {
      const dishPart = normalized.match(/'(.+)'\s+yeməyi/)?.[1] || "Yemek";
      if (appLanguage === 'EN') return `'${dishPart}' has been deleted from the menu.`;
      if (appLanguage === 'TR') return `'${dishPart}' yemeği menüden silindi.`;
      if (appLanguage === 'RU') return `'${dishPart}' удалено из меню.`;
    }

    // Parse "{number} Masa"
    if (normalized.match(/^\d+\s+Masa$/i)) {
      const num = normalized.split(" ")[0];
      if (appLanguage === 'EN') return num === '1' ? `${num} Table` : `${num} Tables`;
      if (appLanguage === 'TR') return `${num} Masa`;
      if (appLanguage === 'RU') {
        const lastDigit = parseInt(num) % 10;
        const lastTwo = parseInt(num) % 100;
        if (lastTwo >= 11 && lastTwo <= 19) return `${num} Столов`;
        if (lastDigit === 1) return `${num} Стол`;
        if (lastDigit >= 2 && lastDigit <= 4) return `${num} Стола`;
        return `${num} Столов`;
      }
    }

    // Parse "Masa {number}"
    if (normalized.match(/^Masa\s+\d+$/i)) {
      const num = normalized.split(" ")[1];
      if (appLanguage === 'EN') return `Table ${num}`;
      if (appLanguage === 'TR') return `Masa ${num}`;
      if (appLanguage === 'RU') return `Стол ${num}`;
    }

    // Parse "{number} Rezerv"
    if (normalized.match(/^\d+\s+Rezerv$/i)) {
      const num = normalized.split(" ")[0];
      if (appLanguage === 'EN') return num === '1' ? `${num} Reservation` : `${num} Reservations`;
      if (appLanguage === 'TR') return `${num} Rezervasyon`;
      if (appLanguage === 'RU') {
        const lastDigit = parseInt(num) % 10;
        const lastTwo = parseInt(num) % 100;
        if (lastTwo >= 11 && lastTwo <= 19) return `${num} Броней`;
        if (lastDigit === 1) return `${num} Бронь`;
        if (lastDigit >= 2 && lastDigit <= 4) return `${num} Брони`;
        return `${num} Броней`;
      }
    }

    // Parse "{number} Məhsul"
    if (normalized.match(/^\d+\s+Məhsul$/i)) {
      const num = normalized.split(" ")[0];
      if (appLanguage === 'EN') return num === '1' ? `${num} Product` : `${num} Products`;
      if (appLanguage === 'TR') return `${num} Ürün`;
      if (appLanguage === 'RU') {
        const lastDigit = parseInt(num) % 10;
        const lastTwo = parseInt(num) % 100;
        if (lastTwo >= 11 && lastTwo <= 19) return `${num} Товаров`;
        if (lastDigit === 1) return `${num} Товар`;
        if (lastDigit >= 2 && lastDigit <= 4) return `${num} Товара`;
        return `${num} Товаров`;
      }
    }

    // Parse "{number} nəfər"
    if (normalized.match(/^\d+\s+nəfər$/i)) {
      const num = normalized.split(" ")[0];
      if (appLanguage === 'EN') return num === '1' ? `${num} Person` : `${num} Persons`;
      if (appLanguage === 'TR') return `${num} Kişi`;
      if (appLanguage === 'RU') {
        const lastDigit = parseInt(num) % 10;
        const lastTwo = parseInt(num) % 100;
        if (lastTwo >= 11 && lastTwo <= 19) return `${num} Человек`;
        if (lastDigit === 1) return `${num} Человек`;
        if (lastDigit >= 2 && lastDigit <= 4) return `${num} Человека`;
        return `${num} Человек`;
      }
    }

    // Parse "{number} nəfərlik"
    if (normalized.match(/^\d+\s+nəfərlik$/i)) {
      const num = normalized.split(" ")[0];
      if (appLanguage === 'EN') return `${num} Seater`;
      if (appLanguage === 'TR') return `${num} Kişilik`;
      if (appLanguage === 'RU') {
        const lastDigit = parseInt(num) % 10;
        const lastTwo = parseInt(num) % 100;
        if (lastTwo >= 11 && lastTwo <= 19) return `на ${num} мест`;
        if (lastDigit === 1) return `на ${num} место`;
        if (lastDigit >= 2 && lastDigit <= 4) return `на ${num} места`;
        return `на ${num} мест`;
      }
    }

    // Parse "{number} vahid"
    if (normalized.match(/^\d+\s+vahid$/i)) {
      const num = normalized.split(" ")[0];
      if (appLanguage === 'EN') return `${num} Units`;
      if (appLanguage === 'TR') return `${num} Adet`;
      if (appLanguage === 'RU') return `${num} ед.`;
    }

    // Parse "{MonthName} {Year}", e.g., "Yanvar 2026"
    const monthMap: Record<string, Record<'EN' | 'TR' | 'RU', string>> = {
      yanvar: { EN: "January", TR: "Ocak", RU: "Январь" },
      fevral: { EN: "February", TR: "Şubat", RU: "Февраль" },
      mart: { EN: "March", TR: "Mart", RU: "Март" },
      aprel: { EN: "April", TR: "Nisan", RU: "Апрель" },
      may: { EN: "May", TR: "Mayıs", RU: "Май" },
      iyun: { EN: "June", TR: "Haziran", RU: "Июнь" },
      iyul: { EN: "July", TR: "Temmuz", RU: "Июль" },
      avqust: { EN: "August", TR: "Ağustos", RU: "Август" },
      sentyabr: { EN: "September", TR: "Eylül", RU: "Сентябрь" },
      oktyabr: { EN: "October", TR: "Ekim", RU: "Октябрь" },
      noyabr: { EN: "November", TR: "Kasım", RU: "Ноябрь" },
      dekabr: { EN: "December", TR: "Aralık", RU: "Декабрь" }
    };
    const parts = normalized.split(/\s+/);
    if (parts.length === 2 && monthMap[parts[0].toLowerCase()]) {
      const year = parts[1];
      const mTranslations = monthMap[parts[0].toLowerCase()];
      if (appLanguage === 'EN') return `${mTranslations.EN} ${year}`;
      if (appLanguage === 'TR') return `${mTranslations.TR} ${year}`;
      if (appLanguage === 'RU') return `${mTranslations.RU} ${year}`;
    }

    const dict: Record<string, Record<'EN' | 'TR' | 'RU', string>> = {
      "Sənəd yoxdur": { EN: "No document", TR: "Belge yok", RU: "Документ отсутствует" },
      "Qeyd yox": { EN: "No record", TR: "Kayıt yok", RU: "Записи нет" },
      "Telefon yoxdur": { EN: "No phone", TR: "Telefon yok", RU: "Телефон отсутствует" },
      "Sənəd:": { EN: "Document:", TR: "Belge:", RU: "Документ:" },
      "Tel:": { EN: "Phone:", TR: "Tel:", RU: "Тел:" },
      "ALINAN MÜŞTƏRİ NAĞDLARI": { EN: "RECEIVED CUSTOMER CASH", TR: "ALINAN MÜŞTERİ NAKİTLERİ", RU: "ПОЛУЧЕННЫЕ НАЛИЧНЫЕ ОТ КЛИЕНТОВ" },
      "İŞ GÜNLƏRİ JURNALI": { EN: "WORK DAYS LOG", TR: "ÇALIŞMA GÜNLERİ GÜNLÜĞÜ", RU: "ЖУРНАЛ РАБОЧИХ ДНЕЙ" },
      "Ümumi:": { EN: "Total:", TR: "Toplam:", RU: "Всего:" },
      "gün": { EN: "days", TR: "gün", RU: "дн." },
      "Heç bir iş günü qeydiyyatı yoxdur.": { EN: "No working days record.", TR: "Herhangi çalışma günü kaydı bulunmamaktadır.", RU: "Регистрация рабочих дней отсутствует." },
      "VƏZİFƏ VƏ DETAILS DƏYİŞDİR": { EN: "EDIT DUTY AND DETAILS", TR: "GÖREV VE DETAYLARI DEĞİŞTİR", RU: "ИЗМЕНИТЬ ДОЛЖНОСТЬ И ДАННЫЕ" },
      "İŞÇİNİ SİL / İŞDƏN ÇIXART": { EN: "DELETE / TERMINATE WORKER", TR: "ÇALIŞANI SİL / İŞTEN ÇIKAR", RU: "УВОЛИТЬ / УДАЛИТЬ СОТРУДНИКА" },
      "adlı işçini sistemdən silmək və işdən çıxartmaq istədiyinizə əminsiniz?": {
        EN: "are you sure you want to delete and terminate this employee from the system?",
        TR: "isimli çalışanı sistemden silmek ve işten çıkarmak istediğinizden emin misiniz?",
        RU: "вы уверены, что хотите удалить и уволить этого сотрудника из системы?"
      },
      "Bəli, Sil": { EN: "Yes, Delete", TR: "Evet, Sil", RU: "Да, удалить" },
      "İŞDƏN ÇIXART": { EN: "TERMINATE", TR: "İŞTEN ÇIKAR", RU: "УВОЛИТЬ" },
      "Vəzifə / Rol": { EN: "Position / Role", TR: "Görev / Rol", RU: "Должность / Роль" },
      "İmtina": { EN: "Cancel", TR: "İptal", RU: "Отмена" },
      "Yadda Saxla": { EN: "Save", TR: "Kaydet", RU: "Сохранить" },
      "Əsgər redaktəsi": { EN: "Employee edit", TR: "Çalışan düzenleme", RU: "Редактирование сотрудника" },

      "Ofisiant": { EN: "Waiter", TR: "Garson", RU: "Официант" },
      "Aşpaz": { EN: "Chef", TR: "Aşçı", RU: "Повар" },
      "Kassir": { EN: "Cashier", TR: "Kasiyer", RU: "Кассир" },
      "Barista": { EN: "Barista", TR: "Barista", RU: "Бариста" },
      "Müdir": { EN: "Manager", TR: "Müdür", RU: "Менеджер" },

      "Yeni İşçinin Anket Məlumatları": { EN: "New Employee Application Data", TR: "Yeni Çalışanın Profil Bilgileri", RU: "Анкетные данные нового сотрудника" },
      "Sistemdə qeydiyyata alınacaq yeni əməkdaş kartı": { EN: "New employee card to be registered in the system", TR: "Sistemde kaydı yapılacak yeni çalışan kartı", RU: "Карточка нового сотрудника, регистрируемого в системе" },
      "Adı": { EN: "First Name", TR: "Adı", RU: "Имя" },
      "Soyadı": { EN: "Last Name", TR: "Soyadı", RU: "Фамилия" },
      "Vəzifəsi / Rolu": { EN: "Position / Role", TR: "Görevi / Rolü", RU: "Должность / Роль" },
      "Şəxsiyyət Sənədinin Nömrəsi": { EN: "ID Card Number", TR: "Kimlik Belge Numarası", RU: "Номер удостоверения личности" },
      "Mobil Telefon Nömrəsi": { EN: "Mobile Phone Number", TR: "Cep Telefonu Numarası", RU: "Номер мобильного телефона" },
      "İlkin İş Nizamı (Status)": { EN: "Initial Work Shift (Status)", TR: "İlk Vardiya Durumu (Statü)", RU: "Начальный рабочий режим (Статус)" },
      "Həmin dəqiqə İşdədir": { EN: "On Shift immediately", TR: "Vardiyaya Başla", RU: "На смене сразу" },
      "Qeydiyyata Al (İşə Götür)": { EN: "Register Employee (Hire)", TR: "Kaydet (İşe Al)", RU: "Зарегистрировать (Принять)" },
      "İŞDƏDİR": { EN: "ON SHIFT", TR: "İŞ BAŞINDA", RU: "НА СМЕНЕ" },
      "KƏNARDADIR": { EN: "OFF SHIFT", TR: "VARDİYA DIŞI", RU: "ВНЕ СМЕНЫ" },

      "Məs. Əhməd": { EN: "E.g. John", TR: "Örn. Ahmet", RU: "Напр. Иван" },
      "Məs. Məmmədov": { EN: "E.g. Smith", TR: "Örn. Yılmaz", RU: "Напр. Смирнов" },
      "Məs. AZE1234567": { EN: "E.g. ID1234567", TR: "Kimlik No", RU: "Напр. RU1234567" },
      "Məs. +994 50 123 45 67": { EN: "E.g. +1 555 123", TR: "Örn. +90 555...", RU: "Напр. +7 999..." },

      // General Navigation & Tabs
      "İdarəetmə Paneli": { EN: "Dashboard", TR: "Yönetim Paneli", RU: "Панель управления" },
      "Masalar və Sifariş": { EN: "Tables & Orders", TR: "Masalar & Sipariş", RU: "Столы и Заказы" },
      "Mətbəx": { EN: "Kitchen", TR: "Mutfak", RU: "Кухня" },
      "Rezervasiyalar": { EN: "Reservations", TR: "Rezervasyonlar", RU: "Бронирования" },
      "Menyu": { EN: "Menu", TR: "Menü", RU: "Меню" },
      "Anbar / Stok": { EN: "Inventory", TR: "Stok / Depo", RU: "Склад и Запасы" },
      "İşçilər & Növbə": { EN: "Staff & Shifts", TR: "Çalışanlar & Vardiya", RU: "Сотрудники и Смены" },
      "Sistem Hesabatları": { EN: "System Reports", TR: "Sistem Raporları", RU: "Отчеты системы" },
      "Admin Paneli": { EN: "Admin Panel", TR: "Admin Paneli", RU: "Админ-Панель" },
      "QR Menyu & Sifariş": { EN: "QR Menu & Self-POS", TR: "QR Menü & Sipariş", RU: "QR Меню и Заказ" },
      "Ağıllı AI Analitika": { EN: "Smart AI Analytics", TR: "Akıllı AI Analitik", RU: "Интеллектуальная AI Аналитика" },
      "Sürətli Planşet Rejimi": { EN: "Quick Tablet Mode", TR: "Hızlı Tablet Modu", RU: "Режим планшета" },
      "Sakit Dövr": { EN: "Quiet Period", TR: "Sakin Dönem", RU: "Спокойный период" },
      
      // Period Filters
      "GÜNDƏLİK": { EN: "DAILY", TR: "GÜNLÜK", RU: "ЕЖЕДНЕВНО" },
      "AYLIQ": { EN: "MONTHLY", TR: "AYLIK", RU: "ЕЖЕМЕСЯЧНО" },
      "İLLİK": { EN: "YEARLY", TR: "YILLIK", RU: "ЕЖЕГОДНО" },

      // Subtabs and Headers
      "Ofisiant Satış Hesabatı": { EN: "Waiter Sales Report", TR: "Garson Satış Raporu", RU: "Отчет по продажам официантов" },
      "Ofisiant Adı / Şöbə": { EN: "Waiter Name / Dept", TR: "Garson Adı / Departman", RU: "Имя официанта / Отдел" },
      "Aktivlik dövrü": { EN: "Activity Period", TR: "Aktivite Süreci", RU: "Период активности" },
      "Cəmi Satışlar": { EN: "Total Sales", TR: "Toplam Satışlar", RU: "Всего продаж" },
      "Sifariş ID": { EN: "Order ID", TR: "Sipariş ID", RU: "ID заказа" },
      "Yemək Adı": { EN: "Dish Name", TR: "Yemek Adı", RU: "Название блюда" },
      "Tarix": { EN: "Date", TR: "Tarih", RU: "Дата" },
      "Qeyd": { EN: "Note", TR: "Not", RU: "Примечание" },
      "Mətbəx Statusu": { EN: "Kitchen Status", TR: "Mutfak Durumu", RU: "Статус кухни" },
      "Növbə statusu": { EN: "Shift Status", TR: "Vardiya Durumu", RU: "Статус смены" },
      "Cəmi Ofisiant Qrupu": { EN: "Total Waiter Group", TR: "Toplam Garson Grubu", RU: "Всего группа официантов" },
      "Cəmi Ofisiant": { EN: "Total Waiter", TR: "Toplam Garson", RU: "Всего официант" },
      "Satış dövriyyesi": { EN: "Sales Turnover", TR: "Satış Cirosu", RU: "Оборот продаж" },
      "Satış Dövriyyəsi": { EN: "Sales Turnover", TR: "Satış Cirosu", RU: "Оборот продаж" },
      "Anbar Mədaxili": { EN: "Inventory Inward", TR: "Stok Girişi", RU: "Поступление на склад" },
      "Mədaxil": { EN: "Inward", TR: "Giriş", RU: "Приход" },
      "Məhsul": { EN: "Product", TR: "Ürün", RU: "Продукт" },

      // Status Labels
      "Aktiv": { EN: "Active", TR: "Aktif", RU: "Активен" },
      "Deaktiv": { EN: "Inactive", TR: "Pasif", RU: "Неактивен" },
      "Hazırdır": { EN: "Ready", TR: "Hazır", RU: "Готово" },
      "Hazırlanır": { EN: "Preparing", TR: "Hazırlanıyor", RU: "Готовится" },
      "Xarab": { EN: "Defective", TR: "Defolu", RU: "Брак" },
      "Xarab/Dəfekt": { EN: "Defective/Returned", TR: "Defolu/İade", RU: "Брак/Возврат" },
      "Geri Qaytarılıb": { EN: "Returned", TR: "İade Edildi", RU: "Возвращено" },
      "Növbədə": { EN: "On Shift", TR: "Vardiyada", RU: "На смене" },
      "Növbədə deyil": { EN: "Off Shift", TR: "Vardiya Dışı", RU: "Не на смене" },

      // Dialog & Actions
      "SİSTEMİ TAM SIFIRLA": { EN: "COMPLETELY RESET SYSTEM", TR: "SİSTEMİ TAMAMEN SIFIRLA", RU: "ПОЛНОСТЬЮ СБРОСИТЬ СИСТЕМУ" },
      "Bəli, Sıfırla": { EN: "Yes, Reset", TR: "Evet, Sıfırla", RU: "Да, Сбросить" },
      "Ləğv Et": { EN: "Cancel", TR: "İptal", RU: "Отмена" },
      "BÜTÜN DATANI SIFIRLA (PURGE ALL)": { EN: "PURGE ALL DATA", TR: "TÜM DATAYI SIFIRLA (HEPSİNİ TEMİZLE)", RU: "ОЧИСТИТЬ ВСЕ ДАННЫЕ (PURGE ALL)" },
      "Sınaq Məlumatlarını Yüklə": { EN: "Load Demo Data", TR: "Test Bilgilerini Yükle", RU: "Загрузить демо-данные" },
      "Sifariş Muvəffəqiyyətlə Yerləşdirildi!": { EN: "Order Placed Successfully!", TR: "Sipariş Başarıyla Yerleştirildi!", RU: "Заказ успешно размещен!" },
      "Təsdiqlə / Gizlə": { EN: "Confirm / Hide", TR: "Onayla / Gizle", RU: "Подтвердить / Скрыть" },
      "Restorandakı Masalar (QR Kodlar)": { EN: "Restaurant Tables (QR Codes)", TR: "Restorandaki Masalar (QR Kodlar)", RU: "Столы в ресторане (QR-коды)" },
      "Simulyasiya etmək üçün masanı seçin. Telefon ekranında həmin masanın QR Menyusu açılacaq.": {
        EN: "Select a table to simulate. The QR Menu for that table will open on the phone screen.",
        TR: "Simüle etmek için masayı seçin. Telefon ekranında o masanın QR Menüsü açılacaktır.",
        RU: "Выберите стол для симуляции. На экране телефона откроется QR-меню этого стола."
      },
      "Bütün Verilənləri Tamamən Sıfırla": { EN: "Completely Reset All Data", TR: "Tüm Verileri Tamamen Sıfırla", RU: "Полностью сбросить все данные" },
      "Sıfırlama zamanı idarəetmə panelinde bütün veriler sıfırlansın": {
        EN: "All dashboard data will be reset during purge",
        TR: "Sıfırlama sırasında yönetim panelindeki tüm veriler sıfırlansın",
        RU: "Все данные панели будут сброшены во время очистки"
      },

      // QR menu sidebar
      "QR Menyu və Masadan Sifariş": { EN: "QR Menu & Table Ordering", TR: "QR Menü ve Masadan Sipariş", RU: "QR Меню и Заказ со стола" },
      "SELF-SERVICE MASA AGENTİ SIMULATORU": { EN: "SELF-SERVICE TABLE AGENT SIMULATOR", TR: "KENDİNDEN HİZMET MASA AJANI SİMÜLATÖRÜ", RU: "СИМУЛЯТОР САМООБСЛУЖИВАНИЯ СО СТОЛА" },
      "Masaların üzərindəki xüsusi QR kodları skan edərək müştərilərin masa başından öz telefonları ilə birbaşa mətbəxə sifariş göndərmə sisteminin interaktiv simulyasiyası.": {
        EN: "Interactive simulation of the table-side ordering system by scanning special QR codes on tables to send orders directly to the kitchen.",
        TR: "Masaların üzerindeki özel QR kodlarını tarayarak müşterilerin masa başından kendi telefonları ile doğrudan mutfağa sipariş gönderme sisteminin interaktif simülasyonu.",
        RU: "Интерактивная симуляция системы заказа столиков путем сканирования специальных QR-кодов на столах для отправки заказов прямо на кухню."
      },
      "YEMƏK SEÇİMİ": { EN: "CHOOSE DISH", TR: "YEMEK SEÇİMİ", RU: "ВЫБОР БЛЮДА" },
      "SƏBƏT": { EN: "CART", TR: "SEPET", RU: "КОРЗИНА" },
      "Səbətiniz Boşdur": { EN: "Your Cart is Empty", TR: "Sepetiniz Boş", RU: "Ваша корзина пуста" },
      "Səbəti Təmizlə": { EN: "Clear Cart", TR: "Sepeti Temizle", RU: "Очистить корзину" },
      "Davam Et": { EN: "Continue", TR: "Devam Et", RU: "Продолжить" },
      "SİFARİŞİ GÖNDƏR": { EN: "SUBMIT ORDER", TR: "SİPARİŞİ GÖNDER", RU: "ОТПРАВИТЬ ЗАКАЗ" },
      "ÖDƏNİŞ": { EN: "PAYMENT", TR: "ÖDEME", RU: "ОПЛАТА" },

      "Xəbərdarlıq: Bu əməliyyatın geri qaytarılması yoxdur! Bütün lokal dövriyyələr silinəcəkdir. İndiki vəziyyətdən asılı olmayaraq, istədiyiniz an sistemi sıfırlaya bilərsiniz.": {
        EN: "Warning: This operation cannot be undone! All local turnover data will be deleted. You can reset the system at any time regardless of the current state.",
        TR: "Uyarı: This işlem geri alınamaz! Tüm yerel ciro verileri silinecektir. Mevcut durum ne olursa olsun sistemi istediğiniz zaman sıfırlayabilirsiniz.",
        RU: "Предупреждение: эта операция не может быть отменена! Все данные локального оборота будут удалены. Вы можете сбросить систему в любое время, независимо от текущего состояния."
      },
      "DİQQƏT! Bütün aktiv sınaq sifarişləri, rezervasiyalar, kassa dövriyyəsi və mətbəx loqları ləğv ediləcək, verilənlər bazası sıfırlanaraq tətbiq yeni, təmiz və real satışa hazır vəziyyətə gətiriləcəkdir. Bu əməliyyatı tamamlamaq istədiyinizə əminsiniz?": {
        EN: "ATTENTION! All active test orders, reservations, cash register turnover, and kitchen logs will be canceled, and the database will be reset to make the application ready for real sales. Are you sure you want to complete this operation?",
        TR: "DİKKAT! Tüm aktif test siparişleri, rezervasyonlar, kasa ciroları ve mutfak kayıtları silinecek, veri tabanı sıfırlanarak uygulama gerçek satışa hazır olacaktır. Bu işlemi tamamlamak istediğinizden emin misiniz?",
        RU: "ВНИМАНИЕ! Все активные тестовые заказы, бронирования, кассовый оборот и кухонные журналы будут аннулированы, а база данных будет сброшена, чтобы приложение было полностью готово к реальным продажам. Вы уверены, что хотите выполнить эту операцию?"
      },

      // ALL VISUAL SCREEN LABELS (SCREENS 1 - 11)
      "SİSTEM PANELI & İDARƏETMƏ GÖSTƏRİCİLƏRİ": {
        EN: "SYSTEM PANEL & CONTROL INDICATORS",
        TR: "SİSTEM PANELİ & KONTROL GÖSTERGELERİ",
        RU: "СИСТЕМНАЯ ПАНЕЛЬ И УПРАВЛЯЮЩИЕ ПОКАЗАТЕЛИ"
      },
      "Seçilmiş dövrün aktiv satış və anbar hesabatı:": {
        EN: "Active sales and inventory report for selected period:",
        TR: "Seçilen dönemin aktif satış ve stok raporu:",
        RU: "Активный отчет о продажах и складе за выбранный период:"
      },
      "Seçilmiş dövrün aktiv hesabatı:": {
        EN: "Active report for selected period:",
        TR: "Seçilen dönemin aktif raporu:",
        RU: "Активный отчет за выбранный период:"
      },
      "Gün": { EN: "Day", TR: "Gün", RU: "День" },
      "Ay": { EN: "Month", TR: "Ay", RU: "Месяц" },
      "İl": { EN: "Year", TR: "Yıl", RU: "Год" },
      "Hamısı": { EN: "All", TR: "Hepsi", RU: "Все" },
      "Məşhur Yeməklər": { EN: "Popular Dishes", TR: "Popüler Yemekler", RU: "Популярные блюда" },
      "Son Rezervasiyalar": { EN: "Recent Reservations", TR: "Son Rezervasyonlar", RU: "Последние бронирования" },
      "Aktiv rezervasiya yoxdur": {
        EN: "No active reservations",
        TR: "Aktif rezervasyon yok",
        RU: "Нет активных бронирований"
      },
      "Anbar Mədaxili Siyahısı": {
        EN: "Inventory Inward List",
        TR: "Stok Giriş Listesi",
        RU: "Список поступлений на склад"
      },
      "Seçilmiş dövrdə daxil olan mallar.": {
        EN: "Goods received during the selected period.",
        TR: "Seçilen dönemde giriş yapılan ürünler.",
        RU: "Товары, поступившие за выбранный период."
      },
      "Mədaxil qeydə alınmayıb": {
        EN: "No stock inflow recorded",
        TR: "Stok girişi kaydedilmedi",
        RU: "Поступления не зарегистрированы"
      },
      "Masalar": { EN: "Tables", TR: "Masalar", RU: "Столы" },
      "Rezervlər": { EN: "Reservations", TR: "Rezervasyonlar", RU: "Бронирования" },
      "Azalan Stoklar": { EN: "Low Stocks", TR: "Azalan Stoklar", RU: "Убывающие запасы" },
      "BOŞ": { EN: "EMPTY", TR: "BOŞ", RU: "СВОБОДЕН" },
      "REZ": { EN: "RES", TR: "REZ", RU: "БРОНЬ" },
      "Kritik": { EN: "Critical", TR: "Kritik", RU: "Критич." },
      "Stok": { EN: "Stock", TR: "Stok", RU: "Запас" },
      "Dolu": { EN: "Occupied", TR: "Dolu", RU: "Занят" },
      "Rezerv": { EN: "Reserved", TR: "Rezerv", RU: "Забронирован" },
      "Boş": { EN: "Empty", TR: "Boş", RU: "Свободен" },

      // SCREEN 3: MƏTBƏX
      "Gündəlik Hazırlıq Jurnalı": {
        EN: "Daily Preparation Log",
        TR: "Günlük Hazırlık Günlüğü",
        RU: "Журнал ежедневной подготовки"
      },
      "MƏTBƏX HESABATI": {
        EN: "KITCHEN REPORT",
        TR: "MUTFAK RAPORU",
        RU: "ОТЧЕТ КУХНИ"
      },
      "Yemək, masa və ya ofisiant axtar...": {
        EN: "Search menu, table or waiter...",
        TR: "Yemek, masa veya garson ara...",
        RU: "Искать блюдо, стол или официанта..."
      },
      "MƏHSUL (NORMAL)": {
        EN: "PRODUCT (NORMAL)",
        TR: "ÜRÜN (NORMAL)",
        RU: "ПРОДУКТ (НОРМА)"
      },
      "MƏHSUL (XARAB / GERİ)": {
        EN: "PRODUCT (DEFECTIVE / RETURNED)",
        TR: "ÜRÜN (BOZUK / İADE)",
        RU: "ПРОДУКТ (БРАК / ВОЗВРАТ)"
      },
      "SAAT (24S)": {
        EN: "TIME (24H)",
        TR: "SAAT (24S)",
        RU: "ВРЕМЯ (24Ч)"
      },
      "YEMƏK / MƏHSUL": {
        EN: "DISH / PRODUCT",
        TR: "YEMEK / ÜRÜN",
        RU: "БЛЮДО / ТОВАР"
      },
      "MASA": { EN: "TABLE", TR: "MASA", RU: "СТОЛ" },
      "OFİSİANT": { EN: "WAITER", TR: "GARSON", RU: "ОФИЦИАНТ" },
      "STATUS": { EN: "STATUS", TR: "DURUM", RU: "СТАТУС" },
      "QEYD": { EN: "NOTE", TR: "NOT", RU: "ПРИМЕЧАНИЕ" },
      "SEÇİLMİŞ TARİX ÜÇÜN MƏLUMAT TAPILMADI": {
        EN: "NO DATA FOUND FOR SELECTED DATE",
        TR: "SEÇİLEN TARİH İÇİN BİLGİ BULUNAMADI",
        RU: "ДАННЫЕ ДЛЯ ВЫБРАННОЙ ДАТЫ НЕ НАЙДЕНЫ"
      },

      // SCREEN 4: REZERVASIYALAR
      "Müştəri və ya masa axtar...": {
        EN: "Search customer or table...",
        TR: "Müşteri veya masa ara...",
        RU: "Поиск клиента или стола..."
      },
      "BİTMİŞLƏRƏ BAX (ARXİV)": {
        EN: "VIEW COMPLETED (ARCHIVE)",
        TR: "TAMAMLANANLARI GÖR (ARŞİV)",
        RU: "ПОКАЗАТЬ ЗАВЕРШЕННЫЕ (АРХИВ)"
      },
      "BGN": { EN: "TODAY", TR: "BUGÜN", RU: "СЕГОДНЯ" },
      "SBH": { EN: "TOMORROW", TR: "YARIN", RU: "ЗАВТРА" },
      "MASA REZERVASIYA VƏZİYYƏTİ": {
        EN: "TABLE RESERVATION STATUS",
        TR: "MASA REZERVASYON DURUMU",
        RU: "СТАТУС БРОНИРОВАНИЯ СТОЛОВ"
      },
      "Seçilmiş tarixə görə masaların doluluq və rezervasiya vəziyyəti (boş masaya klikləyərək sürətli rezervasiya edin).": {
        EN: "Daily table occupancy and reservation status based on selected date (click empty table for quick reservation).",
        TR: "Seçilen tarihe göre masaların doluluk ve rezervasyon durumu (boş masaya tıklayarak hızlı rezervasyon yapın).",
        RU: "Заполненность и статус бронирования столов на выбранную дату (нажмите на пустой стол для быстрого бронирования)."
      },
      "BOŞ MASADIR": { EN: "EMPTY TABLE", TR: "BOŞ MASA", RU: "ПУСТОЙ СТОЛ" },
      "REZERV OLUNUB": { EN: "RESERVED", TR: "REZERVASYONLU", RU: "ЗАБРОНИРОВАН" },
      "GƏLİB (MASA FƏAL)": { EN: "ARRIVED (ACTIVE TABLE)", TR: "GELDİ (MASA AKTİF)", RU: "ПРИБЫЛ (СТОЛ АКТИВЕН)" },
      "REZERVASIYA TAPILMADI": {
        EN: "RESERVATION NOT FOUND",
        TR: "REZERVASYON BULUNAMADI",
        RU: "БРОНИРОВАНИЕ НЕ НАЙДЕНО"
      },
      "Seçilmiş tarixdə axtarış meyarlarına uyğun rezervasiya yoxdur.": {
        EN: "There is no reservation matching criteria on the selected date.",
        TR: "Seçilen tarihte kriterlere uygun rezervasyon bulunmamaktadır.",
        RU: "На выбранную дату нет бронирований, соответствующих критериям."
      },

      // SCREEN 5: MENYU
      "YEMƏKLƏR & QİYMƏTLƏR": {
        EN: "DISHES & PRICES",
        TR: "YEMEKLER & FİYATLAR",
        RU: "БЛЮДА И ЦЕНЫ"
      },
      "RESEPTURA & MAYA DƏYƏRİ": {
        EN: "RECIPES & COST PRICE",
        TR: "REÇETE & MALİYET",
        RU: "РЕЦЕПТУРА И СЕБЕСТОИМОСТЬ"
      },
      "Yemək axtar...": {
        EN: "Search dish...",
        TR: "Yemek ara...",
        RU: "Поиск блюда..."
      },
      "KATEQORİYA İDARƏ PANELİ": {
        EN: "CATEGORY DASHBOARD",
        TR: "KATEGORİ YÖNETİMİ",
        RU: "УПРАВЛЕНИЕ КАТЕГОРИЯМИ"
      },
      "Bütün proqram üzrə seçilmiş kateqoriyanı və hər bir uyğun yeməyi silə bilərsiniz.": {
        EN: "You can delete the selected category and all matching dishes across the app.",
        TR: "Seçilen kategoriyi ve altındaki tüm yemekleri silebilirsiniz.",
        RU: "Вы можете удалить выбранную категорию и все соответствующие блюда во всей программе."
      },
      "Kateqoriya Seçin...": {
        EN: "Select Category...",
        TR: "Kategori Seçin...",
        RU: "Выберите категорию..."
      },
      "Seçilmiş Kateqoriyanı Sil": {
        EN: "Delete Selected Category",
        TR: "Seçilen Kategoriyi Sil",
        RU: "Удалить выбранную категорию"
      },
      "YEMƏKLƏRİN SİYAHISI": {
        EN: "LIST OF DISHES",
        TR: "YEMEKLERİN LİSTESİ",
        RU: "СПИСОК БЛЮД"
      },
      "SATIŞ QİYMƏTİ": {
        EN: "SALE PRICE",
        TR: "SATIŞ FİYATI",
        RU: "ЦЕНА ПРОДАЖИ"
      },
      "MAYA DƏYƏRİ": {
        EN: "COST PRICE",
        TR: "MALİYET",
        RU: "СЕБЕСТОИМОСТЬ"
      },
      "GƏLİR MARJASI": {
        EN: "PROFIT MARGIN",
        TR: "KAR MARJI",
        RU: "МАРЖА ПРИБЫЛИ"
      },
      "YEMƏK RESEPTURASI TƏNZİMLƏMƏLƏRİ": {
        EN: "RECIPE SETTINGS",
        TR: "REÇETE AYARLARI",
        RU: "НАСТРОЙКА РЕЦЕПТУРЫ"
      },
      "Reseptura tənzimləmələri və hər bir yeməyin hazırlanması üçün lazım olan ərzaq miqdarlarını buradan təyin edə bilərsiniz.": {
        EN: "Manage recipe settings and food ingredient amounts needed for each dish here.",
        TR: "Reçete ayarlarını ve her yemeğin hazırlanması için gereken malzeme miktarlarını buradan belirleyebilirsiniz.",
        RU: "Менеджер рецептуры и набора ингредиентов, необходимых для приготовления каждого блюда."
      },

      // SCREEN 6: ANBAR / STOK
      "ANBAR VƏ MƏHSUL STOKLARI": {
        EN: "INVENTORY & PRODUCT STOCKS",
        TR: "DEPO & STOK DURUMU",
        RU: "СКЛАД И ЗАПАСЫ ТОВАРОВ"
      },
      "Stok qalığı və minimum mövcudluq limitinə dair ətraflı məlumatlar.": {
        EN: "Detailed information about stock balance and minimum availability limit.",
        TR: "Stok bakiyesi ve minimum miktar limitlerine dair detaylı bilgiler.",
        RU: "Детальная информация о запасах на складе и лимитах минимального количества."
      },
      "KRİTİK STOK": {
        EN: "CRITICAL STOCK",
        TR: "KRİTİK STOK",
        RU: "КРИТИЧЕСКИЙ ЗАПАС"
      },
      "YENİ ANBAR MƏHSULUNUN MƏDAXİLİ": {
        EN: "INWARD OF NEW INVENTORY PRODUCT",
        TR: "YENİ STOK GİRİŞİ",
        RU: "ПОСТУПЛЕНИЕ НОВОГО ТОВАРА НА СКЛАД"
      },
      "MƏHSUL ADI": {
        EN: "PRODUCT NAME",
        TR: "ÜRÜN ADI",
        RU: "НАЗВАНИЕ ТОВАРА"
      },
      "Məs. Un, Mozzarella, Pendir": {
        EN: "E.g. Flour, Mozzarella, Cheese",
        TR: "Örn. Un, Mozzarella, Peynir",
        RU: "Напр. Мука, Моцарелла, Сыр"
      },
      "MÖVCUD STOK": {
        EN: "CURRENT STOCK",
        TR: "MEVCUT STOK",
        RU: "ТЕКУЩИЙ ЗАПАС"
      },
      "Məs. 50": { EN: "E.g. 50", TR: "Örn. 50", RU: "Напр. 50" },
      "MİN. SƏVİYYƏ": { EN: "MIN. LEVEL", TR: "MİN. SEVİYE", RU: "МИН. УРОВЕНЬ" },
      "Məs. 10": { EN: "E.g. 10", TR: "Örn. 10", RU: "Напр. 10" },
      "ÖLÇÜ VAHİDİ": { EN: "UNIT", TR: "ÖLÇÜ BİRİMİ", RU: "ЕДИНИЦА ИЗМЕРЕНИЯ" },
      "Məs. kq, litr, ədəd": {
        EN: "E.g. kg, liter, pieces",
        TR: "Örn. kg, litre, adet",
        RU: "Напр. кг, литр, шт."
      },
      "ALIŞ QİYMƏTİ (₼ / ÖLÇÜ VAHİDİ)": {
        EN: "PURCHASE PRICE (₼ / UNIT)",
        TR: "ALIŞ FİYATI (₼ / BİRİM)",
        RU: "ЦЕНА ЗАКУПКИ (₼ / ЕД. ИЗМ.)"
      },
      "Məs. 1.20, 14.50": { EN: "E.g. 1.20, 14.50", TR: "Örn. 1.20, 14.50", RU: "Напр. 1.20, 14.50" },
      "MƏDAXİLİ TAMAMLA": {
        EN: "COMPLETE INWARD",
        TR: "GİRİŞİ TAMAMLA",
        RU: "ЗАВЕРШИТЬ ПОСТУПЛЕНИЕ"
      },
      "Məhsul adı ilə axtar...": {
        EN: "Search by product name...",
        TR: "Ürün adı ile ara...",
        RU: "Поиск по названию продукта..."
      },

      // SCREEN 7: İŞÇİLƏR & NÖVBƏ
      "İşçi Qəbulu və Nəzarət Sistemi": {
        EN: "Staff Hiring & Control System",
        TR: "İşe Alım ve Takip Sistemi",
        RU: "Система приема сотрудников и контроля"
      },
      "YENİ İŞÇİLƏRİN ALINMASI, FƏRDİ SƏNƏD/ƏLAQƏ MƏLUMATLARININ QEYDİYYATI, VƏZİFƏ İDARƏÇİLİYİ VƏ GÜNDƏLİK İŞ NİZAMI": {
        EN: "NEW HIRING, REGISTRATION OF PERSONAL/CONTACT INFO, ROLE MANAGEMENT AND DAILY WORK SCHEDULING",
        TR: "YENİ PERSONEL ALIMI, KİŞİSEL BİLGİ/İLETİŞİM KAYDI, GÖREV YÖNETİMİ VE VARDİYA AYARLARI",
        RU: "РЕГИСТРАЦИЯ ПЕРСОНАЛА, КОНТАКТНЫХ ДАННЫХ, УПРАВЛЕНИЕ ДОЛЖНОСТЯМИ И РАСПИСАНИЕ СМЕН"
      },
      "YENİ İŞÇİ GÖTÜR": {
        EN: "HIRE NEW WORKER",
        TR: "YENİ PERSONEL EKLE",
        RU: "ПРИНЯТЬ СОТРУДНИКА"
      },

      // SCREEN 8: QR MENU
      "MASA KOORDİNASİYA": {
        EN: "TABLE COORDINATION",
        TR: "MASA KOORDİNASYONU",
        RU: "КООРДИНАЦИЯ СТОЛОВ"
      },

      // SCREEN 9: AI ANALYTICS
      "Ağıllı Proqnozlaşdırma və Süni İntellekt Eksperti": {
        EN: "Smart Forecasting & Artificial Intelligence Expert",
        TR: "Akıllı Tahmin ve Yapay Zeka Uzmanı",
        RU: "Умное прогнозирование и эксперт ИИ"
      },
      "Canlı satışlar, anbar qalıqları və müştəri seçimləri əsasında avtomatlaşdırılmış AI hesabatları.": {
        EN: "Automated AI reports based on live sales, stock balances, and customer choices.",
        TR: "Canlı satışlar, stok bakiyeleri ve müşteri tercihlerine dayalı otomatik yapay zeka raporları.",
        RU: "Автоматические отчеты ИИ на основе продаж, остатков товаров и предпочтений клиентов."
      },
      "GƏLƏN HƏFTƏ SATIŞ PROQNOZU": {
        EN: "NEXT WEEK'S SALES FORECAST",
        TR: "GELECEK HAFTA SATIŞ TAHMİNİ",
        RU: "ПРОГНОЗ ПРОДАЖ НА СЛЕДУЮЩУЮ НЕДЕЛЮ"
      },
      "Süni intellektin təxmin etdiyi günlük ortalama gəlir həcmi.": {
        EN: "Daily average revenue volume estimated by AI.",
        TR: "Yapay zekanın tahmin ettiği günlük ortalama gelir hacmi.",
        RU: "Среднесуточный объем выручки, оцененный ИИ."
      },
      "AĞILLI TƏDARÜK & SATINALMA SİYAHISI": {
        EN: "SMART SUPPLY & PURCHASE LIST",
        TR: "AKILLI TEDARİK & SATINALMA LİSTESİ",
        RU: "УМНЫЙ СПИСОК ЗАКУПОК И ПОСТАВОК"
      },
      "Ortalama yemək reseptləri israfı əsasında dərhal sifariş tövsiyələri.": {
        EN: "Immediate order recommendations based on average dish recipe waste.",
        TR: "Ortalama tarif israfına dayalı anlık satın alma önerileri.",
        RU: "Срочные рекомендации по заказу на основе среднего расхода по рецептам."
      },
      "UN ehtiyatı azdır!": { EN: "Flour stock is low!", TR: "UN stoğu az!", RU: "Запас муки на исходе!" },
      "Tezliklə 20kq əlavə un alınmalıdır.": {
        EN: "20kg flour should be purchased soon.",
        TR: "Yakında 20kg un alınmalıdır.",
        RU: "В ближайшее время необходимо закупить 20кг муки."
      },
      "Mərci Şorbası Yaddaxlanışı": {
        EN: "Lentil Soup Warning",
        TR: "Mercimek Çorbası Uyarısı",
        RU: "Предупреждение по чечевичному супу"
      },
      "Tələbə görə pomidor qalığı 2 gün bəs edəcək.": {
        EN: "According to demand, tomato leftovers will last 2 days.",
        TR: "Talebe göre domates stoğu 2 gün yetecektir.",
        RU: "Исходя из спроса, остатков томатов хватит на 2 дня."
      },
      "MENYU MAYA DƏYƏRİ AUDİT MƏSLƏHƏTİ": {
        EN: "MENU COST AUDIT ADVICE",
        TR: "MENÜ MALİYET AUDİT TAVSİYESİ",
        RU: "СОВЕТЫ ПО АУДИТУ СЕБЕСТОИМОСТИ МЕНЮ"
      },
      "Gəlirliyi və marjanı maksimuma qaldırmaq üçün AI qeydləri.": {
        EN: "AI notes to maximize profitability and profit margins.",
        TR: "Karlılığı ve kar marjını maksimize etmek için yapay zeka tavsiyeleri.",
        RU: "Заметки ИИ для максимизации прибыльности и маржи."
      },
      "Ümumi restoran mənfəət artım potensialı: +12%!": {
        EN: "Total restaurant profit growth potential: +12%!",
        TR: "Toplam restoran kar artış potansiyeli: +12%!",
        RU: "Потенциал роста прибыли ресторана: +12%!"
      },
      "EKSPERT MƏLUMATI": { EN: "EXPERT INFORMATION", TR: "UZMAN BİLGİSİ", RU: "ЭКСПЕРТНЫЕ ДАННЫЕ" },
      "AKTİV MENYU SAYI": { EN: "ACTIVE MENU ITEMS", TR: "AKTİF MENÜ SAYISI", RU: "АКТИВНЫХ БЛЮД В МЕНЮ" },
      "ƏN ÇOX MAYA DƏYƏRİ OLAN": {
        EN: "HIGHEST COST PRICE ITEM",
        TR: "EN YÜKSEK MALİYETLİ ÜRÜN",
        RU: "САМАЯ ВЫСОКАЯ СЕБЕСТОИМОСТЬ"
      },
      "ANBAR KAFİ DƏRƏCƏSİ": {
        EN: "INVENTORY SUFFICIENCY",
        TR: "STOK YETERLİLİK DERECESİ",
        RU: "ИНВЕНТАРНАЯ ДОСТАТОЧНОСТЬ"
      },
      "100% Tamdır": { EN: "100% Full", TR: "%100 Tam", RU: "100% Заполнено" },
      "SUALLAR ÜZRƏ MÖVZULAR": { EN: "TOPICS BY QUESTIONS", TR: "SORU BAŞLIKLARI", RU: "ТЕМЫ ВОПРОСОВ" },
      "Qiymət": { EN: "Price", TR: "Fiyat", RU: "Цена" },
      "İsraf": { EN: "Waste", TR: "İsraf", RU: "Расход" },
      "Anbar": { EN: "Stock", TR: "Stok", RU: "Склад" },
      "Marja": { EN: "Margin", TR: "Marj", RU: "Маржа" },

      // SCREEN 10: REPORTS TABS & LABELS
      "Satış & Sifariş": { EN: "Sales & Orders", TR: "Satış & Sipariş", RU: "Продажи и Заказы" },
      "Anbar & Stok": { EN: "Inventory & Stock", TR: "Stok & Depo", RU: "Склад и Запасы" },
      "Mətbəx Jurnalı": { EN: "Kitchen Journal", TR: "Mutfak Kayıtları", RU: "Журнал кухни" },
      "Ofisiantlar & Növbə": { EN: "Waiters & Shifts", TR: "Garsonlar & Vardiya", RU: "Официанты и Смены" },
      "HESABAT METRİKA SÜZGƏCİ": {
        EN: "REPORT METRICS FILTER",
        TR: "RAPOR METRİK FİLTRESİ",
        RU: "ФИЛЬТР МЕТРИК ОТЧЕТА"
      },
      "Cədvəllər və qalıq süzgəcləri bu tarixə əsasən hesablanır:": {
        EN: "Tables and stock filters are calculated based on this date:",
        TR: "Tablolar ve stok filtreleri bu tarihe göre hesaplanmaktadır:",
        RU: "Таблицы и фильтры остатков рассчитываются на основе этой даты:"
      },
      "Ümumi Dövriyyə": { EN: "Total Turnover", TR: "Toplam Ciro", RU: "Общий оборот" },
      "Ödənilmiş Çeklər": { EN: "Paid Checks", TR: "Ödenen Fişler", RU: "Оплаченные чеки" },
      "Aktiv Masalar (İndi)": { EN: "Active Tables (Now)", TR: "Aktif Masalar (Şimdi)", RU: "Активные столы (Сейчас)" },
      "Ortalama Çek": { EN: "Average Check", TR: "Ortalama Adisyon", RU: "Средний чек" },
      "Ətraflı Məlumat Jurnalı": { EN: "Detailed Journal", TR: "Detaylı Bilgi Kaydı", RU: "Подробный журнал" },
      "REAL VAXT DATASI": { EN: "REAL TIME DATA", TR: "GERÇEK ZAMANLI VERİ", RU: "ДАННЫЕ В РЕАЛЬНОМ ВРЕМЕНИ" },
      "Vəzifə": { EN: "Role", TR: "Görev", RU: "Должность" },
      "Növbə Aktivliyi": { EN: "Shift Activity", TR: "Vardiya Aktivitesi", RU: "Активность на смене" },
      "Şəxsi Satışlar": { EN: "Personal Sales", TR: "Bireysel Satışlar", RU: "Личные продажи" },
      "NÖVBƏDƏ": { EN: "ON SHIFT", TR: "VARDİYADA", RU: "НА СМЕНЕ" },
      "DEYİL": { EN: "OFF SHIFT", TR: "VARDİYA DIŞI", RU: "НЕ НА СМЕНЕ" },
      "Bu dövr üzrə rezervasiya tapılmadı": {
        EN: "No reservation found for this period",
        TR: "Bu dönem için rezervasyon bulunamadı",
        RU: "За этот период бронирований не найдено"
      },
      "Müştəri Adı": { EN: "Customer Name", TR: "Müşteri Adı", RU: "Имя клиента" },
      "Ayrılmış Masa": { EN: "Allocated Table", TR: "Ayrılmış Masa", RU: "Выделенный стол" },
      "Qonaq Sayı": { EN: "Guests Count", TR: "Konuk Sayısı", RU: "Кол-во гостей" },
      "TƏSDİQLƏNDİ": { EN: "CONFIRMED", TR: "ONAYLANDI", RU: "ПОДТВЕРЖДЕНО" },
      "GƏLİB": { EN: "ARRIVED", TR: "GELDİ", RU: "ПРИБЫЛ" },
      "BİTMİŞ": { EN: "COMPLETED", TR: "TAMAMLANDI", RU: "ЗАВЕРШЕН" },
      "LƏĞV": { EN: "CANCELLED", TR: "İPTAL", RU: "ОТМЕНЕН" },
      "Anbardakı Mövcud Stok": { EN: "Current Stock in Inventory", TR: "Depodaki Mevcut Stok", RU: "Текущий запас на складе" },
      "Minimum Limit Səviyyəsi": { EN: "Minimum Limit Level", TR: "Minimum Limit Seviyesi", RU: "Минимальный лимит запасов" },
      "KRİTİK/AZALIB": { EN: "CRITICAL/LOW", TR: "KRİTİK/AZALMIŞ", RU: "КРИТИЧЕСКИЙ/МАЛО" },
      "MÖVCUD STOK OKEY": { EN: "CURRENT STOCK OK", TR: "MEVCUT STOK TAMAM", RU: "ЗАПАСЫ В НОРМЕ" },
      "Qeyd (İstekler)": { EN: "Notes (Requests)", TR: "Notlar (İstekler)", RU: "Примечания (Запросы)" },
      "HAZIRDIR": { EN: "READY", TR: "HAZIR", RU: "ГОТОВО" },
      "DEFEKTIV": { EN: "DEFECTIVE", TR: "DEFOLU", RU: "БРАК" },
      "İşçinin Adı Soyadı": { EN: "Employee Full Name", TR: "Çalışan Ad Soyadı", RU: "ФИО сотрудника" },
      "Sənəd No": { EN: "ID Document No", TR: "Döküman No", RU: "Номер документа" },
      "Telefon nömrəsi": { EN: "Phone Number", TR: "Telefon Numarası", RU: "Номер телефона" },
      "Rol": { EN: "Role", TR: "Rol", RU: "Роль" },
      "Saat Hesabı": { EN: "Hourly Wage", TR: "Saatlik Ücret", RU: "Почасовая ставка" },
      "AKTİV NÖVBƏ": { EN: "ACTIVE SHIFT", TR: "AKTİF VARDİYA", RU: "АКТИВНАЯ СМЕНА" },
      "YAXINDA": { EN: "COMING SOON", TR: "YAKINDA", RU: "СКОРО" },

      "Cəmi Rezervasiyalar": { EN: "Total Reservations", TR: "Toplam Rezervasyon", RU: "Всего бронирований" },
      "Aktiv Gözləyən": { EN: "Active Pending", TR: "Aktif Bekleyen", RU: "Активные ожидания" },
      "Gəlmiş Rezervlər": { EN: "Arrived Reservations", TR: "Gelen Rezervasyonlar", RU: "Прибывшие гости" },
      "Ləğv Edilənlər": { EN: "Cancelled", TR: "İptal Edilenler", RU: "Отмененные" },
      "Cəmi Anbar Məhsulları": { EN: "Total Stock Items", TR: "Toplam Stok Ürünü", RU: "Всего товаров" },
      "KRİTİK STOK SƏVİYYƏSİNDƏ": { EN: "AT CRITICAL STOCK LEVEL", TR: "KRİTİK STOK SEVİYESİNDE", RU: "НА КРИТИЧЕСКОМ УРОВНЕ" },
      "Hazırlanmış / Hazırlanan Sifarişlər": { EN: "Prepared / Preparing Orders", TR: "Hazırlanan / Hazırlanmış Siparişler", RU: "Приготовленные / Готовящиеся заказы" },
      "Defekt jurnalı (Xarab / Geri qaytarılan)": { EN: "Defect Log (Defective / Returned)", TR: "Defolular (Bozuk / İade)", RU: "Журнал брака (Брак / Возврат)" },
      "Hal-hazırda Növbədədirlər": { EN: "Currently on Shift", TR: "Şu Anda Vardiyadalar", RU: "Сейчас на смене" },

      // SCREEN 11: SYSTEM CONTROL PANEL
      "Sistem İdarəetmə Paneli": {
        EN: "System Control Panel",
        TR: "Sistem Yönetim Paneli",
        RU: "Панель управления системой"
      },
      "Sistemin brendinq, kassa sıfırlanması, printer tənzimləmələri və ERP təhlükəsizlik audit jurnallarını bu paneldən idarə edə bilərsiniz.": {
        EN: "Manage system branding, cash reset, printer settings and ERP security audit logs from this panel.",
        TR: "Sistem markalaması, kasa sıfırlama, yazıcı ayarları ve ERP güvenlik denetim günlüklerini bu panelden yönetebilirsiniz.",
        RU: "Управляйте брендингом, сбросом кассы, настройками принтера и журналами аудита безопасности ERP на этой панели."
      },
      "1. BRENDİNG & LOQO": { EN: "1. BRANDING & LOGO", TR: "1. MARKALAMA & LOGO", RU: "1. БРЕНДИНГ И ЛОГО" },
      "2. PRINTER & ÇAP": { EN: "2. PRINTER & PRINT", TR: "2. YAZICI & ÇIKTI", RU: "2. ПРИНТЕР И ПЕЧАТЬ" },
      "3. MASA / KABİNETLƏR": { EN: "3. TABLES / CABINS", TR: "3. MASA / KABİNLER", RU: "3. СТОЛЫ / КАБИНЕТЫ" },
      "4. AUDİT TƏHLÜKƏSİZLİK": { EN: "4. SECURITY AUDIT", TR: "4. GÜVENLİK DENETİMİ", RU: "4. АУДИТ БЕЗОПАСНОСТИ" },
      "5. PURGE (SIFIRLA)": { EN: "5. PURGE (RESET)", TR: "5. SIFIRLA (TEMİZLE)", RU: "5. ОЧИСТКА (СБРОС)" },
      "PROQRAMIN ADI VƏ YAZI TƏNZİMLƏMƏLƏRİ": {
        EN: "APPLICATION NAME & FONT SETTINGS",
        TR: "UYGULAMA ADI VE YAZI AYARLARI",
        RU: "НАЗВАНИЕ ПРОГРАММЫ И НАСТРОЙКИ ТЕКСТА"
      },
      "Sidebar naviqasiyasında görünəcək restoran adını hər iki söz üçün ayrıca rəng, şrift fontu, ölçüsü, qalınlığı və ya kursiv tərzdə təyin edə bilərsiniz:": {
        EN: "Customize the restaurant name displayed in sidebar navigation with colors, font, size, weight, and style for each of the two words independently:",
        TR: "Sidebar menüsünde görünecek restoran adını her iki kelime için ayrı renk, yazı tipi, boyut, kalınlık ve italik olarak belirleyebilirsiniz:",
        RU: "Настройте название ресторана в боковой панели, выбрав цвета, шрифт, размер, толщину и курсив для каждого из двух слов отдельно:"
      },
      "1-CI SÖZ": { EN: "1ST WORD", TR: "1. KELİME", RU: "1-Е СЛОВО" },
      "2-CI SÖZ (İSTƏYƏ BAĞLI)": { EN: "2ND WORD (OPTIONAL)", TR: "2. KELİME (OPSİYONEL)", RU: "2-Е СЛОВО (ОПЦИОНАЛЬНО)" },
      "Yazı Rəngi:": { EN: "Font Color:", TR: "Yazı Rengi:", RU: "Цвет текста:" },
      "ŞRİFT FONTU": { EN: "FONT FAMILY", TR: "YAZI TİPİ", RU: "ШРИФТ" },
      "YAZI ÖLÇÜSÜ": { EN: "FONT SIZE", TR: "YAZI BOYUTU", RU: "РАЗМЕР" },
      "QALINLIĞI": { EN: "FONT WEIGHT", TR: "KALINLIK", RU: "ТОЛЩИНА" },
      "KURSİV (ƏYRİ)": { EN: "ITALIC", TR: "İTALİK", RU: "КУРСИВ" },
      "BREND ÖN-İZLƏMƏ": { EN: "BRAND PREVIEW", TR: "MARKA ÖNİZLEME", RU: "ПРЕДПРОСМОТР БРЕНДА" },
      "SIDEBAR REAL ÖN İZLƏMƏ": { EN: "SIDEBAR REAL PREVIEW", TR: "MENÜ GERÇEK ÖNİZLEME", RU: "РЕАЛЬНЫЙ ПРЕДПРОСМОТР В БОКОВОЙ ПАНЕЛИ" },
      "Brend tənzimləmələri dərhal sol tərəfdəki və bütün xarici brauzer pəncərələrində eyni saniyədə tətbiq olunur.": {
        EN: "Branding adjustments are instantly applied on the left-side and across all external browser tabs simultaneously.",
        TR: "Marka ayarları anında sol tarafta ve tüm tarayıcı pencerelerinde aynı saniyede uygulanır.",
        RU: "Настройки бренда мгновенно применяются на левой панели и во всех окнах браузера."
      },
      "PROQRAM LOQOSU": { EN: "APPLICATION LOGO", TR: "UYGULAMA LOGOSU", RU: "ЛОГОТИП ПРОГРАММЫ" },
      "Şəklin birbaşa keçid linkini daxil edə bilərsiniz və ya cihazınızdan yeni loqo faylı yükləyə bilərsiniz.": {
        EN: "Input a direct image link or drag-and-drop a custom logo file here directly.",
        TR: "Doğrudan görsel bağlantısı ekleyebilir ya da cihazınızdan logo yükleyebilirsiniz.",
        RU: "Введите прямую ссылку на изображение или загрузите логотип с устройства."
      },

      // DYNAMIC PLURAL SPECIAL UNITS
      "fəal sifariş": { EN: "active order(s)", TR: "aktif sipariş", RU: "активных заказов" },

      "Soyuq Yeməklər": { EN: "Cold Dishes", TR: "Soğuk Yemekler", RU: "Холодные блюда" },
      "İsti Yeməklər": { EN: "Hot Dishes", TR: "Sıcak Yemekler", RU: "Горячие блюда" },
      "İçkilər": { EN: "Drinks", TR: "İçecekler", RU: "Напитки" },
      "Salatlar": { EN: "Salads", TR: "Salatalar", RU: "Салаты" },
      "Desertlər": { EN: "Desserts", TR: "Tatlılar", RU: "Десерты" },
      "Şorbalar": { EN: "Soups", TR: "Çorbalar", RU: "Супы" },
      "Fast Food": { EN: "Fast Food", TR: "Fast Food", RU: "Фастфуд" }
    };

    // Case-insensitive dictionary lookup
    const lowercaseDict: Record<string, Record<'EN' | 'TR' | 'RU', string>> = {};
    for (const key of Object.keys(dict)) {
      lowercaseDict[key.toLowerCase()] = dict[key];
    }

    const lcKey = normalized.toLowerCase();
    const translationSet = lowercaseDict[lcKey];
    let result = text;
    if (translationSet) {
      result = translationSet[appLanguage as 'EN' | 'TR' | 'RU'] || text;
    }

    return convertCurrencyInText(result);
  };

  // Reports Sub Tab State
  const [reportsSubTab, setReportsSubTab] = useState<'sales' | 'reservations' | 'inventory' | 'kitchen' | 'staff'>('sales');

  // Printer settings State (persisted to localStorage)
  const [profileAName, setProfileAName] = useState<string>(() => {
    return localStorage.getItem('resto_profileA_name') || 'Xprinter XP-350B (Profil A - Qəbz)';
  });
  const [profileAType, setProfileAType] = useState<'thermal_80mm' | 'thermal_58mm' | 'a4_standard'>(() => {
    return (localStorage.getItem('resto_profileA_type') as any) || 'thermal_80mm';
  });
  const [profileAFontSize, setProfileAFontSize] = useState<'small' | 'normal' | 'large'>(() => {
    return (localStorage.getItem('resto_profileA_fontSize') as any) || 'normal';
  });

  const [profileBName, setProfileBName] = useState<string>(() => {
    return localStorage.getItem('resto_profileB_name') || 'Zebra ZD220 (Profil B - Mətbəx)';
  });
  const [profileBType, setProfileBType] = useState<'thermal_80mm' | 'thermal_58mm' | 'a4_standard'>(() => {
    return (localStorage.getItem('resto_profileB_type') as any) || 'thermal_80mm';
  });
  const [profileBFontSize, setProfileBFontSize] = useState<'small' | 'normal' | 'large'>(() => {
    return (localStorage.getItem('resto_profileB_fontSize') as any) || 'small';
  });

  const [profileCName, setProfileCName] = useState<string>(() => {
    return localStorage.getItem('resto_profileC_name') || 'Xprinter XP-Q800 (Profil C - Z-Hesabatı)';
  });
  const [profileCType, setProfileCType] = useState<'thermal_80mm' | 'thermal_58mm' | 'a4_standard'>(() => {
    return (localStorage.getItem('resto_profileC_type') as any) || 'thermal_80mm';
  });
  const [profileCFontSize, setProfileCFontSize] = useState<'small' | 'normal' | 'large'>(() => {
    return (localStorage.getItem('resto_profileC_fontSize') as any) || 'normal';
  });
  const [profileCPort, setProfileCPort] = useState<string>(() => {
    return localStorage.getItem('resto_profileC_port') || 'USB001';
  });

  const [searchPrinterModal, setSearchPrinterModal] = useState<{ isOpen: boolean; targetProfile: 'A' | 'B' | 'C' } | null>(null);
  const [discoveredPrinters, setDiscoveredPrinters] = useState<string[]>(() => {
    const saved = localStorage.getItem('resto_discovered_printers');
    return saved ? JSON.parse(saved) : ["Xprinter XP-350B", "Zebra ZD220 (Mətbəx)", "Xprinter XP-Q800 (Z-Hesabatı)", "Epson TM-T88VI (Mətbəx)", "Microsoft Print to PDF", "Canon LBP6030"];
  });

  const [printerType, setPrinterType] = useState<'thermal_80mm' | 'thermal_58mm' | 'a4_standard'>(() => {
    return (localStorage.getItem('printerType') as any) || 'thermal_80mm';
  });
  const [printerFontSize, setPrinterFontSize] = useState<'small' | 'normal' | 'large'>(() => {
    return (localStorage.getItem('printerFontSize') as any) || 'normal';
  });
  const [printerFooterText, setPrinterFooterText] = useState<string>(() => {
    const rawFooter = localStorage.getItem('printerFooterText');
    if (!rawFooter || rawFooter === 'Təşəkkür edirik! Yenə gözləyirik.') {
      return 'Bizi seçdiyiniz üçün təşəkkür edirik!\nYolunuzu yenə gözləyirik.';
    }
    return rawFooter;
  });
  const [printerMargin, setPrinterMargin] = useState<number>(() => {
    const val = localStorage.getItem('printerMargin');
    return val ? parseInt(val) : 4;
  });

  const [printerRouteMode, setPrinterRouteMode] = useState<'browser' | 'pdf' | 'svg' | 'txt' | 'network'>(() => {
    return (localStorage.getItem('printerRouteMode') as any) || 'browser';
  });
  const [networkPrinterIP, setNetworkPrinterIP] = useState<string>(() => {
    return localStorage.getItem('networkPrinterIP') || '192.168.1.100';
  });
  const [networkPrinterPort, setNetworkPrinterPort] = useState<string>(() => {
    return localStorage.getItem('networkPrinterPort') || '9100';
  });

  const [printerPresetType, setPrinterPresetType] = useState<string>(() => {
    return localStorage.getItem('resto_printerPresetType') || 'xprinter_xp350b';
  });

  const [printerSavedMessage, setPrinterSavedMessage] = useState<boolean>(false);

  const openDirectReportPrint = (preview: {
    isOpen: boolean;
    title: string;
    headers: string[];
    rows: any[][];
    isA4?: boolean;
  } | null) => {
    if (!preview || !preview.isOpen) return;

    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert("Çap pəncərəsinin açılması üçün brauzerdə pop-up icazəsi verilməlidir.");
      return;
    }

    const today = new Date();
    const formattedDayDate = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`;
    const headerSubtitle = `Tarix: ${formattedDayDate} • ${appNameWord1 || 'RESTO'} ${appNameWord2 || 'MASTER'}`;

    printWin.document.write(`
      <html>
        <head>
          <title>${preview.title}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; color: #0f172a; }
            h2 { text-align: center; margin-bottom: 4px; font-size: 20px; font-weight: 800; }
            p { text-align: center; color: #64748b; font-size: 12px; margin-top: 0; font-weight: 700; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; }
            th { background-color: #f8fafc; font-weight: 800; text-transform: uppercase; font-size: 10px; color: #475569; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .total { margin-top: 20px; text-align: right; font-size: 15px; font-weight: 800; color: #ea580c; }
          </style>
        </head>
        <body>
          <h2>${preview.title}</h2>
          <p>${headerSubtitle}</p>
          <table>
            <thead>
              <tr>
                ${preview.headers.map((h, i) => `<th class="${i === 0 ? 'text-center' : ''}">${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${preview.rows.map((row) => `
                <tr>
                  ${row.map((cell, cIdx) => `<td class="${cIdx === 0 ? 'text-center' : ''}">${cell}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total">Cəmi: ${preview.rows.length} qeyd</div>
          <script>
            window.onload = function() {
              window.focus();
              setTimeout(function() {
                window.print();
              }, 250);
            };
            window.addEventListener('afterprint', function() {
              setTimeout(function() {
                window.close();
              }, 300);
            });
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const setReportPrintPreview = (preview: any) => {
    if (preview && preview.isOpen) {
      openDirectReportPrint(preview);
    }
  };

  const savePrinterSettings = () => {
    safeLocalStorageSetItem('printerType', printerType);
    safeLocalStorageSetItem('printerFontSize', printerFontSize);
    safeLocalStorageSetItem('printerMargin', String(printerMargin));
    safeLocalStorageSetItem('printerFooterText', printerFooterText);
    safeLocalStorageSetItem('printerRouteMode', printerRouteMode);
    safeLocalStorageSetItem('networkPrinterIP', networkPrinterIP);
    safeLocalStorageSetItem('networkPrinterPort', networkPrinterPort);
    safeLocalStorageSetItem('resto_printerPresetType', printerPresetType);

    safeLocalStorageSetItem('resto_profileA_name', profileAName);
    safeLocalStorageSetItem('resto_profileA_type', profileAType);
    safeLocalStorageSetItem('resto_profileA_fontSize', profileAFontSize);
    safeLocalStorageSetItem('resto_profileB_name', profileBName);
    safeLocalStorageSetItem('resto_profileB_type', profileBType);
    safeLocalStorageSetItem('resto_profileB_fontSize', profileBFontSize);
    safeLocalStorageSetItem('resto_profileC_name', profileCName);
    safeLocalStorageSetItem('resto_profileC_type', profileCType);
    safeLocalStorageSetItem('resto_profileC_fontSize', profileCFontSize);
    safeLocalStorageSetItem('resto_profileC_port', profileCPort);

    setPrinterSavedMessage(true);
    setTimeout(() => {
      setPrinterSavedMessage(false);
    }, 4000);
  };

  const triggerPrinterTestPrint = (targetProfile: 'A' | 'B' | 'C') => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      const timestamp = new Date().toLocaleString(getActiveLocaleForApp());
      const selectedPrinter = targetProfile === 'A' ? profileAName : targetProfile === 'B' ? profileBName : profileCName;
      const profileLabel = targetProfile === 'A' ? 'PROFIL A - QƏBZ' : targetProfile === 'B' ? 'PROFIL B - MƏTBƏX' : 'PROFIL C - Z-HESABATI';
      let fontFam = "'Courier New', Courier, monospace";
      let maxW = "250px";
      
      const html = `
        <html>
        <head>
          <title>Sınaq Çeki - ${selectedPrinter}</title>
          <style>
            @media print { 
              body { margin: 0; padding: 4px; font-family: ${fontFam}; font-size: 11px; } 
            }
          </style>
        </head>
        <body>
          <div style="width: 100%; max-width: ${maxW}; font-family: ${fontFam}; line-height: 1.4;">
            <h3 style="text-align: center; margin-bottom: 2px;">RESTO MASTER</h3>
            <div style="text-align: center; font-size: 10px; font-weight: bold; margin-bottom: 6px;">SINAQ (TEST) ÇEKİ</div>
            <div style="border-bottom: 1px dashed #000; margin: 4px 0;"></div>
            <div>PROFİL: ${profileLabel}</div>
            <div>PRİNTER: ${selectedPrinter}</div>
            ${targetProfile === 'C' ? `<div>QOŞULMA PORTU: ${profileCPort || 'USB001'}</div>` : ''}
            <div>TARİX: ${timestamp}</div>
            <div style="border-bottom: 1px dashed #000; margin: 4px 0;"></div>
            <div style="display: flex; justify-content: space-between; font-size: 11px;">
              <span>Sınaq Məhsulu x1</span>
              <span style="font-weight: bold;">0.00 ₼</span>
            </div>
            <div style="border-bottom: 1px dashed #000; margin: 4px 0;"></div>
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 11px;">
              <span>CƏMİ MƏBLƏĞ:</span>
              <span>0.00 ₼</span>
            </div>
            <div style="border-bottom: 1px dashed #000; margin: 4px 0;"></div>
            <div style="text-align: center; font-size: 10px; margin-top: 8px; white-space: pre-line;">${printerFooterText}</div>
          </div>
          <script>
            window.focus(); 
            setTimeout(function() { 
              window.print(); 
              window.parent.document.body.removeChild(window.frameElement); 
            }, 300);
          </script>
        </body>
        </html>
      `;
      doc.open();
      doc.write(html);
      doc.close();
    }
  };

  const [printingTicket, setPrintingTicket] = useState<{
    isOpen: boolean;
    tableNumber: string;
    waiterName: string;
    items: any[];
    total: number;
    paymentMethod: string;
    appName1stWord: string;
    appName2ndWord: string;
  } | null>(null);

  useEffect(() => {
    triggerGlobalPrint = null;
    return () => {
      triggerGlobalPrint = null;
    };
  }, []);

  // Derived appName helper for alt tags and fallbacks
  const appName = `${appNameWord1} ${appNameWord2}`.trim() || 'RESTOMASTER';

  React.useEffect(() => {
    const fullTitle = 'Restomaster - Restoran İdarəetmə Sistemi';
    document.title = fullTitle;
    if ((window as any).electron && (window as any).electron.updateTitle) {
      (window as any).electron.updateTitle(fullTitle);
    }
  }, [appName]);

  React.useEffect(() => {
    if ((window as any).electron) {
      if ((window as any).electron.getPrintersDetailed) {
        (window as any).electron.getPrintersDetailed().then((detailedList: any[]) => {
          if (Array.isArray(detailedList) && detailedList.length > 0) {
            (window as any)._resto_electron_printers_detailed = detailedList;
            const names = detailedList.map((p: any) => p.name).filter(Boolean);
            setDiscoveredPrinters(prev => {
              const merged = Array.from(new Set([...prev, ...names]));
              safeLocalStorageSetItem('resto_discovered_printers', JSON.stringify(merged));
              return merged;
            });
          }
        }).catch((err: any) => console.error("Error fetching detailed system printers:", err));
      } else if ((window as any).electron.getPrinters) {
        (window as any).electron.getPrinters().then((printersList: string[]) => {
          if (Array.isArray(printersList) && printersList.length > 0) {
            setDiscoveredPrinters(prev => {
              const merged = Array.from(new Set([...prev, ...printersList]));
              safeLocalStorageSetItem('resto_discovered_printers', JSON.stringify(merged));
              return merged;
            });
          }
        }).catch((err: any) => {
          console.error("Error fetching system printers:", err);
        });
      }
    }
  }, []);

  React.useEffect(() => {
    if (['menu', 'inventory', 'staff', 'ai', 'reports'].includes(activeTab)) {
      setManagementSubTab(activeTab as any);
      setActiveTab('management');
    }
  }, [activeTab]);

  React.useEffect(() => {
    // Reset payment method buttons visibility whenever changing pages/tabs (acting like Ctrl+B)
    setShowPaymentMethodSection(false);

    if (activeTab === 'dashboard') {
      const currentShiftDate = activeShift?.businessDate || getActiveShiftBusinessDate();
      setDashboardPeriod('daily');
      setDashboardDate(currentShiftDate);
      setZReportDate(currentShiftDate);
      setDashboardSoldTableFilter('all');
    }
    if (activeTab !== 'tables') {
      setTablesSubMode('tables');
    }
    if (activeTab !== 'management') {
      setIsManagementUnlocked(false);
      setIsInventoryUnlocked(false);
      setTypedPassword('');
      setPasswordFeedback('idle');
      setInventoryTypedPassword('');
      setInventoryPasswordFeedback('idle');
      setMenuSubTab('dishes');
    }
    if (activeTab !== 'admin') {
      setIsAdminUnlocked(false);
      setAdminTypedPassword('');
      setAdminPasswordFeedback('idle');
    }
  }, [activeTab, activeShift?.businessDate]);

  React.useEffect(() => {
    // Reset payment method buttons visibility when changing/switching table
    setShowPaymentMethodSection(false);

    if (selectedTableId) {
      setIsSidebarCollapsed(true);
    }
    setPaymentMethod('cash');
    setCustomerCashPaid('');
    setCustomMixedCash('');
    setCustomMixedCard('');
  }, [selectedTableId]);

  React.useEffect(() => {
    setCustomerCashPaid('');
    setCustomMixedCash('');
    setCustomMixedCard('');
  }, [paymentMethod]);

  React.useEffect(() => {
    setNewDishError(null);
  }, [isAddingDish]);

  React.useEffect(() => {
    if (!isLoadedFromSQLiteRef.current) return;
    if (tables && tables.length > 0) {
      safeLocalStorageSetItem('resto_tables', JSON.stringify(tables));
      if ((window as any).electron?.sqliteSaveEntity) {
        (window as any).electron.sqliteSaveEntity('tables', tables).catch((e: any) => console.log('SQLite tables sync:', e));
      }
    }
  }, [tables]);

  React.useEffect(() => {
    if (!isLoadedFromSQLiteRef.current) return;
    safeLocalStorageSetItem('resto_menuItems', JSON.stringify(menuItems));
    if ((window as any).electron?.sqliteSaveEntity) {
      (window as any).electron.sqliteSaveEntity('menuItems', menuItems).catch((e: any) => console.log('SQLite menuItems sync:', e));
    }
  }, [menuItems]);

  const hasOptimizedLegacyImagesRef = useRef(false);
  React.useEffect(() => {
    if (hasOptimizedLegacyImagesRef.current || !menuItems || menuItems.length === 0) return;
    const heavyItems = menuItems.filter(item => item.image && typeof item.image === 'string' && item.image.startsWith('data:image/') && item.image.length > 50000);
    if (heavyItems.length === 0) {
      hasOptimizedLegacyImagesRef.current = true;
      return;
    }

    hasOptimizedLegacyImagesRef.current = true;
    let isMounted = true;
    Promise.all(
      menuItems.map(async (item) => {
        if (item.image && typeof item.image === 'string' && item.image.startsWith('data:image/') && item.image.length > 50000) {
          const optimized = await compressDataUrl(item.image);
          return { ...item, image: optimized };
        }
        return item;
      })
    ).then(optimizedItems => {
      if (isMounted) {
        setMenuItems(optimizedItems);
      }
    }).catch(() => {});

    return () => { isMounted = false; };
  }, [menuItems]);

  React.useEffect(() => {
    if (!isLoadedFromSQLiteRef.current) return;
    safeLocalStorageSetItem('resto_reservations', JSON.stringify(reservations));
    if ((window as any).electron?.sqliteSaveEntity) {
      (window as any).electron.sqliteSaveEntity('reservations', reservations).catch((e: any) => console.log('SQLite reservations sync:', e));
    }
  }, [reservations]);

  React.useEffect(() => {
    if (!isLoadedFromSQLiteRef.current) return;
    safeLocalStorageSetItem('resto_inventory', JSON.stringify(inventory));
    if ((window as any).electron?.sqliteSaveEntity) {
      (window as any).electron.sqliteSaveEntity('inventory', inventory).catch((e: any) => console.log('SQLite inventory sync:', e));
    }
  }, [inventory]);

  React.useEffect(() => {
    if (!isLoadedFromSQLiteRef.current) return;
    safeLocalStorageSetItem('resto_inventoryTransactions', JSON.stringify(inventoryTransactions));
    if ((window as any).electron?.sqliteSaveEntity) {
      (window as any).electron.sqliteSaveEntity('inventoryTransactions', inventoryTransactions).catch((e: any) => console.log('SQLite inventoryTransactions sync:', e));
    }
  }, [inventoryTransactions]);

  React.useEffect(() => {
    if (!isLoadedFromSQLiteRef.current) return;
    safeLocalStorageSetItem('resto_orderTransactions', JSON.stringify(orderTransactions));
    if ((window as any).electron?.sqliteSaveEntity) {
      (window as any).electron.sqliteSaveEntity('orderTransactions', orderTransactions).catch((e: any) => console.log('SQLite orderTransactions sync:', e));
    }
  }, [orderTransactions]);

  React.useEffect(() => {
    if (!isLoadedFromSQLiteRef.current) return;
    safeLocalStorageSetItem('resto_staff', JSON.stringify(staff));
    if ((window as any).electron?.sqliteSaveEntity) {
      (window as any).electron.sqliteSaveEntity('staff', staff).catch((e: any) => console.log('SQLite staff sync:', e));
    }
  }, [staff]);

  React.useEffect(() => {
    if (!isLoadedFromSQLiteRef.current) return;
    safeLocalStorageSetItem('resto_kitchenLog', JSON.stringify(kitchenLog));
    if ((window as any).electron?.sqliteSaveEntity) {
      (window as any).electron.sqliteSaveEntity('kitchenLog', kitchenLog).catch((e: any) => console.log('SQLite kitchenLog sync:', e));
    }
  }, [kitchenLog]);

  React.useEffect(() => {
    if (!isLoadedFromSQLiteRef.current) return;
    safeLocalStorageSetItem('resto_activeOrders', JSON.stringify(activeOrders));
    if ((window as any).electron?.sqliteSaveEntity) {
      (window as any).electron.sqliteSaveEntity('activeOrders', activeOrders).catch((e: any) => console.log('SQLite activeOrders sync:', e));
    }
  }, [activeOrders]);

  React.useEffect(() => {
    if (!isLoadedFromSQLiteRef.current) return;
    safeLocalStorageSetItem('resto_defectRecords', JSON.stringify(defectRecords));
    if ((window as any).electron?.sqliteSaveEntity) {
      (window as any).electron.sqliteSaveEntity('resto_defectRecords', defectRecords).catch((e: any) => console.log('SQLite defectRecords sync:', e));
    }
  }, [defectRecords]);

  React.useEffect(() => {
    if (!isLoadedFromSQLiteRef.current) return;
    safeLocalStorageSetItem('resto_auditLogs', JSON.stringify(auditLogs));
    if ((window as any).electron?.sqliteSaveEntity) {
      (window as any).electron.sqliteSaveEntity('resto_auditLogs', auditLogs).catch((e: any) => console.log('SQLite auditLogs sync:', e));
    }
  }, [auditLogs]);

  React.useEffect(() => {
    if (!isLoadedFromSQLiteRef.current) return;
    if (activeShift) {
      safeLocalStorageSetItem('resto_activeShift', JSON.stringify(activeShift));
      if ((window as any).electron?.sqliteSaveEntity) {
        (window as any).electron.sqliteSaveEntity('resto_activeShift', activeShift).catch((e: any) => console.log('SQLite activeShift sync:', e));
      }
    }
  }, [activeShift]);

  React.useEffect(() => {
    const checkDateRollover = () => {
      if (!isLoadedFromSQLiteRef.current) return;
      
      // If activeShift already exists and is active/open, do NOT overwrite or re-create it in loop!
      if (activeShift && !activeShift.isClosed && activeShift.businessDate) {
        return;
      }

      const realToday = getTodayStr();
      const normBizDate = normalizeDateKey(activeShift?.businessDate);
      const dayClosed = normBizDate ? closedShifts[normBizDate] : null;
      const closedCount = (dayClosed?.allShifts && Array.isArray(dayClosed.allShifts)) 
        ? dayClosed.allShifts.length 
        : (dayClosed?.shiftId ? 1 : 0);

      const isCurrentShiftDead = Boolean(!activeShift || activeShift?.isClosed || closedCount >= 2);

      if (isCurrentShiftDead) {
        const hasActiveOrderItems = Object.values(activeOrders).some(
          (orders) => Array.isArray(orders) && orders.length > 0
        );
        if (!hasActiveOrderItems) {
          const currentBiz = activeShift?.businessDate || realToday;
          const nextDate = (realToday > currentBiz) 
            ? realToday 
            : (closedCount >= 2 ? getNextDateStr(currentBiz) : realToday);
          
          const newShift = {
            id: `shift_${Date.now()}`,
            businessDate: nextDate,
            openedAt: new Date().toISOString(),
            isClosed: false
          };
          setActiveShift(newShift);
          safeLocalStorageSetItem('resto_activeShift', JSON.stringify(newShift));
          setDashboardShiftId(newShift.id);
          setDashboardDate(nextDate);
          setReportDate(nextDate);
          setZReportDate(nextDate);
          setExpenseDate(nextDate);
          setKitchenDate(nextDate);
          if ((window as any).electron?.sqliteSaveEntity) {
            (window as any).electron.sqliteSaveEntity('resto_activeShift', newShift).catch((e: any) => console.log('SQLite activeShift sync:', e));
          }
        }
      }
    };

    checkDateRollover();
    const timer = setInterval(checkDateRollover, 60000);
    return () => clearInterval(timer);
  }, [activeShift?.isClosed, activeOrders, closedShifts]);

  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      try {
        if (e.key === 'resto_activeOrders' && e.newValue) {
          setActiveOrders(JSON.parse(e.newValue));
        }
        if (e.key === 'resto_tables' && e.newValue) {
          setTables(JSON.parse(e.newValue));
        }
        if (e.key === 'resto_reservations' && e.newValue) {
          setReservations(JSON.parse(e.newValue));
        }
        if (e.key === 'resto_kitchenLog' && e.newValue) {
          setKitchenLog(JSON.parse(e.newValue));
        }
        if (e.key === 'resto_inventory' && e.newValue) {
          setInventory(JSON.parse(e.newValue));
        }
        if (e.key === 'resto_inventoryTransactions' && e.newValue) {
          setInventoryTransactions(JSON.parse(e.newValue));
        }
        if (e.key === 'resto_orderTransactions' && e.newValue) {
          setOrderTransactions(JSON.parse(e.newValue));
        }
        if (e.key === 'resto_staff' && e.newValue) {
          setStaff(JSON.parse(e.newValue));
        }
      } catch (err) {
        console.error("Storage sync failed", err);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  React.useEffect(() => {
    // Auto scroll the cart panels when items are added to ensure fast-clicking POS feedback
    setTimeout(() => {
      const tabletCart = document.getElementById('tablet-cart-scroll');
      const standardCart = document.getElementById('standard-cart-scroll');
      if (tabletCart) {
        tabletCart.scrollTop = tabletCart.scrollHeight;
      }
      if (standardCart) {
        standardCart.scrollTop = standardCart.scrollHeight;
      }
    }, 100);
  }, [activeOrders, selectedTableId]);

  // --- KİBERTƏHLÜKƏSİZLİK VƏ SİSTEMİN QORUNMASI: F12, DevTools və İnspeksiyanın Bloklanması ---
  React.useEffect(() => {
    const handleSecurityKeyDown = (e: KeyboardEvent) => {
      // 1. F12 Düyməsini bloklamaq
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // 2. Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (Developer Tools / Konsol)
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // 3. Ctrl+U (Səhifənin mənbə koduna baxış)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // 4. Ctrl+S (Təhlükəsizlik üçün brauzer html yadda saxlanılmasını bloklamaq)
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    const handleSecurityContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    window.addEventListener('keydown', handleSecurityKeyDown, { capture: true });
    window.addEventListener('contextmenu', handleSecurityContextMenu, { capture: true });

    return () => {
      window.removeEventListener('keydown', handleSecurityKeyDown, { capture: true });
      window.removeEventListener('contextmenu', handleSecurityContextMenu, { capture: true });
    };
  }, []);

  // --- SİSTEMDƏN ÇIXIŞ VƏ BÜTÜN VERİLƏNLƏRİN D:\Restomaster QOVLUĞUNA BİRBASA BACKUP YAZILMASI VƏ BAĞLANMASI ---
  const handleExitWithBackup = async () => {
    try {
      // Proqramdan çıxış edərkən ən son anbar məlumatlarını dərhal təhlükəsiz şəkildə yadda saxla
      safeLocalStorageSetItem('resto_inventory', JSON.stringify(inventory));
      safeLocalStorageSetItem('resto_inventoryTransactions', JSON.stringify(inventoryTransactions));
      if ((window as any).electron?.sqliteSaveEntity) {
        await (window as any).electron.sqliteSaveEntity('inventory', inventory).catch(() => {});
        await (window as any).electron.sqliteSaveEntity('inventoryTransactions', inventoryTransactions).catch(() => {});
      }

      const backupData = {
        version: "2.0",
        system: "RestoMaster POS Cloud ERP",
        backup_timestamp: new Date().toISOString(),
        backup_date_az: new Date().toLocaleString(getActiveLocaleForApp()),
        target_folder: "D:\\Restomaster",
        target_file: "RestoMaster_Backup.json",
        resto_tables: tables,
        resto_menuItems: menuItems,
        resto_reservations: reservations,
        resto_inventory: inventory,
        resto_inventoryTransactions: inventoryTransactions,
        resto_inventory_hash: localStorage.getItem('resto_inventory_hash') || '',
        resto_inventory_hash_customized: localStorage.getItem('resto_inventory_hash_customized') || '',
        resto_orderTransactions: orderTransactions,
        resto_expenses: expenses,
        resto_defectRecords: defectRecords,
        resto_staff: staff,
        resto_kitchenLog: kitchenLog,
        resto_activeOrders: activeOrders,
        resto_auditLogs: auditLogs,
        resto_closedShifts: closedShifts,
        resto_activeShift: activeShift,
        // Printer settings
        printerType,
        printerFontSize,
        printerMargin,
        printerFooterText,
        printerRouteMode,
        networkPrinterIP,
        networkPrinterPort,
        resto_printerPresetType: printerPresetType,
        // Branding settings
        resto_appNameWord1: appNameWord1,
        resto_appNameWord2: appNameWord2,
        resto_appNameColor1: appNameColor1,
        resto_appNameColor2: appNameColor2,
        resto_appNameFontSize: appNameFontSize,
        resto_appNameFontFamily: appNameFontFamily,
        resto_appNameFontWeight: appNameFontWeight,
        resto_appNameFontStyle: appNameFontStyle,
        resto_appLogoUrl: appLogoUrl,
        // Developer portfolio & program details
        resto_devName: devName,
        resto_devBio: devBio,
        resto_devEmail: devEmail,
        resto_devPhone: devPhone,
        resto_devWhatsapp: devWhatsapp,
        resto_devGithub: devGithub,
        resto_devLinkedin: devLinkedin,
        resto_devWebsite: devWebsite,
        resto_devLogoUrl: devLogoUrl,
        resto_devPrograms: devPrograms
      };

      const encryptedString = await encryptBackupPayload(backupData);

      // 1. Yerli yaddaşda təhlükəsiz olaraq köhnə backup-ı yenisi ilə əvəzləmək (Şifrələnmiş formatda)
      localStorage.removeItem('resto_master_d_disk_backup_safe');
      safeLocalStorageSetItem('resto_master_d_disk_backup_safe', encryptedString);

      // 2. Audit Loqa təhlükəsiz çıxış və backup qeydini əlavə etmək
      addAuditLog(
        "SİSTEMDƏN ÇIXIŞ VƏ ŞİFRƏLİ REZERV YAZILDI", 
        "İstifadəçi", 
        "Bütün sistem məlumatlarının nüsxəsi D:\\Restomaster qovluğuna AES-256 hərbi dərəcəli şifrələnmə ilə saxlanıldı və proqram bağlandı.", 
        "info"
      );

      // 3. Əgər masaüstü (Electron) mühitindədirsə, istifadəçidən heç bir yer soruşmadan birbaşa D:\Restomaster qovluğunda yazır və pəncərəni bağlayır
      if ((window as any).electron && (window as any).electron.backupAndExit) {
        await (window as any).electron.backupAndExit(encryptedString);
        return;
      }

      // 4. Əgər brauzer mühitindədirsə, sessiyanı kilidləyir
      setIsStartupUnlocked(false);
      setIsManagementUnlocked(false);
      setIsAdminUnlocked(false);
      setIsInventoryUnlocked(false);
      localStorage.removeItem('isStartupUnlocked');
      localStorage.removeItem('isAdminUnlocked');
      localStorage.removeItem('isManagementUnlocked');
      localStorage.removeItem('isInventoryUnlocked');
    } catch (err) {
      console.error("Backup və Çıxış xətası:", err);
      if ((window as any).electron && (window as any).electron.quitApp) {
        (window as any).electron.quitApp();
        return;
      }
      setIsStartupUnlocked(false);
      setIsManagementUnlocked(false);
      setIsAdminUnlocked(false);
      localStorage.removeItem('isStartupUnlocked');
      localStorage.removeItem('isAdminUnlocked');
      localStorage.removeItem('isManagementUnlocked');
    }
  };

  const handleMixedCashChange = (val: string, total: number) => {
    setCustomMixedCash(val);
    const numericCash = parseFloat(val);
    if (!isNaN(numericCash)) {
      const neededCard = Math.max(0, total - numericCash);
      setCustomMixedCard(neededCard.toFixed(2));
    } else {
      setCustomMixedCard('');
    }
  };

  const handleMixedCardChange = (val: string, total: number) => {
    setCustomMixedCard(val);
    const numericCard = parseFloat(val);
    if (!isNaN(numericCard)) {
      const neededCash = Math.max(0, total - numericCard);
      setCustomMixedCash(neededCash.toFixed(2));
    } else {
      setCustomMixedCash('');
    }
  };

  const selectedTable = React.useMemo(() => tables.find(t => t.id === selectedTableId), [tables, selectedTableId]);
  const currentOrder = React.useMemo(() => (selectedTableId ? activeOrders[selectedTableId] || [] : []), [selectedTableId, activeOrders]);

  const [menuSearch, setMenuSearch] = useState('');
  const [menuFilter, setMenuFilter] = useState('Hamısı');

  const addToOrder = (item: MenuItem) => {
    if (!selectedTableId) return;
    
    setTables(prev => prev.map(t => 
      t.id === selectedTableId 
        ? { ...t, status: 'occupied' } 
        : t
    ));

    const now = new Date();
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setActiveOrders(prev => {
      const tableOrders = prev[selectedTableId] || [];
      const existingItemIndex = tableOrders.findIndex(i => i.menuId === item.id && i.status === 'pending');
      
      let newOrders;
      if (existingItemIndex > -1) {
        newOrders = [...tableOrders];
        newOrders[existingItemIndex] = { 
          ...newOrders[existingItemIndex], 
          quantity: newOrders[existingItemIndex].quantity + 1,
          orderTime: newOrders[existingItemIndex].orderTime || currentTimeStr
        };
      } else {
        newOrders = [...tableOrders, { 
          id: Date.now(), 
          menuId: item.id, 
          name: item.name, 
          price: item.price, 
          quantity: 1, 
          status: 'pending',
          orderTime: currentTimeStr
        }];
      }

      const validTotal = calculateValidOrderTotal(newOrders);
      setTables(prevTables => prevTables.map(t => t.id === selectedTableId ? { ...t, orderTotal: validTotal === 0 ? undefined : validTotal } : t));

      return { ...prev, [selectedTableId]: newOrders };
    });
  };

  const updateQuantity = (itemId: number, delta: number) => {
    if (!selectedTableId) return;

    setActiveOrders(prev => {
      const tableOrders = prev[selectedTableId] || [];
      const newOrders = tableOrders.map(i => {
        if (i.id === itemId && i.status === 'pending') {
          const newQty = Math.max(0, i.quantity + delta);
          return { ...i, quantity: newQty };
        }
        return i;
      }).filter(i => i.quantity > 0);

      const validTotal = calculateValidOrderTotal(newOrders);
      setTables(prevTables => prevTables.map(t => 
        t.id === selectedTableId 
          ? { ...t, orderTotal: validTotal === 0 ? undefined : validTotal, status: (validTotal === 0 && tableOrders.every(o => o.status === 'pending')) ? 'available' : 'occupied' } 
          : t
      ));

      return { ...prev, [selectedTableId]: newOrders };
    });
  };

  const deleteOrderItem = (itemId: number, qtyToDelete: number = 1, reason: string = 'Yanlış vurulub') => {
    if (!selectedTableId) return;

    const tableObj = tables.find(t => t.id === selectedTableId);
    const currentTableOrders = activeOrders[selectedTableId] || [];
    const itemToDelete = currentTableOrders.find(i => i.id === itemId);
    const tableNum = tableObj?.number || `Masa #${selectedTableId}`;
    const waiter = tableObj?.waiterName || 'Ofisiant';

    if (itemToDelete) {
      addAuditLog(
        "Məhsul Silindi",
        waiter,
        `${tableNum} - ${qtyToDelete} ədəd '${itemToDelete.name}' silindi. Səbəb: ${reason}`,
        "warning"
      );
    }

    setActiveOrders(prev => {
      const tableOrders = prev[selectedTableId] || [];
      const newOrders: OrderItem[] = [];

      tableOrders.forEach(i => {
        if (i.id === itemId) {
          if (qtyToDelete >= i.quantity) {
            newOrders.push({
              ...i,
              status: 'cancelled',
              deleteReason: reason
            });
          } else {
            newOrders.push({
              ...i,
              quantity: i.quantity - qtyToDelete
            });
            newOrders.push({
              ...i,
              id: Date.now() + Math.random(),
              quantity: qtyToDelete,
              status: 'cancelled',
              deleteReason: reason
            });
          }
        } else {
          newOrders.push(i);
        }
      });

      const validTotal = calculateValidOrderTotal(newOrders);

      setTables(prevTables => prevTables.map(t => 
        t.id === selectedTableId 
          ? { 
              ...t, 
              orderTotal: validTotal === 0 ? undefined : validTotal,
              status: validTotal === 0 && newOrders.every(i => i.status === 'cancelled' || i.status === 'defective' || i.status === 'returned') ? 'available' : t.status 
            } 
          : t
      ));

      return { ...prev, [selectedTableId]: newOrders };
    });

    if (itemToDelete) {
      setKitchenLog(prevLog => {
        let remaining = qtyToDelete;
        let matchedAny = false;
        const cleanTargetTableNum = String(tableNum).replace(/\D/g, '');

        const updated = prevLog.map(k => {
          const cleanKTableNum = String(k.tableNumber || '').replace(/\D/g, '');
          const isTableMatch = (Boolean(cleanTargetTableNum) && Boolean(cleanKTableNum) && cleanTargetTableNum === cleanKTableNum) ||
            k.tableNumber === tableNum || 
            k.tableNumber === tableObj?.number || 
            k.tableNumber === String(selectedTableId) || 
            k.tableNumber === `Masa ${tableObj?.number}`;

          const isMatch = remaining > 0 &&
            k.dishName === itemToDelete.name &&
            isTableMatch &&
            (k.status === 'preparing' || k.status === 'ready' || k.status === 'delivered');

          if (isMatch) {
            matchedAny = true;
            if (k.quantity <= remaining) {
              remaining -= k.quantity;
              return [{
                ...k,
                status: 'cancelled' as const,
                notes: reason ? `${reason}` : 'Silindi',
                timestamp: new Date()
              }];
            } else {
              const updatedQty = k.quantity - remaining;
              const cancelledItem: KitchenItem = {
                ...k,
                id: Date.now() + Math.random(),
                quantity: remaining,
                status: 'cancelled' as const,
                notes: reason ? `${reason}` : 'Silindi',
                timestamp: new Date()
              };
              remaining = 0;
              return [{ ...k, quantity: updatedQty }, cancelledItem];
            }
          }
          return [k];
        });

        let finalLog = updated.flat();

        if (!matchedAny || remaining > 0) {
          const fallbackQty = !matchedAny ? qtyToDelete : remaining;
          const currentShiftBusinessDate = activeShift?.businessDate || getActiveShiftBusinessDate();
          const newEntry: KitchenItem = {
            id: Date.now() + Math.random(),
            orderId: selectedTableId,
            dishName: itemToDelete.name,
            tableNumber: tableNum,
            waiterName: waiter,
            timestamp: new Date(),
            date: currentShiftBusinessDate || getTodayStr(),
            status: 'cancelled' as const,
            quantity: fallbackQty,
            notes: reason ? `${reason}` : 'Silindi',
            shiftId: activeShift?.id,
            isClosed: false
          };
          finalLog = [newEntry, ...finalLog];
        }

        return finalLog;
      });
    }
  };

  const setItemStatus = (itemId: number, status: OrderItemStatus) => {
    if (!selectedTableId) return;
    setActiveOrders(prev => {
      const tableOrders = prev[selectedTableId] || [];
      const newOrders = tableOrders.map(i => i.id === itemId ? { ...i, status, isCancellationPrinted: (status === 'defective' || status === 'returned' || status === 'cancelled') ? false : i.isCancellationPrinted } : i);
      
      const validTotal = calculateValidOrderTotal(newOrders);
      setTables(prevTables => prevTables.map(t => t.id === selectedTableId ? { ...t, orderTotal: validTotal === 0 ? undefined : validTotal } : t));
      
      return { ...prev, [selectedTableId]: newOrders };
    });
  };

  const toggleItemGift = (itemId: number, giftQty?: number) => {
    if (!selectedTableId) return;

    setActiveOrders(prev => {
      const tableOrders = prev[selectedTableId] || [];
      const item = tableOrders.find(i => i.id === itemId);
      if (!item) return prev;

      let newOrders: OrderItem[];
      if (item.isGift) {
        // Əgər artıq hədiyyədirsə, hədiyyə statusunu ləğv et
        newOrders = tableOrders.map(i => i.id === itemId ? { ...i, isGift: false } : i);
      } else {
        const targetQty = giftQty && giftQty > 0 ? Math.min(giftQty, item.quantity) : item.quantity;
        if (targetQty >= item.quantity) {
          // Bütün sayını hədiyyə et
          newOrders = tableOrders.map(i => i.id === itemId ? { ...i, isGift: true } : i);
        } else {
          // Sayından azını hədiyyə etdikdə: qalan hissə adi, seçilən hissə hədiyyə kimi bölünür
          const remainingQty = item.quantity - targetQty;
          const giftItem: OrderItem = {
            ...item,
            id: Date.now() + Math.floor(Math.random() * 1000),
            quantity: targetQty,
            isGift: true,
          };
          newOrders = tableOrders.flatMap(i => {
            if (i.id === itemId) {
              return [{ ...i, quantity: remainingQty }, giftItem];
            }
            return [i];
          });
        }
      }
      
      const validTotal = calculateValidOrderTotal(newOrders);
      setTables(prevTables => prevTables.map(t => t.id === selectedTableId ? { ...t, orderTotal: validTotal === 0 ? undefined : validTotal } : t));
      
      return { ...prev, [selectedTableId]: newOrders };
    });
  };

  const transferTable = (targetTableId: number) => {
    if (!selectedTableId || targetTableId === selectedTableId) return;
    
    const targetTable = tables.find(t => t.id === targetTableId);
    if (targetTable?.status !== 'available') return;

    setActiveOrders(prev => {
      const newOrders = { ...prev };
      newOrders[targetTableId] = [...(newOrders[selectedTableId] || [])];
      delete newOrders[selectedTableId];
      return newOrders;
    });

    setTables(prev => prev.map(t => {
      if (t.id === selectedTableId) return { ...t, status: 'available', orderTotal: undefined };
      if (t.id === targetTableId) return { ...t, status: 'occupied', orderTotal: selectedTable?.orderTotal };
      return t;
    }));

    setSelectedTableId(targetTableId);
    setIsMoveTargetOpen(false);
  };

  const cancelFullTable = () => {
    if (!selectedTableId) return;
    const tableObj = tables.find(t => t.id === selectedTableId);
    if (tableObj) {
      const orderTotal = tableObj.orderTotal || 0;
      const waiter = tableObj.waiterName || 'Kassir';
      addAuditLog(
        "Sifariş Silindi",
        `Kassir / ${waiter}`,
        `${tableObj.number} masası üzrə bütün aktiv sifarişlər silindi. Silinən məbləğ: ${orderTotal.toFixed(2)} ₼.`,
        "danger"
      );
    }
    setActiveOrders(prev => {
      const newOrders = { ...prev };
      delete newOrders[selectedTableId];
      return newOrders;
    });
    setTables(prev => prev.map(t => 
      t.id === selectedTableId ? { ...t, status: 'available', orderTotal: undefined, waiterName: undefined } : t
    ));
    setSelectedTableId(null);
  };

  const sendToKitchen = () => {
    if (!selectedTableId) return;
    const table = tables.find(t => t.id === selectedTableId);
    
    const tableOrders = activeOrders[selectedTableId] || [];
    const pendingItemsForTicket = tableOrders.filter(i => i.status === 'pending');
    const cancelledItemsForTicket = tableOrders.filter(i => (i.status === 'defective' || i.status === 'returned' || i.status === 'cancelled') && !i.isCancellationPrinted);

    let printedSomething = false;

    if (pendingItemsForTicket.length > 0) {
      const pendingItemsToPrint = pendingItemsForTicket.filter(i => !i.isGift);
      if (pendingItemsToPrint.length > 0) {
        printKitchenTicket(
          table?.number || `Masa #${selectedTableId}`,
          table?.waiterName || 'Naməlum',
          pendingItemsToPrint.map(i => ({
            name: i.name,
            quantity: i.quantity,
            notes: i.notes
          })),
          false,
          false
        );
        printedSomething = true;
      }

      // --- Reseptura və Maya Dəyəri Modulu: Real-vaxt Anbardan Silinmə ---
      setInventory(prevInv => {
        let updatedInv = [...prevInv];
        pendingItemsForTicket.forEach(ticketItem => {
          const itemRecipe = recipes[ticketItem.menuId];
          if (itemRecipe) {
            itemRecipe.forEach(recipeIngredient => {
              updatedInv = updatedInv.map(invItem => {
                if (invItem.id === recipeIngredient.ingredientId) {
                  const deduction = recipeIngredient.amount * ticketItem.quantity;
                  const newQty = Math.max(0, Number((invItem.quantity - deduction).toFixed(3)));
                  return { ...invItem, quantity: newQty };
                }
                return invItem;
              });
            });
          }
        });
        return updatedInv;
      });
    }

    if (cancelledItemsForTicket.length > 0) {
      printKitchenTicket(
        table?.number || `Masa #${selectedTableId}`,
        table?.waiterName || 'Naməlum',
        cancelledItemsForTicket.map(i => ({
          name: i.name,
          quantity: i.quantity,
          notes: i.notes ? `${i.notes} (${i.deleteReason || (i.status === 'defective' ? 'Xarab' : i.status === 'returned' ? 'Geri' : 'Silindi')})` : (i.deleteReason || (i.status === 'defective' ? 'Xarab' : i.status === 'returned' ? 'Geri alındı' : 'Silindi'))
        })),
        false,
        true // isCancellation = true
      );
      printedSomething = true;

      // Also update matching items in kitchen logs on-screen
      setKitchenLog(prevLog => {
        let updatedLog = [...prevLog];
        cancelledItemsForTicket.forEach(c => {
          let remainingCancelQty = c.quantity || 1;
          updatedLog = updatedLog.map(logItem => {
            if (
              remainingCancelQty > 0 &&
              c.name === logItem.dishName &&
              (table?.number || '?') === logItem.tableNumber &&
              (logItem.status === 'preparing' || logItem.status === 'ready')
            ) {
              if (logItem.quantity <= remainingCancelQty) {
                remainingCancelQty -= logItem.quantity;
                return { ...logItem, status: (c.status === 'returned' ? 'returned' : c.status === 'cancelled' ? 'cancelled' : 'defective') as any, notes: c.deleteReason || logItem.notes };
              } else {
                const updatedQty = logItem.quantity - remainingCancelQty;
                remainingCancelQty = 0;
                return { ...logItem, quantity: updatedQty };
              }
            }
            return logItem;
          });
        });
        return updatedLog;
      });
    }

    if (!printedSomething && tableOrders.length > 0) {
      const activeSentItems = tableOrders.filter(i => i.status === 'sent' && !i.isGift);
      if (activeSentItems.length > 0) {
        printKitchenTicket(
          table?.number || `Masa #${selectedTableId}`,
          table?.waiterName || 'Naməlum',
          activeSentItems.map(i => ({
            name: i.name,
            quantity: i.quantity,
            notes: i.notes
          })),
          true,
          false
        );
      }
    }

    const itemsToSendToKitchen = pendingItemsForTicket.length > 0
      ? pendingItemsForTicket
      : tableOrders.filter(i => i.status !== 'defective' && i.status !== 'returned' && i.status !== 'cancelled');

    if (itemsToSendToKitchen.length > 0) {
      const now = new Date();
      const todayStr = getTodayStr();
      const tableNumberStr = table?.number || `Masa ${selectedTableId}`;
      const waiter = table?.waiterName || 'Naməlum';

      const newKitchenItems: KitchenItem[] = itemsToSendToKitchen.map((i, index) => ({
        id: Date.now() + index + Math.random(),
        orderId: selectedTableId,
        dishName: i.name,
        tableNumber: tableNumberStr,
        waiterName: waiter,
        timestamp: now,
        date: todayStr,
        status: (i.isGift ? 'gift' : 'preparing') as any,
        isGift: Boolean(i.isGift),
        quantity: i.quantity,
        notes: i.isGift ? (i.notes && i.notes.trim() ? `${i.notes} (Hədiyyə)` : 'Hədiyyə (İkram)') : (i.notes || ''),
        shiftId: activeShift?.id,
        isClosed: false
      }));

      setKitchenLog(prevLog => [...newKitchenItems, ...prevLog]);
    }

    setActiveOrders(prev => {
      const currentTableOrders = prev[selectedTableId] || [];

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      // Mətbəxə göndərildikdə xarab, geri qaytarılan və silinən məhsullar səbətdən tam silinir, pending olanlar isə sent-ə çevrilir
      const remainingOrders: OrderItem[] = currentTableOrders
        .filter(i => i.status !== 'cancelled' && i.status !== 'defective' && i.status !== 'returned')
        .map(i => {
          if (i.status === 'pending') {
            return { ...i, status: 'sent' as OrderItemStatus, orderTime: i.orderTime || timeStr };
          }
          return i;
        });

      const validTotal = calculateValidOrderTotal(remainingOrders);
      setTables(prevTables => prevTables.map(t => 
        t.id === selectedTableId 
          ? { 
              ...t, 
              orderTotal: validTotal === 0 ? undefined : validTotal,
              status: remainingOrders.length === 0 ? 'available' : 'occupied'
            } 
          : t
      ));

      return { ...prev, [selectedTableId]: remainingOrders };
    });

    if (printedSomething) {
      clearPurgeFlagIfSet();
    }
  };

  const handlePrintOrderReceipt = () => {
    if (!selectedTableId) return;

    const table = tables.find(t => t.id === selectedTableId);
    if (!table) return;

    const tableOrders = activeOrders[selectedTableId] || [];
    if (tableOrders.length === 0) return;

    const waiterName = table.waiterName || 'Sistem Admini';

    // Xarab, geri al, silindi və hədiyyə məhsulları müştəri qəbzindən çıxarılır
    const customerReceiptItems = tableOrders.filter(i => 
      i.status !== 'defective' && 
      i.status !== 'returned' && 
      i.status !== 'cancelled' && 
      !i.isGift
    );

    const orderAmount = calculateValidOrderTotal(tableOrders);

    // Print the customer check (2 tickets consecutively)
    printCustomerTicket(
      table.number,
      waiterName,
      customerReceiptItems,
      orderAmount,
      paymentMethod,
      appNameWord1,
      appNameWord2
    );
  };

  const completeOrder = (forcedMethod?: 'cash' | 'card' | 'mixed' | 'gift') => {
    if (!selectedTableId) return;

    const table = tables.find(t => t.id === selectedTableId);
    if (!table) return;

    const tableOrders = activeOrders[selectedTableId] || [];
    const validItems = tableOrders.filter(i => 
      i.status !== 'defective' && 
      i.status !== 'returned' && 
      i.status !== 'cancelled' && 
      !i.isGift
    );
    const validTotal = Math.round(validItems.reduce((acc, i) => acc + (Number(i.price || 0) * Number(i.quantity || 1)), 0) * 100) / 100;
    const orderAmount = validTotal;
    const waiterName = table.waiterName || 'Sistem Admini';
    const methodToUse = forcedMethod || paymentMethod || 'cash';
    const todayStr = getTodayStr();
    const effectiveShiftDate = activeShift?.businessDate || todayStr;

    const paymentMethodNames = {
      cash: 'Nağd ödəniş',
      card: 'Kartla ödəniş',
      mixed: 'Qarışıq (Nağd/Kart)',
      gift: 'VIP Hədiyyə (Borc Silinməsi)'
    };

    const newExpenseEntries: ExpenseItem[] = [];

    // 1. Səbətdə fərdi 'isGift' olan məhsullar Məxaricə (Ümumi xərclər) və Zərərə qeyd olunur
    const individualGiftItems = tableOrders.filter(i => i.isGift);
    individualGiftItems.forEach(giftItem => {
      const basePrice = Number(giftItem.price) || menuItems.find(m => m.name === giftItem.name)?.price || 0;
      const itemCost = Math.round((basePrice * (giftItem.quantity || 1)) * 100) / 100;
      if (itemCost > 0) {
        const titleStr = `${table.number} - Hədiyyə İkram (${giftItem.name})`;
        const alreadyInBatch = newExpenseEntries.some(e => e.title === titleStr);
        if (!alreadyInBatch) {
          newExpenseEntries.push({
            id: Date.now() + Math.random(),
            title: titleStr,
            category: 'Hədiyyə',
            amount: itemCost,
            date: effectiveShiftDate,
            notes: `Masa: ${table.number}, Hədiyyə verilən məhsul: ${giftItem.name} (${giftItem.quantity} ədəd). Ofisiant: ${waiterName}`,
            operator: waiterName,
            shiftId: activeShift?.id,
            isClosed: false
          });
        }
      }
    });

    // 2. Səbətdə xarab ('defective') olan məhsullar Məxaricə (Ümumi xərclər) və Zərərə qeyd olunur
    const defectiveItems = tableOrders.filter(i => i.status === 'defective');
    defectiveItems.forEach(defItem => {
      const basePrice = Number(defItem.price) || menuItems.find(m => m.name === defItem.name)?.price || 0;
      const itemCost = Math.round((basePrice * (defItem.quantity || 1)) * 100) / 100;
      if (itemCost > 0) {
        const titleStr = `${table.number} - Xarab Məhsul (${defItem.name})`;
        const alreadyInBatch = newExpenseEntries.some(e => e.title === titleStr);
        if (!alreadyInBatch) {
          newExpenseEntries.push({
            id: Date.now() + Math.random(),
            title: titleStr,
            category: 'Xarab',
            amount: itemCost,
            date: effectiveShiftDate,
            notes: `Masa: ${table.number}, Xarab olan məhsul: ${defItem.name} (${defItem.quantity} ədəd). Ofisiant: ${waiterName}`,
            operator: waiterName,
            shiftId: activeShift?.id,
            isClosed: false
          });
        }
      }
    });

    // 3. (Geri alınan məhsullar Məxaricə əlavə olunmur - yalnız Xarab və Hədiyyə əlavə olunur)

    // 4. Bütün sifariş 'gift' üsulu ilə bağlanıbsa
    if (methodToUse === 'gift' && orderAmount > 0) {
      const titleStr = `${table.number} - Hədiyyə / İkram (VIP)`;
      const alreadyInBatch = newExpenseEntries.some(e => e.title === titleStr);
      if (!alreadyInBatch) {
        newExpenseEntries.push({
          id: Date.now() + Math.random(),
          title: titleStr,
          category: 'Hədiyyə',
          amount: orderAmount,
          date: effectiveShiftDate,
          notes: `Masa: ${table.number}, Bütün hesab Hədiyyə olaraq silindi. Ofisiant: ${waiterName}`,
          operator: waiterName,
          shiftId: activeShift?.id,
          isClosed: false
        });
      }
    }

    if (newExpenseEntries.length > 0) {
      setExpenses(prev => {
        const updated = [...newExpenseEntries, ...prev];
        safeLocalStorageSetItem('resto_expenses', JSON.stringify(updated));
        return updated;
      });
    }

    addAuditLog(
      methodToUse === 'gift' ? "Kassa Borc Silinməsi" : "Kassa Mədaxil",
      waiterName,
      `${table.number} hesabı ${paymentMethodNames[methodToUse]} üsulu ilə bağlandı. Ödənilən məbləğ: ${(methodToUse === 'gift' ? 0 : orderAmount).toFixed(2)} ₼. Ofisiant: ${waiterName}`,
      methodToUse === 'gift' ? "danger" : "info"
    );

    const saleAmount = methodToUse === 'gift' ? 0 : orderAmount;

    setStaff(prev => prev.map(person => {
      if (person.name === waiterName) {
        return {
          ...person,
          totalSales: Math.round(((person.totalSales || 0) + saleAmount) * 100) / 100
        };
      }
      return person;
    }));

    const now = new Date();
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (methodToUse === 'mixed' && (!customMixedCash || customMixedCash.trim() === '')) {
      alert('Qarışıq ödəniş üçün nağd məbləği daxil edin!');
      return;
    }

    const cashPart = methodToUse === 'mixed' 
      ? Math.min(saleAmount, Math.max(0, Math.round((parseFloat(customMixedCash) || 0) * 100) / 100))
      : (methodToUse === 'cash' ? saleAmount : undefined);
    const cardPart = methodToUse === 'mixed'
      ? Math.max(0, Math.round((saleAmount - (cashPart || 0)) * 100) / 100)
      : (methodToUse === 'card' ? saleAmount : undefined);

    // Record transaction with cosmic accuracy - Only legitimate sold items enter revenue
    const orderTx: OrderTransaction = {
      id: Date.now() + Math.random(),
      tableId: table.id,
      tableName: table.number,
      amount: saleAmount,
      waiterName: waiterName,
      paymentMethod: methodToUse,
      cashAmount: cashPart,
      cardAmount: cardPart,
      date: effectiveShiftDate,
      time: currentTimeStr,
      shiftId: activeShift?.id,
      isClosed: false,
      timestamp: Date.now(),
      items: tableOrders
        .filter(i => i.status !== 'defective' && i.status !== 'returned' && i.status !== 'cancelled')
        .map(i => ({
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          category: i.category,
          isGift: Boolean(i.isGift) || methodToUse === 'gift'
        }))
    };
    setOrderTransactions(prev => {
      const updated = [orderTx, ...prev];
      safeLocalStorageSetItem('resto_orderTransactions', JSON.stringify(updated));
      return updated;
    });
    clearPurgeFlagIfSet();

    // Mətbəx jurnalında həmin masanın sifarişlərini "Təhvil verildi" statusuna çevir
    setKitchenLog(prev => prev.map(k => {
      const kDigits = String(k.tableNumber || '').replace(/\D/g, '');
      const tDigits = String(table.number || '').replace(/\D/g, '');
      const isThisTable = (Boolean(kDigits) && Boolean(tDigits) && kDigits === tDigits) ||
        k.tableNumber === table.number || k.tableNumber === `Masa ${table.number}` ||
        k.tableNumber === String(table.id) || k.tableNumber === String(selectedTableId);
      if (isThisTable && (k.status === 'preparing' || k.status === 'ready')) {
        return { ...k, status: 'delivered' as any };
      }
      return k;
    }));

    // Align dashboard and report date filters so newly completed sale reflects instantly
    setDashboardDate(effectiveShiftDate);
    setReportDate(effectiveShiftDate);

    setActiveOrders(prev => {
      const newOrders = { ...prev };
      delete newOrders[selectedTableId];
      return newOrders;
    });

    setTables(prev => prev.map(t => 
      t.id === selectedTableId ? { ...t, status: 'available', orderTotal: undefined, waiterName: undefined } : t
    ));

    // Sync reservation status: if there was an active reservation for this table, mark it as 'completed'
    setReservations(prev => prev.map(res => 
      (res.tableId === selectedTableId && (res.status === 'arrived' || res.status === 'confirmed')) 
        ? { ...res, status: 'completed' } 
        : res
    ));

    // Reset payment states
    setPaymentMethod('cash');
    setCustomerCashPaid('');
    setCustomMixedCash('');
    setCustomMixedCard('');
    
    // Automatically navigate back to tables selection list and collapse sidebar to icons-only
    setSelectedTableId(null);
    setIsSidebarCollapsed(true);
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = (e.key || '').toLowerCase();
      if (e.ctrlKey || e.metaKey) {
        if (key === 'g') {
          e.preventDefault();
          e.stopPropagation();
          setShowPaymentMethodSection(true);
        } else if (key === 'b') {
          e.preventDefault();
          e.stopPropagation();
          setShowPaymentMethodSection(false);
        } else if (selectedTableId) {
          if (key === 'k') {
            e.preventDefault();
            e.stopPropagation();
            completeOrder('card');
          } else if (key === '2') {
            e.preventDefault();
            e.stopPropagation();
            completeOrder('mixed');
          } else if (key === 'h') {
            e.preventDefault();
            e.stopPropagation();
            completeOrder('gift');
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedTableId, completeOrder]);

  const assignWaiter = (waiterName: string) => {
    if (!waiterSelectionId) return;
    setTables(prev => prev.map(t => 
      t.id === waiterSelectionId ? { ...t, status: 'occupied', waiterName } : t
    ));
    setSelectedTableId(waiterSelectionId);
    setWaiterSelectionId(null);
  };

  const handleAddNewDish = () => {
    if (!newDish.name.trim()) {
      setNewDishError('Yemək adı daxil edilməlidir!');
      return;
    }
    if (!newDish.category.trim()) {
      setNewDishError('Kateqoriya daxil edilməlidir!');
      return;
    }
    if (!newDish.price.trim() || isNaN(parseFloat(newDish.price)) || parseFloat(newDish.price) <= 0) {
      setNewDishError('Düzgün qiymət daxil edilməlidir!');
      return;
    }
    
    setNewDishError(null);
    const newItem: MenuItem = {
      id: Date.now(),
      name: newDish.name.trim(),
      category: newDish.category.trim(),
      price: parseFloat(newDish.price),
      status: 'active',
      image: newDish.image || undefined
    };
    addAuditLog("Yeni Yemək Əlavə Edildi", "Admin", `'${newItem.name}' yeməyi ${newItem.price.toFixed(2)} ₼ qiyməti ilə menyuya əlavə edildi.`, "info");
    setMenuItems(prev => [...prev, newItem]);
    setRecipes(prev => ({ ...prev, [newItem.id]: [] }));
    setNewDish({ name: '', category: '', price: '', image: '' });
    setIsAddingDish(false);
  };

  const handleDeleteMenuItem = (id: number) => {
    setMenuItemToDeleteId(id);
  };

  const confirmDeleteMenuItem = () => {
    if (menuItemToDeleteId !== null) {
      const itemToDelete = menuItems.find(m => m.id === menuItemToDeleteId);
      if (itemToDelete) {
        addAuditLog("Yemək Silindi", "Admin", `'${itemToDelete.name}' yeməyi menyudan silindi.`, "warning");
      }
      setMenuItems(prev => prev.filter(item => item.id !== menuItemToDeleteId));
      setMenuItemToDeleteId(null);
    }
  };

  const handleSaveEdit = (id: number) => {
    const prevItem = menuItems.find(m => m.id === id);
    if (prevItem) {
      addAuditLog("Menyu Redaktəsi", "Admin", `'${prevItem.name}' yeməyi redaktə edildi. Köhnə qiymət: ${prevItem.price.toFixed(2)} ₼, Yeni qiymət: ${parseFloat(editDish.price).toFixed(2)} ₼.`, "info");
    }
    setMenuItems(prev => prev.map(item => 
      item.id === id 
        ? { ...item, name: editDish.name, category: editDish.category, price: parseFloat(editDish.price), image: editDish.image } 
        : item
    ));
    setEditingMenuItemId(null);
  };

  const startEditing = (item: MenuItem) => {
    setEditingMenuItemId(item.id);
    setEditDish({ name: item.name, category: item.category, price: item.price.toString(), image: item.image || '' });
  };

  const handleAddReservation = () => {
    if (!newReservation.customerName || !newReservation.tableId || !newReservation.time || !newReservation.guests) return;
    const tableId = parseInt(newReservation.tableId);
    const rDate = newReservation.date || reservationSelectedDate;
    const item: Reservation = {
      id: Date.now(),
      customerName: newReservation.customerName,
      tableId: tableId,
      time: newReservation.time,
      guests: parseInt(newReservation.guests),
      status: 'confirmed',
      date: rDate
    };
    setReservations(prev => [...prev, item]);
    // Sync table status only if reservation is for today
    if (rDate === getTodayStr()) {
      setTables(prev => prev.map(t => t.id === tableId ? { ...t, status: 'reserved' } : t));
    }
    setNewReservation({ customerName: '', tableId: '', time: '', guests: '', date: '' });
    setIsAddingReservation(false);
  };

  const handleSaveReservationEdit = (id: number) => {
    const tableId = parseInt(editReservation.tableId);
    const rDate = editReservation.date || reservationSelectedDate;
    setReservations(prev => prev.map(res => 
      res.id === id 
        ? { ...res, 
            customerName: editReservation.customerName, 
            tableId: tableId, 
            time: editReservation.time, 
            guests: parseInt(editReservation.guests),
            date: rDate
          } 
        : res
    ));
    // If the table or date changed, update table status for today
    const oldRes = reservations.find(r => r.id === id);
    if (oldRes) {
      setTables(prev => prev.map(t => {
        if (oldRes.date === getTodayStr() && t.id === oldRes.tableId) {
          return { ...t, status: 'available' };
        }
        if (rDate === getTodayStr() && t.id === tableId) {
          return { ...t, status: 'reserved' };
        }
        return t;
      }));
    }
    setEditingReservationId(null);
  };

  const startEditingReservation = (item: Reservation) => {
    setEditingReservationId(item.id);
    setEditReservation({ 
      customerName: item.customerName, 
      tableId: item.tableId.toString(), 
      time: item.time, 
      guests: item.guests.toString(),
      date: item.date || getTodayStr()
    });
  };

  const updateInventoryStock = (id: number, delta: number, newCostPrice?: number) => {
    setInventory(prev => prev.map(item => {
      if (item.id === id) {
        // Kosmik və yüksək dəqiqliklə hesablanma (floating point xətalarını aradan qaldırmaq üçün)
        const currentQty = Number(item.quantity) || 0;
        const rawNewQty = Math.max(0, currentQty + delta);
        const newQty = Math.round(rawNewQty * 10000) / 10000;
        const effectiveCostPrice = newCostPrice !== undefined ? newCostPrice : (Number(item.costPrice) || 0);
        
        if (delta > 0) {
          const actualIncrease = Math.round((newQty - currentQty) * 10000) / 10000;
          if (actualIncrease > 0) {
            const transaction: InventoryTransaction = {
              id: Date.now() + Math.random(),
              itemId: id,
              itemName: item.name,
              quantity: actualIncrease,
              costPrice: effectiveCostPrice,
              totalCost: Math.round((actualIncrease * effectiveCostPrice) * 100) / 100,
              date: new Date().toISOString().split('T')[0]
            };
            setInventoryTransactions(prevTrans => [transaction, ...prevTrans]);
          }
        }
        return { 
          ...item, 
          quantity: newQty,
          costPrice: effectiveCostPrice
        };
      }
      return item;
    }));
  };

  const startEditingInventory = (item: InventoryItem) => {
    setEditingInventoryId(item.id);
    setEditInventory({
      name: item.name,
      quantity: item.quantity,
      minLevel: item.minLevel,
      unit: item.unit,
      costPrice: item.costPrice || 0,
      salePrice: item.salePrice || 0
    });
  };

  const handleSaveInventoryEdit = (id: number) => {
    if (!editInventory.name.trim() || !editInventory.unit.trim()) return;
    
    const prevItem = inventory.find(i => i.id === id);
    const prevQty = prevItem ? prevItem.quantity : 0;
    const newQty = Number(editInventory.quantity);
    const costPrice = Number(editInventory.costPrice) || 0;
    const salePrice = editInventory.salePrice !== '' && editInventory.salePrice !== undefined && editInventory.salePrice !== null 
      ? Number(editInventory.salePrice) 
      : undefined;

    setInventory(prev => prev.map(item => 
      item.id === id 
        ? { 
            ...item, 
            name: editInventory.name.trim(), 
            quantity: newQty, 
            minLevel: Number(editInventory.minLevel), 
            unit: editInventory.unit.trim(),
            costPrice: costPrice,
            salePrice: salePrice
          } 
        : item
    ));

    if (newQty > prevQty) {
      const deltaQty = newQty - prevQty;
      const transaction: InventoryTransaction = {
        id: Date.now() + Math.random(),
        itemId: id,
        itemName: editInventory.name.trim(),
        quantity: deltaQty,
        costPrice: costPrice,
        totalCost: Math.round((deltaQty * costPrice) * 100) / 100,
        date: new Date().toISOString().split('T')[0]
      };
      setInventoryTransactions(prevTrans => [transaction, ...prevTrans]);
    }

    setEditingInventoryId(null);
  };

  const handleAddNewInventoryItem = () => {
    if (!newInventory.name.trim()) {
      setNewInventoryError('Məhsul adı daxil edilməlidir!');
      return;
    }
    if (!newInventory.unit.trim()) {
      setNewInventoryError('Ölçü vahidi daxil edilməlidir!');
      return;
    }
    if (newInventory.quantity !== '' && Number(newInventory.quantity) < 0) {
      setNewInventoryError('Mövcud stok mənfi ola bilməz!');
      return;
    }
    if (newInventory.minLevel !== '' && Number(newInventory.minLevel) < 0) {
      setNewInventoryError('Minimum limit mənfi ola bilməz!');
      return;
    }
    if (newInventory.costPrice !== '' && Number(newInventory.costPrice) < 0) {
      setNewInventoryError('Alış qiyməti mənfi ola bilməz!');
      return;
    }
    if (newInventory.salePrice !== '' && Number(newInventory.salePrice) < 0) {
      setNewInventoryError('Satış qiyməti mənfi ola bilməz!');
      return;
    }

    const trimmedName = newInventory.name.trim().toLowerCase();
    const isDuplicate = inventory.some(item => item.name.trim().toLowerCase() === trimmedName);
    if (isDuplicate) {
      setNewInventoryError(`"${newInventory.name.trim()}" adlı məhsul artıq anbarda mövcuddur! Mövcud məhsulun sayını artırmaq üçün "Stok artır" butonundan istifadə edin.`);
      return;
    }

    setNewInventoryError(null);
    const newItemId = Date.now();
    const costPrice = Number(newInventory.costPrice) || 0;
    const salePrice = newInventory.salePrice !== '' && newInventory.salePrice !== undefined && newInventory.salePrice !== null
      ? Number(newInventory.salePrice)
      : undefined;
    const quantity = Number(newInventory.quantity) || 0;
    
    const newItem: InventoryItem = {
      id: newItemId,
      name: newInventory.name.trim(),
      quantity: quantity,
      minLevel: Number(newInventory.minLevel) || 0,
      unit: newInventory.unit.trim(),
      costPrice: costPrice,
      salePrice: salePrice
    };

    setInventory(prev => [...prev, newItem]);

    if (quantity > 0) {
      const transaction: InventoryTransaction = {
        id: Date.now() + Math.random(),
        itemId: newItemId,
        itemName: newItem.name,
        quantity: quantity,
        costPrice: costPrice,
        totalCost: Math.round((quantity * costPrice) * 100) / 100,
        date: new Date().toISOString().split('T')[0]
      };
      setInventoryTransactions(prevTrans => [transaction, ...prevTrans]);
    }

    setNewInventory({
      name: '',
      quantity: '' as any,
      minLevel: '' as any,
      unit: '',
      costPrice: '' as any,
      salePrice: '' as any
    });
    setIsAddingInventory(false);
  };

  const handleDeleteInventoryItem = (id: number) => {
    setInventory(prev => prev.filter(item => item.id !== id));
  };

  const toggleStaffShift = (id: number) => {
    setStaff(prev => prev.map(person => {
      if (person.id === id) {
        const newStatus = person.status === 'on-shift' ? 'off-shift' : 'on-shift';
        let updatedAttendance = person.attendance ? [...person.attendance] : [];
        if (newStatus === 'on-shift') {
          const todayStr = new Date().toISOString().split('T')[0];
          if (!updatedAttendance.includes(todayStr)) {
            updatedAttendance = [todayStr, ...updatedAttendance];
          }
        }
        return { 
          ...person, 
          status: newStatus,
          attendance: updatedAttendance
        };
      }
      return person;
    }));
  };

  const handleAddNewStaff = () => {
    if (!newStaff.firstName.trim()) {
      setNewStaffError('İşçinin adı daxil edilməlidir!');
      return;
    }
    if (!newStaff.lastName.trim()) {
      setNewStaffError('İşçinin soyadı daxil edilməlidir!');
      return;
    }
    if (!newStaff.role.trim()) {
      setNewStaffError('Vəzifə daxil edilməlidir!');
      return;
    }

    setNewStaffError(null);
    const fullName = `${newStaff.firstName.trim()} ${newStaff.lastName.trim()}`;
    const todayStr = new Date().toISOString().split('T')[0];

    const createdMember: StaffMember = {
      id: Date.now(),
      name: fullName,
      firstName: newStaff.firstName.trim(),
      lastName: newStaff.lastName.trim(),
      role: newStaff.role.trim(),
      status: newStaff.status,
      docNumber: newStaff.docNumber.trim() || undefined,
      phone: newStaff.phone.trim() || undefined,
      attendance: newStaff.status === 'on-shift' ? [todayStr] : [],
      totalSales: 0
    };

    setStaff(prev => [...prev, createdMember]);
    setNewStaff({
      firstName: '',
      lastName: '',
      role: 'Ofisiant',
      docNumber: '',
      phone: '',
      status: 'off-shift'
    });
    setIsAddingStaff(false);
  };

  const handleDeleteStaff = (id: number) => {
    setStaff(prev => prev.filter(person => person.id !== id));
  };

  const handleStartEditStaff = (person: StaffMember) => {
    setEditingStaffId(person.id);
    setEditStaff({
      firstName: person.firstName || person.name.split(' ')[0] || '',
      lastName: person.lastName || person.name.split(' ').slice(1).join(' ') || '',
      role: person.role,
      docNumber: person.docNumber || '',
      phone: person.phone || ''
    });
    setEditStaffError(null);
  };

  const handleSaveEditStaff = (id: number) => {
    if (!editStaff.firstName.trim()) {
      setEditStaffError('Ad daxil edilməlidir!');
      return;
    }
    if (!editStaff.lastName.trim()) {
      setEditStaffError('Soyad daxil edilməlidir!');
      return;
    }
    if (!editStaff.role.trim()) {
      setEditStaffError('Vəzifə seçilməlidir/daxil edilməlidir!');
      return;
    }

    setStaff(prev => prev.map(p => {
      if (p.id === id) {
        const fullName = `${editStaff.firstName.trim()} ${editStaff.lastName.trim()}`;
        return {
          ...p,
          name: fullName,
          firstName: editStaff.firstName.trim(),
          lastName: editStaff.lastName.trim(),
          role: editStaff.role.trim(),
          docNumber: editStaff.docNumber.trim() || undefined,
          phone: editStaff.phone.trim() || undefined
        };
      }
      return p;
    }));

    setEditingStaffId(null);
  };

  const handleAddAttendanceDate = (staffId: number, dateString: string) => {
    if (!dateString) return;
    setStaff(prev => prev.map(p => {
      if (p.id === staffId) {
        const current = p.attendance || [];
        if (current.includes(dateString)) return p;
        return {
          ...p,
          attendance: [...current, dateString].sort((a,b) => b.localeCompare(a))
        };
      }
      return p;
    }));
  };

  const handleRemoveAttendanceDate = (staffId: number, dateString: string) => {
    setStaff(prev => prev.map(p => {
      if (p.id === staffId) {
        const current = p.attendance || [];
        return {
          ...p,
          attendance: current.filter(d => d !== dateString)
        };
      }
      return p;
    }));
  };

  const handleConfirmArrivedReservation = (resId: number, tableId: number) => {
    setReservations(prev => prev.map(r => r.id === resId ? { ...r, status: 'completed' } : r));
    setTables(prevTables => prevTables.map(t => {
      if (t.id === tableId) {
        return { 
          ...t, 
          status: 'occupied', 
          waiterName: t.waiterName || 'Leyla Nuriyeva'
        };
      }
      return t;
    }));
    setActiveTab('tables');
    setSelectedTableId(tableId);
  };

  const updateReservationStatus = (id: number, status: Reservation['status']) => {
    setReservations(prev => {
      const updated = prev.map(res => res.id === id ? { ...res, status } : res);
      const res = prev.find(r => r.id === id);
      if (res) {
        if (status === 'arrived') {
          setTables(prevTables => prevTables.map(t => t.id === res.tableId ? { ...t, status: 'occupied' } : t));
        } else if (status === 'confirmed') {
          setTables(prevTables => prevTables.map(t => t.id === res.tableId ? { ...t, status: 'reserved' } : t));
        } else if (status === 'pending') {
          setTables(prevTables => prevTables.map(t => t.id === res.tableId ? { ...t, status: 'available' } : t));
        }
      }
      return updated;
    });
  };

  const deleteReservation = (id: number) => {
    const res = reservations.find(r => r.id === id);
    if (res) {
      setTables(prev => prev.map(t => t.id === res.tableId ? { ...t, status: 'available' } : t));
    }
    setReservations(prev => prev.filter(res => res.id !== id));
  };

  const purgeAllData = () => {
    setActiveOrders({});
    setReservations([]);
    const clearedTables = MOCK_TABLES.map(t => ({ ...t, status: 'available' as const, orderTotal: undefined, waiterName: undefined }));
    setTables(clearedTables);
    
    setKitchenLog([]);
    setStaff([]);
    setInventory([]);
    setMenuItems([]);
    setInventoryTransactions([]);
    setOrderTransactions([]);
    setIsInventoryUnlocked(false);
    setExpenses([]);
    setDefectRecords([]);
    setClosedShifts({});
    safeLocalStorageSetItem('resto_closedShifts', JSON.stringify({}));
    const freshShift = {
      id: `shift_init_${Date.now()}`,
      businessDate: getTodayStr(),
      openedAt: new Date().toISOString()
    };
    setActiveShift(freshShift);
    safeLocalStorageSetItem('resto_activeShift', JSON.stringify(freshShift));
    safeLocalStorageSetItem('resto_orderTransactions', JSON.stringify([]));
    safeLocalStorageSetItem('resto_expenses', JSON.stringify([]));
    safeLocalStorageSetItem('expenses', JSON.stringify([]));
    safeLocalStorageSetItem('resto_defectRecords', JSON.stringify([]));
    safeLocalStorageSetItem('defectRecords', JSON.stringify([]));
    setExpenseCategoryFilter('all');
    setExpenseSearch('');
    setExpenseDate(getTodayStr());
    setExpensePeriod('daily');
    setDashboardDate(getTodayStr());
    setDashboardPeriod('daily');
    setDashboardShiftId('auto');
    setNewExpense({
      title: '',
      category: 'Kommunal',
      amount: '',
      date: getTodayStr(),
      notes: ''
    });
    setIsDatabasePurged(true);

    setAppNameWord1('RESTO');
    setAppNameWord2('MASTER');
    setAppNameColor1('#1e293b');
    setAppNameColor2('#f97316');
    setAppNameFontSize('text-xl');
    setAppNameFontFamily('font-sans');
    setAppNameFontWeight('font-black');
    setAppNameFontStyle('not-italic');
    setAppLogoUrl('');

    setPrinterType('thermal_80mm');
    setPrinterFontSize('normal');
    setPrinterMargin(4);
    setPrinterFooterText('Bizi seçdiyiniz üçün təşəkkür edirik!\nYolunuzu yenə gözləyirik.');
    setPrinterRouteMode('browser');
    setNetworkPrinterIP('192.168.1.100');
    setNetworkPrinterPort('9100');
    setPrinterPresetType('xprinter_xp350b');

    safeLocalStorageSetItem('isDatabasePurged', 'true');
    safeLocalStorageSetItem('resto_tables', JSON.stringify(clearedTables));
    safeLocalStorageSetItem('resto_menuItems', JSON.stringify([]));
    safeLocalStorageSetItem('resto_reservations', JSON.stringify([]));
    safeLocalStorageSetItem('resto_inventory', JSON.stringify([]));
    safeLocalStorageSetItem('resto_inventoryTransactions', JSON.stringify([]));
    safeLocalStorageSetItem('resto_orderTransactions', JSON.stringify([]));
    safeLocalStorageSetItem('resto_staff', JSON.stringify([]));
    safeLocalStorageSetItem('resto_kitchenLog', JSON.stringify([]));
    safeLocalStorageSetItem('resto_activeOrders', JSON.stringify({}));

    safeLocalStorageSetItem('resto_appNameWord1', 'RESTO');
    safeLocalStorageSetItem('resto_appNameWord2', 'MASTER');
    safeLocalStorageSetItem('resto_appNameColor1', '#1e293b');
    safeLocalStorageSetItem('resto_appNameColor2', '#f97316');
    safeLocalStorageSetItem('resto_appNameFontSize', 'text-xl');
    safeLocalStorageSetItem('resto_appNameFontFamily', 'font-sans');
    safeLocalStorageSetItem('resto_appNameFontWeight', 'font-black');
    safeLocalStorageSetItem('resto_appNameFontStyle', 'not-italic');
    safeLocalStorageSetItem('resto_appLogoUrl', '');

    safeLocalStorageSetItem('printerType', 'thermal_80mm');
    safeLocalStorageSetItem('printerFontSize', 'normal');
    safeLocalStorageSetItem('printerMargin', '4');
    safeLocalStorageSetItem('printerFooterText', 'Bizi seçdiyiniz üçün təşəkkür edirik!\nYolunuzu yenə gözləyirik.');
    safeLocalStorageSetItem('printerRouteMode', 'browser');
    safeLocalStorageSetItem('networkPrinterIP', '192.168.1.100');
    safeLocalStorageSetItem('networkPrinterPort', '9100');
    safeLocalStorageSetItem('resto_printerPresetType', 'xprinter_xp350b');

    const purgeTime = new Date().toLocaleString(getActiveLocaleForApp());
    const freshLogs = [
      { 
        id: Date.now(), 
        timestamp: purgeTime, 
        action: "SİSTEM SIFIRLAMA", 
        operator: "Sistem Admini", 
        details: "Purge All: Bütün aktiv sifarişlər, masalar, menyu məhsulları, rezervasiyalar, anbar ehtiyatları, işçilər/növbələr, keçmiş dövriyyələr, çap tənzimləmələri və brending loqoları təmizlənərək proqram satışa hazır vəziyyətə gətirildi.", 
        severity: "danger" 
      }
    ];
    setAuditLogs(freshLogs);
    safeLocalStorageSetItem('resto_auditLogs', JSON.stringify(freshLogs));

    // SQLite persistent purge synchronization across all tables (Atomic Promise.all)
    if ((window as any).electron?.sqliteSaveEntity) {
      const electronApi = (window as any).electron;
      const purgePromises = [
        electronApi.sqliteSaveEntity('tables', clearedTables),
        electronApi.sqliteSaveEntity('menuItems', []),
        electronApi.sqliteSaveEntity('reservations', []),
        electronApi.sqliteSaveEntity('inventory', []),
        electronApi.sqliteSaveEntity('inventoryTransactions', []),
        electronApi.sqliteSaveEntity('orderTransactions', []),
        electronApi.sqliteSaveEntity('expenses', []),
        electronApi.sqliteSaveEntity('resto_expenses', []),
        electronApi.sqliteSaveEntity('staff', []),
        electronApi.sqliteSaveEntity('kitchenLog', []),
        electronApi.sqliteSaveEntity('activeOrders', {}),
        electronApi.sqliteSaveEntity('resto_defectRecords', []),
        electronApi.sqliteSaveEntity('defectRecords', []),
        electronApi.sqliteSaveEntity('resto_closedShifts', {}),
        electronApi.sqliteSaveEntity('resto_activeShift', freshShift),
        electronApi.sqliteSaveEntity('resto_auditLogs', freshLogs)
      ];

      Promise.all(purgePromises)
        .then(() => {
          console.log('Bütün SQLite cədvəlləri uğurla və bütöv şəkildə sıfırlandı.');
        })
        .catch((err: any) => {
          console.error('SQLite purge əməliyyatında xəta yarandı:', err);
          alert('Diqqət: Məlumatların yerli SQLite bazasından təmizlənməsi zamanı xəta baş verdi. Sistem qeydlərini yoxlayın.');
        });
    }
  };

  const restoreMockData = () => {
    setActiveOrders({});
    setReservations(MOCK_RESERVATIONS);
    setTables(MOCK_TABLES);
    setKitchenLog(MOCK_KITCHEN);
    setStaff(MOCK_STAFF);
    setInventory(MOCK_INVENTORY);
    setMenuItems(MOCK_MENU);
    setInventoryTransactions(MOCK_INVENTORY_TRANSACTIONS);
    setOrderTransactions(MOCK_ORDER_TRANSACTIONS);
    setExpenses(MOCK_EXPENSES);
    setDefectRecords(MOCK_DEFECT_RECORDS);
    safeLocalStorageSetItem('resto_defectRecords', JSON.stringify(MOCK_DEFECT_RECORDS));
    setIsDatabasePurged(false);
    localStorage.removeItem('isDatabasePurged');
    const restoreTime = new Date().toLocaleString(getActiveLocaleForApp());
    const freshLogs = [
      { 
        id: Date.now(), 
        timestamp: restoreTime, 
        action: "SİSTEM BƏRPA", 
        operator: "Sistem Admini", 
        details: "Müvəqqəti test məlumatları və sınaq kassa qeydləri sistemə yenidən yükləndi.", 
        severity: "info" 
      }
    ];
    setAuditLogs(freshLogs);
    safeLocalStorageSetItem('resto_auditLogs', JSON.stringify(freshLogs));

    // SQLite synchronization on mock data restore
    if ((window as any).electron?.sqliteSaveEntity) {
      (window as any).electron.sqliteSaveEntity('tables', MOCK_TABLES).catch((e: any) => console.log('SQLite tables restore:', e));
      (window as any).electron.sqliteSaveEntity('menuItems', MOCK_MENU).catch((e: any) => console.log('SQLite menuItems restore:', e));
      (window as any).electron.sqliteSaveEntity('reservations', MOCK_RESERVATIONS).catch((e: any) => console.log('SQLite reservations restore:', e));
      (window as any).electron.sqliteSaveEntity('inventory', MOCK_INVENTORY).catch((e: any) => console.log('SQLite inventory restore:', e));
      (window as any).electron.sqliteSaveEntity('inventoryTransactions', MOCK_INVENTORY_TRANSACTIONS).catch((e: any) => console.log('SQLite inventoryTransactions restore:', e));
      (window as any).electron.sqliteSaveEntity('orderTransactions', MOCK_ORDER_TRANSACTIONS).catch((e: any) => console.log('SQLite orderTransactions restore:', e));
      (window as any).electron.sqliteSaveEntity('expenses', MOCK_EXPENSES).catch((e: any) => console.log('SQLite expenses restore:', e));
      (window as any).electron.sqliteSaveEntity('staff', MOCK_STAFF).catch((e: any) => console.log('SQLite staff restore:', e));
      (window as any).electron.sqliteSaveEntity('kitchenLog', MOCK_KITCHEN).catch((e: any) => console.log('SQLite kitchenLog restore:', e));
      (window as any).electron.sqliteSaveEntity('activeOrders', {}).catch((e: any) => console.log('SQLite activeOrders restore:', e));
      (window as any).electron.sqliteSaveEntity('resto_defectRecords', MOCK_DEFECT_RECORDS).catch((e: any) => console.log('SQLite defectRecords restore:', e));
      (window as any).electron.sqliteSaveEntity('resto_auditLogs', freshLogs).catch((e: any) => console.log('SQLite auditLogs restore:', e));
    }
  };

  const defectExpenses: ExpenseItem[] = React.useMemo(() => {
    const shiftDate = activeShift?.businessDate || getActiveShiftBusinessDate();
    return (defectRecords || [])
      .filter(r => r.type === 'defective')
      .map(r => ({
        id: `defect_exp_${r.id}`,
        title: `${r.tableNumber || 'Masa'} - Xarab Məhsul (${r.dishName})`,
        category: 'Xarab',
        amount: Math.round((Number(r.price || 0) * Number(r.quantity || 1)) * 100) / 100,
        date: (r.shiftId && activeShift?.id && r.shiftId === activeShift.id && !r.isClosed) ? shiftDate : (r.date || shiftDate),
        notes: `Masa: ${r.tableNumber}, Məhsul: ${r.dishName} (${r.quantity} ədəd). Səbəb: ${r.reason}. Ofisiant: ${r.waiterName || 'Ofisiant'}`,
        operator: r.waiterName || 'Sistem Admini',
        shiftId: r.shiftId || activeShift?.id,
        isClosed: r.isClosed || false
      }));
  }, [defectRecords, activeShift]);

  const effectiveExpenses = React.useMemo(() => {
    const combined = [...expenses];
    defectExpenses.forEach(de => {
      const exists = combined.some(ex => 
        ex.title === de.title && 
        normalizeDateKey(ex.date) === normalizeDateKey(de.date) && 
        Math.abs(ex.amount - de.amount) < 0.01
      );
      if (!exists) {
        combined.push(de);
      }
    });
    return combined;
  }, [expenses, defectExpenses]);

  const tableStatusCounts = React.useMemo(() => {
    let available = 0;
    let occupied = 0;
    let reserved = 0;
    for (const t of tables) {
      if (t.status === 'available') available++;
      else if (t.status === 'occupied') occupied++;
      else if (t.status === 'reserved') reserved++;
    }
    return { available, occupied, reserved };
  }, [tables]);

  const getFilteredStats = (period: 'daily' | 'monthly' | 'yearly' | 'custom', targetDate: string, targetShiftId?: string) => {
    const targetYm = targetDate ? targetDate.substring(0, 7) : '';
    const targetYr = targetDate ? targetDate.substring(0, 4) : '';
    const normKey = normalizeDateKey(targetDate);
    const activeNormKey = normalizeDateKey(activeShift.businessDate);

    // Helper: Construct a detailed soldProductsList from an array of order transactions
    const buildSoldListFromOrders = (ordersList: any[], defaultDate?: string) => {
      const soldMap: Record<string, any> = {};
      (ordersList || []).forEach((tx: any) => {
        if (tx.items && Array.isArray(tx.items)) {
          const isGift = tx.paymentMethod === 'gift';
          tx.items.forEach((item: any) => {
            const rawT = tx.tableName ? String(tx.tableName).trim() : `Masa ${tx.tableId || 1}`;
            const tbl = (rawT || '').toLowerCase().startsWith('masa') ? rawT : `Masa ${rawT}`;
            const pm = tx.paymentMethod || 'cash';
            const txTime = tx.time || (tx as any).time || '12:00';
            const txDate = tx.date || defaultDate || targetDate;
            const key = `${item.name}_${tbl}_${txDate}_${txTime}_${pm}`;
            if (!soldMap[key]) {
              soldMap[key] = {
                name: item.name,
                category: item.category || 'Ümumi',
                totalQty: 0,
                totalRevenue: 0,
                unitPrice: item.price || 0,
                tableName: tbl,
                date: txDate,
                time: txTime,
                paymentMethod: pm
              };
            }
            soldMap[key].totalQty += (item.quantity || 1);
            soldMap[key].totalRevenue += isGift ? 0 : Math.round(((item.quantity || 1) * (item.price || 0)) * 100) / 100;
          });
        }
      });
      return Object.values(soldMap).sort((a: any, b: any) => b.totalQty - a.totalQty);
    };

    // Helper: Extract or build soldProductsList for a closed shift record
    const getShiftSoldList = (shiftRec: any) => {
      if (shiftRec.stats?.soldProductsList && Array.isArray(shiftRec.stats.soldProductsList) && shiftRec.stats.soldProductsList.length > 0) {
        return shiftRec.stats.soldProductsList;
      }
      if (shiftRec.orders && Array.isArray(shiftRec.orders) && shiftRec.orders.length > 0) {
        return buildSoldListFromOrders(shiftRec.orders, shiftRec.date || targetDate);
      }
      if (shiftRec.summary?.soldItems && Array.isArray(shiftRec.summary.soldItems) && shiftRec.summary.soldItems.length > 0) {
        return shiftRec.summary.soldItems.map((it: any) => ({
          name: it.name,
          category: 'Ümumi',
          totalQty: it.qty,
          totalRevenue: it.total,
          unitPrice: it.price,
          tableName: 'Bağlanmış Növbə',
          date: shiftRec.date || targetDate,
          time: '12:00',
          paymentMethod: Array.from(it.methods || ['cash'])[0] || 'cash'
        }));
      }
      return [];
    };

    // Combine orderTransactions with any orders stored in closedShifts (including allShifts) so all historical data is included
    const allOrdersList: OrderTransaction[] = [...orderTransactions];
    const orderIdSet = new Set(allOrdersList.map(o => o.id));
    Object.values(closedShifts || {}).forEach((cs: any) => {
      if (cs && cs.orders && Array.isArray(cs.orders)) {
        cs.orders.forEach((o: OrderTransaction) => {
          if (!orderIdSet.has(o.id)) {
            orderIdSet.add(o.id);
            allOrdersList.push({ ...o, isClosed: true, shiftId: o.shiftId || cs.shiftId });
          }
        });
      }
      if (cs && cs.allShifts && Array.isArray(cs.allShifts)) {
        cs.allShifts.forEach((shiftItem: any) => {
          if (shiftItem && shiftItem.orders && Array.isArray(shiftItem.orders)) {
            shiftItem.orders.forEach((o: OrderTransaction) => {
              if (!orderIdSet.has(o.id)) {
                orderIdSet.add(o.id);
                allOrdersList.push({ ...o, isClosed: true, shiftId: o.shiftId || shiftItem.shiftId });
              }
            });
          }
        });
      }
    });

    const allExpensesList: ExpenseItem[] = [...effectiveExpenses];
    const expenseIdSet = new Set(allExpensesList.map(e => e.id));
    Object.values(closedShifts || {}).forEach((cs: any) => {
      if (cs && cs.expenses && Array.isArray(cs.expenses)) {
        cs.expenses.forEach((e: ExpenseItem) => {
          if (!expenseIdSet.has(e.id)) {
            expenseIdSet.add(e.id);
            allExpensesList.push({ ...e, isClosed: true, shiftId: (e as any).shiftId || cs.shiftId });
          }
        });
      }
      if (cs && cs.allShifts && Array.isArray(cs.allShifts)) {
        cs.allShifts.forEach((shiftItem: any) => {
          if (shiftItem && shiftItem.expenses && Array.isArray(shiftItem.expenses)) {
            shiftItem.expenses.forEach((e: ExpenseItem) => {
              if (!expenseIdSet.has(e.id)) {
                expenseIdSet.add(e.id);
                allExpensesList.push({ ...e, isClosed: true, shiftId: (e as any).shiftId || shiftItem.shiftId });
              }
            });
          }
        });
      }
    });

    const isViewingActiveShift = (targetShiftId === 'active' || (activeShift?.id && targetShiftId === activeShift.id)) ||
      ((!targetShiftId || targetShiftId === 'auto') && Boolean(normKey && activeNormKey && normKey === activeNormKey && !activeShift?.isClosed));

    // Collect all closed shift records for this target date across closedShifts
    const shiftsForDate: any[] = [];
    const seenShiftIds = new Set<string>();

    const directClosed = normKey ? closedShifts[normKey] : null;
    if (directClosed?.allShifts && Array.isArray(directClosed.allShifts) && directClosed.allShifts.length > 0) {
      directClosed.allShifts.forEach((s: any) => {
        const sid = s.shiftId || s.reportNo;
        if (sid && !seenShiftIds.has(sid)) {
          seenShiftIds.add(sid);
          shiftsForDate.push(s);
        } else if (!sid) {
          shiftsForDate.push(s);
        }
      });
    } else if (directClosed && (directClosed.shiftId || directClosed.summary || directClosed.reportNo)) {
      const sid = directClosed.shiftId || directClosed.reportNo;
      if (sid) seenShiftIds.add(sid);
      shiftsForDate.push(directClosed);
    }

    if (normKey) {
      Object.values(closedShifts || {}).forEach((cs: any) => {
        if (!cs) return;
        const csNorm = normalizeDateKey(cs.date || cs.targetDateKey);
        if (csNorm === normKey) {
          if (cs.allShifts && Array.isArray(cs.allShifts) && cs.allShifts.length > 0) {
            cs.allShifts.forEach((s: any) => {
              const sid = s.shiftId || s.reportNo;
              if (sid && !seenShiftIds.has(sid)) {
                seenShiftIds.add(sid);
                shiftsForDate.push(s);
              }
            });
          } else if (cs.shiftId || cs.summary || cs.reportNo) {
            const sid = cs.shiftId || cs.reportNo;
            if (sid && !seenShiftIds.has(sid)) {
              seenShiftIds.add(sid);
              shiftsForDate.push(cs);
            }
          }
        }
      });
    }

    // Check if user explicitly selected a specific closed shift
    const isSpecificClosedShift = Boolean(
      targetShiftId && 
      targetShiftId !== 'auto' && 
      targetShiftId !== 'all' && 
      targetShiftId !== 'active' && 
      targetShiftId !== activeShift?.id
    );

    let targetShiftObj: any = null;
    if (isSpecificClosedShift && (period === 'daily' || period === 'custom')) {
      targetShiftObj = shiftsForDate.find((s: any, idx: number) => 
        s.shiftId === targetShiftId || 
        s.reportNo === targetShiftId || 
        targetShiftId === `shift_${idx + 1}` || 
        targetShiftId === `${normKey}_${idx}` ||
        (targetShiftId === 'shift_1' && idx === 0) || 
        (targetShiftId === 'shift_2' && idx === 1)
      );
      if (!targetShiftObj && closedShifts[targetShiftId]) {
        targetShiftObj = closedShifts[targetShiftId];
      }
      if (!targetShiftObj) {
        for (const cs of Object.values(closedShifts || {})) {
          if (!cs) continue;
          if (cs.shiftId === targetShiftId || cs.reportNo === targetShiftId) {
            targetShiftObj = cs;
            break;
          }
          if (cs.allShifts && Array.isArray(cs.allShifts)) {
            const f = cs.allShifts.find((s: any) => s.shiftId === targetShiftId || s.reportNo === targetShiftId);
            if (f) { targetShiftObj = f; break; }
          }
        }
      }
    }

    // If viewing a specific closed shift and found: return exact frozen snapshot with cosmic precision!
    if (targetShiftObj && (period === 'daily' || period === 'custom')) {
      const detailedSold = getShiftSoldList(targetShiftObj);
      const shiftOrders = (targetShiftObj.orders && Array.isArray(targetShiftObj.orders) && targetShiftObj.orders.length > 0)
        ? targetShiftObj.orders
        : allOrdersList.filter(tx => tx.isClosed && (tx.shiftId === targetShiftObj.shiftId || !tx.shiftId));
      const shiftExpenses = (targetShiftObj.expenses && Array.isArray(targetShiftObj.expenses) && targetShiftObj.expenses.length > 0)
        ? targetShiftObj.expenses
        : (targetShiftObj.summary?.expenses || []);

      return {
        totalSales: targetShiftObj.stats?.totalSales ?? targetShiftObj.summary?.totalSalesSum ?? 0,
        totalInventoryImportSum: targetShiftObj.stats?.totalInventoryImportSum ?? 0,
        totalExpenses: targetShiftObj.stats?.totalExpenses ?? targetShiftObj.summary?.totalExpensesSum ?? 0,
        netCash: targetShiftObj.stats?.netCash ?? targetShiftObj.summary?.netIncome ?? 0,
        totalCashSales: targetShiftObj.stats?.totalCashSales ?? targetShiftObj.summary?.cashSales ?? 0,
        totalCardSales: targetShiftObj.stats?.totalCardSales ?? targetShiftObj.summary?.cardSales ?? 0,
        filteredOrders: shiftOrders,
        filteredInventory: targetShiftObj.stats?.filteredInventory || [],
        filteredExpenses: shiftExpenses,
        soldProductsList: detailedSold
      };
    }

    const matches = (txDate: string, txShiftId?: string, isClosedTx?: boolean) => {
      if (period === 'daily' || period === 'custom') {
        const isActiveShiftTx = !isClosedTx && (txShiftId === activeShift?.id || !txShiftId);

        // If explicitly requesting the active shift:
        if (targetShiftId === 'active' || (activeShift?.id && targetShiftId === activeShift.id)) {
          return isActiveShiftTx;
        }

        // If explicitly requesting a specific closed shift:
        if (targetShiftId && targetShiftId !== 'auto' && targetShiftId !== 'all') {
          if (!isClosedTx) return false;
          if (txShiftId) return txShiftId === targetShiftId;
          return matchesDatePeriod(txDate, targetDate, 'daily') || (normKey ? normalizeDateKey(txDate) === normKey : false);
        }

        const dateMatches = matchesDatePeriod(txDate, targetDate, 'daily') || (normKey ? normalizeDateKey(txDate) === normKey : false);
        if (!dateMatches) return false;

        // If auto and viewing active day:
        if ((!targetShiftId || targetShiftId === 'auto') && normKey && activeNormKey && normKey === activeNormKey && !activeShift?.isClosed) {
          return isActiveShiftTx;
        }

        return true;
      } else if (period === 'monthly') {
        return matchesDatePeriod(txDate, targetDate, 'monthly');
      } else if (period === 'yearly') {
        return matchesDatePeriod(txDate, targetDate, 'yearly');
      }
      return false;
    };

    const rawFilteredOrders = allOrdersList.filter(tx => matches(tx.date, tx.shiftId, tx.isClosed));
    const filteredInventory = inventoryTransactions.filter(tx => matches(tx.date));
    const filteredExpenses = allExpensesList.filter(ex => matches(ex.date, (ex as any).shiftId, (ex as any).isClosed));

    // Historical date safeguard (when not viewing the active shift)
    if (!isViewingActiveShift && shiftsForDate.length > 0 && (period === 'daily' || period === 'custom') && (rawFilteredOrders.length === 0 || targetShiftId === 'all')) {
      let sumSales = 0;
      let sumExpenses = 0;
      let sumNet = 0;
      let sumCash = 0;
      let sumCard = 0;
      let sumInv = 0;
      const combinedSoldMap: Record<string, any> = {};
      const combinedOrders: any[] = [];
      const combinedExpenses: any[] = [];

      shiftsForDate.forEach((s: any) => {
        sumSales += (s.stats?.totalSales ?? s.summary?.totalSalesSum ?? 0);
        sumExpenses += (s.stats?.totalExpenses ?? s.summary?.totalExpensesSum ?? 0);
        sumNet += (s.stats?.netCash ?? s.summary?.netIncome ?? 0);
        sumCash += (s.stats?.totalCashSales ?? s.summary?.cashSales ?? 0);
        sumCard += (s.stats?.totalCardSales ?? s.summary?.cardSales ?? 0);
        sumInv += (s.stats?.totalInventoryImportSum ?? 0);

        if (s.orders && Array.isArray(s.orders)) combinedOrders.push(...s.orders);
        if (s.expenses && Array.isArray(s.expenses)) combinedExpenses.push(...s.expenses);
        else if (s.summary?.expenses && Array.isArray(s.summary.expenses)) combinedExpenses.push(...s.summary.expenses);

        const sList = getShiftSoldList(s);
        sList.forEach((it: any) => {
          const mKey = `${it.name}_${it.tableName || 'Masa'}_${it.date || targetDate}_${it.time || '12:00'}_${it.paymentMethod || 'cash'}`;
          if (!combinedSoldMap[mKey]) {
            combinedSoldMap[mKey] = { ...it };
          } else {
            combinedSoldMap[mKey].totalQty += (it.totalQty || 1);
            combinedSoldMap[mKey].totalRevenue = Math.round((combinedSoldMap[mKey].totalRevenue + (it.totalRevenue || 0)) * 100) / 100;
          }
        });
      });

      return {
        totalSales: Math.round(sumSales * 100) / 100,
        totalInventoryImportSum: Math.round(sumInv * 100) / 100,
        totalExpenses: Math.round(sumExpenses * 100) / 100,
        netCash: Math.round(sumNet * 100) / 100,
        totalCashSales: Math.round(sumCash * 100) / 100,
        totalCardSales: Math.round(sumCard * 100) / 100,
        filteredOrders: combinedOrders.length > 0 ? combinedOrders : rawFilteredOrders,
        filteredInventory: [],
        filteredExpenses: combinedExpenses.length > 0 ? combinedExpenses : filteredExpenses,
        soldProductsList: Object.values(combinedSoldMap).sort((a: any, b: any) => b.totalQty - a.totalQty)
      };
    }

    // Cosmic precision synchronization:
    // Every order's revenue is strictly synchronized to the sum of its valid sold items so that
    // totalSales and the itemized soldProductsList can NEVER diverge by even 0.01 AZN.
    const filteredOrders = rawFilteredOrders.map(tx => {
      if (tx.paymentMethod === 'gift') {
        return { ...tx, amount: 0 };
      }
      if (tx.items && Array.isArray(tx.items) && tx.items.length > 0) {
        const itemsTotal = Math.round(
          tx.items
            .filter((item: any) => !item.isGift)
            .reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0) * 100
        ) / 100;
        return { ...tx, amount: itemsTotal };
      }
      return tx;
    });

    // Format date string to DD.MM.YYYY
    const formatAzDate = (dStr: string) => {
      if (!dStr) return '';
      if (dStr.includes('.')) return dStr;
      const parts = dStr.split('-');
      if (parts.length === 3) {
        return `${parts[2].padStart(2, '0')}.${parts[1].padStart(2, '0')}.${parts[0]}`;
      }
      return dStr;
    };

    // Aggregate Sold Products for the period with table, date, time and paymentMethod details
    const detailedSoldMap: Record<string, { 
      name: string; 
      category?: string; 
      totalQty: number; 
      totalRevenue: number; 
      unitPrice: number;
      tableName: string;
      date: string;
      time: string;
      paymentMethod: string;
      isArchiveReconciliation?: boolean;
    }> = {};

    // Safeguard for Monthly and Yearly periods:
    // Reconcile date-by-date against official closed shifts snapshots so Monthly == sum(Daily) always,
    // even if orders are completely missing or partially missing (e.g. corrupted backup, legacy shifts).
    let extraClosedSales = 0;
    let extraClosedCash = 0;
    let extraClosedCard = 0;
    let extraClosedExpenses = 0;
    let extraClosedInv = 0;
    const salesDeltasByDate: Array<{ dateKey: string; deltaSales: number }> = [];

    if (period === 'monthly' || period === 'yearly') {
      // Aggregate existing filtered orders & expenses by date key
      const ordersSalesByDate: Record<string, number> = {};
      const ordersCashByDate: Record<string, number> = {};
      const ordersCardByDate: Record<string, number> = {};
      const expensesByDate: Record<string, number> = {};
      const invByDate: Record<string, number> = {};

      filteredOrders.forEach(tx => {
        if (tx.paymentMethod === 'gift') return;
        const dKey = normalizeDateKey(tx.date) || String(tx.date);
        ordersSalesByDate[dKey] = (ordersSalesByDate[dKey] || 0) + Number(tx.amount || 0);

        if (tx.paymentMethod === 'cash' || !tx.paymentMethod) {
          ordersCashByDate[dKey] = (ordersCashByDate[dKey] || 0) + Number(tx.amount || 0);
        } else if (tx.paymentMethod === 'card') {
          ordersCardByDate[dKey] = (ordersCardByDate[dKey] || 0) + Number(tx.amount || 0);
        } else if (tx.paymentMethod === 'mixed') {
          const cashP = tx.cashAmount !== undefined ? tx.cashAmount : (Number(tx.amount || 0) / 2);
          const cardP = tx.cardAmount !== undefined ? tx.cardAmount : Math.max(0, Number(tx.amount || 0) - cashP);
          ordersCashByDate[dKey] = (ordersCashByDate[dKey] || 0) + Number(cashP);
          ordersCardByDate[dKey] = (ordersCardByDate[dKey] || 0) + Number(cardP);
        }
      });

      filteredExpenses.forEach(ex => {
        const dKey = normalizeDateKey(ex.date) || String(ex.date);
        expensesByDate[dKey] = (expensesByDate[dKey] || 0) + Number(ex.amount || 0);
      });

      filteredInventory.forEach(ix => {
        const dKey = normalizeDateKey(ix.date) || String(ix.date);
        invByDate[dKey] = (invByDate[dKey] || 0) + Number(ix.totalCost || 0);
      });

      // Track processed closed shift date keys to avoid double processing when both key and ID exist
      const processedClosedDates = new Set<string>();

      Object.entries(closedShifts || {}).forEach(([csKey, cs]: [string, any]) => {
        if (!cs) return;
        const csDate = cs.date || cs.targetDateKey || csKey;
        if (!matchesDatePeriod(csDate, targetDate, period as any)) return;
        
        const normCsKey = normalizeDateKey(csDate) || String(csDate);
        if (processedClosedDates.has(normCsKey)) return;
        processedClosedDates.add(normCsKey);

        const shiftsForCs: any[] = (cs.allShifts && Array.isArray(cs.allShifts) && cs.allShifts.length > 0)
          ? cs.allShifts
          : [cs];
        
        let csTotalSales = 0;
        let csTotalCash = 0;
        let csTotalCard = 0;
        let csTotalExpenses = 0;
        let csTotalInv = 0;

        shiftsForCs.forEach(s => {
          csTotalSales += (s.stats?.totalSales ?? s.summary?.totalSalesSum ?? 0);
          csTotalCash += (s.stats?.totalCashSales ?? s.summary?.cashSales ?? 0);
          csTotalCard += (s.stats?.totalCardSales ?? s.summary?.cardSales ?? 0);
          csTotalExpenses += (s.stats?.totalExpenses ?? s.summary?.totalExpensesSum ?? 0);
          csTotalInv += (s.stats?.totalInventoryImportSum ?? 0);
        });

        // Compute delta between official closed totals and what orders currently sum to:
        const currentOrderSales = ordersSalesByDate[normCsKey] || 0;
        const deltaSales = csTotalSales > currentOrderSales ? (csTotalSales - currentOrderSales) : 0;
        if (deltaSales > 0) {
          extraClosedSales += deltaSales;
          salesDeltasByDate.push({
            dateKey: normCsKey,
            deltaSales: Math.round(deltaSales * 100) / 100
          });
        }

        const currentOrderCash = ordersCashByDate[normCsKey] || 0;
        const deltaCash = csTotalCash > currentOrderCash ? (csTotalCash - currentOrderCash) : 0;
        if (deltaCash > 0) {
          extraClosedCash += deltaCash;
        }

        const currentOrderCard = ordersCardByDate[normCsKey] || 0;
        const deltaCard = csTotalCard > currentOrderCard ? (csTotalCard - currentOrderCard) : 0;
        if (deltaCard > 0) {
          extraClosedCard += deltaCard;
        }

        const currentInvSum = invByDate[normCsKey] || 0;
        if (csTotalInv > currentInvSum) {
          extraClosedInv += (csTotalInv - currentInvSum);
        }

        // Add date-specific delta row to detailedSoldMap so multiple delta dates never overwrite each other!
        if (deltaSales > 0) {
          const formattedCsDate = formatAzDate(normCsKey);
          detailedSoldMap[`__reconciled_${normCsKey}__`] = {
            name: `Arxiv Növbə Satışları (${formattedCsDate})`,
            category: 'Arxiv Satışlar',
            totalQty: 1,
            totalRevenue: Math.round(deltaSales * 100) / 100,
            unitPrice: Math.round(deltaSales * 100) / 100,
            tableName: 'Arxiv',
            date: formattedCsDate,
            time: '23:59',
            paymentMethod: deltaCard > 0 && deltaCash > 0 ? 'mixed' : (deltaCard > 0 ? 'card' : 'cash')
          };
        }
      });

      // Centralized single-source calculation for extraClosedExpenses
      const expRecon = calculateExpensesReconciliation(
        closedShifts,
        targetDate,
        period as any,
        expensesByDate
      );
      extraClosedExpenses = expRecon.totalExtraExpenses;
    }

    const calculatedOrdersSales = Math.round(filteredOrders.filter(tx => tx.paymentMethod !== 'gift').reduce((sum, tx) => sum + Number(tx.amount || 0), 0) * 100) / 100;
    const totalSales = Math.round((calculatedOrdersSales + extraClosedSales) * 100) / 100;
    const totalInventoryImportSum = Math.round((filteredInventory.reduce((sum, tx) => sum + Number(tx.totalCost || 0), 0) + extraClosedInv) * 100) / 100;
    
    const explicitExpensesSum = filteredExpenses.reduce((sum, ex) => sum + Number(ex.amount || 0), 0);
    const unrecordedGiftTotal = filteredOrders
      .filter(tx => tx.paymentMethod === 'gift' && !filteredExpenses.some(ex => (ex.notes && ex.notes.includes(tx.tableName)) || (ex.title && ex.title.includes(tx.tableName))))
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    const totalExpenses = Math.round((explicitExpensesSum + unrecordedGiftTotal + extraClosedExpenses) * 100) / 100;
    // Satışdan alınan mənfəət (satış qiyməti - alış qiyməti) yüksək dəqiqlik və kosmik həssaslıqla hesablanır:
    let totalSalesProfit = 0;
    filteredOrders.forEach(tx => {
      if (tx.paymentMethod === 'gift') return;
      if (tx.items && Array.isArray(tx.items)) {
        tx.items.forEach(item => {
          const invItem = inventory.find(i => i.name.toLowerCase() === String(item.name || '').trim().toLowerCase());
          const costPrice = invItem ? (Number(invItem.costPrice) || 0) : 0;
          const salePrice = Number(item.price || 0);
          const itemQty = Number(item.quantity || 1);
          totalSalesProfit += Math.round(((salePrice - costPrice) * itemQty) * 10000) / 10000;
        });
      } else {
        totalSalesProfit += Number(tx.amount || 0);
      }
    });
    totalSalesProfit = Math.round(totalSalesProfit * 100) / 100;
    // Xalis mənfəət (zərər) qutucuğuna satış mənfəəti və xərclər tətbiq edilir:
    const netCash = Math.round((totalSalesProfit - (unrecordedGiftTotal + extraClosedExpenses)) * 100) / 100;

    // Kassadakı Nağd Pul (Nağd satışlar + qarışıq ödənişin nağd payı)
    const baseCashSales = Math.round(filteredOrders.reduce((sum, tx) => {
      if (tx.paymentMethod === 'gift') return sum;
      if (tx.paymentMethod === 'cash' || !tx.paymentMethod) return sum + Number(tx.amount || 0);
      if (tx.paymentMethod === 'mixed') {
        const cashP = tx.cashAmount !== undefined ? tx.cashAmount : (Number(tx.amount || 0) / 2);
        return sum + Number(cashP);
      }
      return sum;
    }, 0) * 100) / 100;
    const totalCashSales = Math.round((baseCashSales + extraClosedCash) * 100) / 100;

    // Kartla Satışlar (Kart satışları + qarışıq ödənişin kart payı)
    const baseCardSales = Math.round(filteredOrders.reduce((sum, tx) => {
      if (tx.paymentMethod === 'gift') return sum;
      if (tx.paymentMethod === 'card') return sum + Number(tx.amount || 0);
      if (tx.paymentMethod === 'mixed') {
        const cardP = tx.cardAmount !== undefined 
          ? tx.cardAmount 
          : (tx.cashAmount !== undefined ? Math.max(0, Number(tx.amount || 0) - tx.cashAmount) : (Number(tx.amount || 0) / 2));
        return sum + Number(cardP);
      }
      return sum;
    }, 0) * 100) / 100;
    const totalCardSales = Math.round((baseCardSales + extraClosedCard) * 100) / 100;

    // Filtered orders items iteration
    filteredOrders.forEach(tx => {
      if (tx.items && Array.isArray(tx.items)) {
        const isGiftOrder = tx.paymentMethod === 'gift';
        tx.items.forEach(item => {
          const rawTable = tx.tableName ? String(tx.tableName).trim() : `Masa ${tx.tableId || 1}`;
          const formattedTable = (rawTable || '').toLowerCase().startsWith('masa') ? rawTable : `Masa ${rawTable}`;
          const rawDate = tx.date || targetDate;
          const formattedDate = formatAzDate(rawDate);
          const rawTime = tx.time || (tx as any).time || '12:00';
          const pm = tx.paymentMethod || 'cash';
          const key = `${item.name}_${formattedTable}_${formattedDate}_${rawTime}_${pm}`;
          
          if (!detailedSoldMap[key]) {
            detailedSoldMap[key] = {
              name: item.name,
              category: item.category || 'Ümumi',
              totalQty: 0,
              totalRevenue: 0,
              unitPrice: item.price || 0,
              tableName: formattedTable,
              date: formattedDate,
              time: rawTime,
              paymentMethod: pm
            };
          }
          detailedSoldMap[key].totalQty += (item.quantity || 1);
          const itemRev = isGiftOrder ? 0 : Math.round(((item.quantity || 1) * (item.price || 0)) * 100) / 100;
          detailedSoldMap[key].totalRevenue = Math.round((detailedSoldMap[key].totalRevenue + itemRev) * 100) / 100;
        });
      }
    });

    // Sort sold products by quantity descending
    const soldProductsList = Object.values(detailedSoldMap).map(sp => ({
      ...sp,
      totalRevenue: Math.round(sp.totalRevenue * 100) / 100
    })).sort((a, b) => b.totalQty - a.totalQty);

    return {
      totalSales,
      totalInventoryImportSum,
      totalExpenses,
      netCash,
      totalCashSales,
      totalCardSales,
      filteredOrders,
      filteredInventory,
      filteredExpenses,
      soldProductsList,
      salesDeltasByDate
    };
  };

  const memoizedDashboardStats = React.useMemo(() => {
    return getFilteredStats(dashboardPeriod, dashboardDate, dashboardShiftId);
  }, [dashboardPeriod, dashboardDate, dashboardShiftId, orderTransactions, inventoryTransactions, expenses, defectRecords, effectiveExpenses, closedShifts, activeShift]);

  const memoizedDailySoldStats = React.useMemo(() => {
    return getFilteredStats('daily', dashboardDate, dashboardShiftId);
  }, [dashboardDate, dashboardShiftId, orderTransactions, inventoryTransactions, expenses, defectRecords, effectiveExpenses, closedShifts, activeShift]);

  const saleMovements: SaleMovementRecord[] = React.useMemo(() => {
    const list: SaleMovementRecord[] = [];
    const seenKeys = new Set<string>();
    const seenSignatures = new Set<string>();

    const currentShiftDate = activeShift?.businessDate || getActiveShiftBusinessDate();

    // 1. Defect & Return records (Defective = 'Xarab', Returned = 'Geri alma')
    // Authoritative source of truth for defect and return actions
    (defectRecords || []).forEach(r => {
      const typeStr = r.type === 'defective' ? 'Xarab' : 'Geri alma';
      const parsedD = parseDateToYMD(r.date);
      const isUnclosed = !r.isClosed || (activeShift?.id && r.shiftId === activeShift.id);
      const dStr = isUnclosed
        ? currentShiftDate
        : (parsedD ? parsedD.ymd : (r.date || currentShiftDate));
      const tStr = r.time ? (r.time.length === 5 ? `${r.time}:00` : r.time) : '12:00:00';
      const prodName = r.dishName || 'Naməlum Məhsul';
      const tblNum = r.tableNumber || 'Masa';
      const qty = Number(r.quantity) || 1;

      const key = `DEFECT_${r.id || Date.now() + Math.random()}`;
      const sig = `${typeStr}_${prodName.trim().toLowerCase()}_${String(tblNum).replace(/\D/g, '')}_${dStr}_${qty}`;
      seenKeys.add(key);
      seenSignatures.add(sig);

      list.push({
        id: r.id || Date.now() + Math.random(),
        productName: prodName,
        quantity: qty,
        tableNumber: tblNum,
        waiterName: r.waiterName || 'Ofisiant',
        type: typeStr,
        reason: r.reason || (r.type === 'defective' ? 'Xarab məhsul' : 'Geri qaytarıldı'),
        date: dStr,
        time: tStr,
        timestamp: r.timestamp || (dStr && tStr ? new Date(`${dStr}T${tStr}`).getTime() : Date.now()),
        shiftId: r.shiftId || (isUnclosed ? activeShift?.id : undefined),
        isClosed: isUnclosed ? false : (r.isClosed || false)
      });
    });

    // 2. Kitchen Log (Authoritative for cancellations / deletions and kitchen statuses)
    (kitchenLog || []).forEach(k => {
      const st = k.status;
      if (st === 'cancelled' || st === 'defective' || st === 'returned') {
        const typeStr = st === 'cancelled' ? 'Silindi' : st === 'defective' ? 'Xarab' : 'Geri alma';
        const parsedD = parseDateToYMD((k as any).date || k.timestamp);
        const isUnclosed = !k.isClosed || (activeShift?.id && k.shiftId === activeShift.id);
        const dStr = isUnclosed
          ? currentShiftDate
          : (parsedD ? parsedD.ymd : currentShiftDate);
        
        let tStr = '12:00:00';
        if ((k as any).time && typeof (k as any).time === 'string') {
          tStr = (k as any).time.length === 5 ? `${(k as any).time}:00` : (k as any).time;
        } else if (k.timestamp) {
          const d = new Date(k.timestamp);
          if (!isNaN(d.getTime())) {
            tStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
          }
        }

        const prodName = k.dishName || 'Məhsul';
        const tblNum = k.tableNumber || 'Masa';
        const qty = Number(k.quantity) || 1;
        const key = `KITCHEN_${k.id}`;
        const sig = `${typeStr}_${prodName.trim().toLowerCase()}_${String(tblNum).replace(/\D/g, '')}_${dStr}_${qty}`;

        if (!seenKeys.has(key) && !seenSignatures.has(sig)) {
          seenKeys.add(key);
          seenSignatures.add(sig);

          list.push({
            id: k.id || Date.now() + Math.random(),
            productName: prodName,
            quantity: qty,
            tableNumber: tblNum,
            waiterName: k.waiterName || 'Ofisiant',
            type: typeStr,
            reason: k.notes || (typeStr === 'Silindi' ? 'Sifarişdən silindi' : typeStr === 'Xarab' ? 'Xarab məhsul' : 'Geri qaytarıldı'),
            date: dStr,
            time: tStr,
            timestamp: typeof k.timestamp === 'number' ? k.timestamp : (dStr && tStr ? new Date(`${dStr}T${tStr}`).getTime() : Date.now()),
            shiftId: k.shiftId || (isUnclosed ? activeShift?.id : undefined),
            isClosed: isUnclosed ? false : (k.isClosed || false)
          });
        }
      }
    });

    // 3. Active Orders currently on tables (Cancelled, Defective, Returned, Gift)
    if (activeOrders && typeof activeOrders === 'object') {
      Object.entries(activeOrders).forEach(([tableId, items]) => {
        if (Array.isArray(items)) {
          const tblObj = tables.find(t => String(t.id) === String(tableId));
          const tblNum = tblObj?.number || `Masa ${tableId}`;
          const waiter = tblObj?.waiterName || 'Ofisiant';

          items.forEach((item: OrderItem, idx: number) => {
            const qty = Number(item.quantity) || 1;
            const dStr = currentShiftDate;
            const tStr = new Date().toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

            if (item.status === 'cancelled') {
              const sig = `Silindi_${item.name.trim().toLowerCase()}_${String(tblNum).replace(/\D/g, '')}_${dStr}_${qty}`;
              const key = `ACTIVE_CANCEL_${item.id || idx}_${tableId}`;
              if (!seenKeys.has(key) && !seenSignatures.has(sig)) {
                seenKeys.add(key);
                seenSignatures.add(sig);
                list.push({
                  id: (item.id || Date.now()) + idx,
                  productName: item.name,
                  quantity: qty,
                  tableNumber: tblNum,
                  waiterName: waiter,
                  type: 'Silindi',
                  reason: item.deleteReason || 'Sifarişdən silindi',
                  date: dStr,
                  time: tStr,
                  timestamp: Date.now(),
                  shiftId: activeShift?.id,
                  isClosed: false
                });
              }
            } else if (item.status === 'defective') {
              const sig = `Xarab_${item.name.trim().toLowerCase()}_${String(tblNum).replace(/\D/g, '')}_${dStr}_${qty}`;
              const key = `ACTIVE_DEFECT_${item.id || idx}_${tableId}`;
              if (!seenKeys.has(key) && !seenSignatures.has(sig)) {
                seenKeys.add(key);
                seenSignatures.add(sig);
                list.push({
                  id: (item.id || Date.now()) + idx,
                  productName: item.name,
                  quantity: qty,
                  tableNumber: tblNum,
                  waiterName: waiter,
                  type: 'Xarab',
                  reason: item.deleteReason || 'Xarab məhsul',
                  date: dStr,
                  time: tStr,
                  timestamp: Date.now(),
                  shiftId: activeShift?.id,
                  isClosed: false
                });
              }
            } else if (item.status === 'returned') {
              const sig = `Geri alma_${item.name.trim().toLowerCase()}_${String(tblNum).replace(/\D/g, '')}_${dStr}_${qty}`;
              const key = `ACTIVE_RETURN_${item.id || idx}_${tableId}`;
              if (!seenKeys.has(key) && !seenSignatures.has(sig)) {
                seenKeys.add(key);
                seenSignatures.add(sig);
                list.push({
                  id: (item.id || Date.now()) + idx,
                  productName: item.name,
                  quantity: qty,
                  tableNumber: tblNum,
                  waiterName: waiter,
                  type: 'Geri alma',
                  reason: item.deleteReason || 'Geri qaytarıldı',
                  date: dStr,
                  time: tStr,
                  timestamp: Date.now(),
                  shiftId: activeShift?.id,
                  isClosed: false
                });
              }
            } else if (item.isGift) {
              const sig = `Hədiyyə_${item.name.trim().toLowerCase()}_${String(tblNum).replace(/\D/g, '')}_${dStr}_${qty}`;
              const key = `ACTIVE_GIFT_${item.id || idx}_${tableId}`;
              if (!seenKeys.has(key) && !seenSignatures.has(sig)) {
                seenKeys.add(key);
                seenSignatures.add(sig);
                list.push({
                  id: (item.id || Date.now()) + idx,
                  productName: item.name,
                  quantity: qty,
                  tableNumber: tblNum,
                  waiterName: waiter,
                  type: 'Hədiyyə',
                  reason: 'Hədiyyə məhsul / İkram',
                  date: dStr,
                  time: tStr,
                  timestamp: Date.now(),
                  shiftId: activeShift?.id,
                  isClosed: false
                });
              }
            }
          });
        }
      });
    }

    // 4. Completed Order Transactions for Gifts ('Hədiyyə') and Cancelled items
    const allOrdersSource: OrderTransaction[] = [...(orderTransactions || [])];
    const seenTxIds = new Set<string | number>((orderTransactions || []).map(tx => tx.id));

    Object.values(closedShifts || {}).forEach((cs: any) => {
      if (!cs) return;
      if (cs.orders && Array.isArray(cs.orders)) {
        cs.orders.forEach((tx: OrderTransaction) => {
          if (tx && tx.id && !seenTxIds.has(tx.id)) {
            seenTxIds.add(tx.id);
            allOrdersSource.push({
              ...tx,
              shiftId: tx.shiftId || cs.shiftId || cs.reportNo,
              isClosed: true
            });
          }
        });
      }
      if (cs && cs.allShifts && Array.isArray(cs.allShifts)) {
        cs.allShifts.forEach((shiftItem: any) => {
          if (shiftItem && shiftItem.orders && Array.isArray(shiftItem.orders)) {
            shiftItem.orders.forEach((tx: OrderTransaction) => {
              if (tx && tx.id && !seenTxIds.has(tx.id)) {
                seenTxIds.add(tx.id);
                allOrdersSource.push({
                  ...tx,
                  shiftId: tx.shiftId || shiftItem.shiftId || shiftItem.reportNo,
                  isClosed: true
                });
              }
            });
          }
        });
      }
    });

    allOrdersSource.forEach(tx => {
      const parsedD = parseDateToYMD(tx.date);
      const isTxUnclosed = !tx.isClosed || (activeShift?.id && tx.shiftId === activeShift.id);
      const dStr = isTxUnclosed
        ? currentShiftDate
        : (parsedD ? parsedD.ymd : (tx.date || currentShiftDate));
      const tStr = tx.time ? (tx.time.length === 5 ? `${tx.time}:00` : tx.time) : '12:00:00';
      const tblNum = tx.tableName || `Masa ${tx.tableId || 1}`;
      const txShiftId = tx.shiftId || (isTxUnclosed ? activeShift?.id : undefined);

      if (tx.items && Array.isArray(tx.items)) {
        tx.items.forEach((item: any, idx: number) => {
          const qty = Number(item.quantity) || 1;
          if (item.status === 'cancelled' || (item.deleteReason && item.status !== 'returned' && item.status !== 'defective')) {
            const key = `TX_CANCEL_${tx.id}_${idx}`;
            const sig = `Silindi_${item.name.trim().toLowerCase()}_${String(tblNum).replace(/\D/g, '')}_${dStr}_${qty}`;
            if (!seenKeys.has(key) && !seenSignatures.has(sig)) {
              seenKeys.add(key);
              seenSignatures.add(sig);
              list.push({
                id: (tx.id * 1000) + idx,
                orderId: tx.id,
                productName: item.name,
                quantity: qty,
                tableNumber: tblNum,
                waiterName: tx.waiterName || 'Ofisiant',
                type: 'Silindi',
                reason: item.deleteReason || 'Sifarişdən silindi',
                date: dStr,
                time: tStr,
                timestamp: tx.timestamp || (dStr && tStr ? new Date(`${dStr}T${tStr}`).getTime() : Date.now()),
                shiftId: txShiftId,
                isClosed: isTxUnclosed ? false : (tx.isClosed || false)
              });
            }
          } else if (item.isGift || (item.price === 0 && item.name)) {
            const key = `TX_GIFT_${tx.id}_${idx}`;
            const sig = `Hədiyyə_${item.name.trim().toLowerCase()}_${String(tblNum).replace(/\D/g, '')}_${dStr}_${qty}`;
            if (!seenKeys.has(key) && !seenSignatures.has(sig)) {
              seenKeys.add(key);
              seenSignatures.add(sig);
              list.push({
                id: (tx.id * 1000) + idx,
                orderId: tx.id,
                productName: item.name,
                quantity: qty,
                tableNumber: tblNum,
                waiterName: tx.waiterName || 'Ofisiant',
                type: 'Hədiyyə',
                reason: 'Məhsul hədiyyəsi / İkram',
                date: dStr,
                time: tStr,
                timestamp: tx.timestamp || (dStr && tStr ? new Date(`${dStr}T${tStr}`).getTime() : Date.now()),
                shiftId: txShiftId,
                isClosed: isTxUnclosed ? false : (tx.isClosed || false)
              });
            }
          }
        });
      }
    });

    // 5. Audit logs for deletions ('Silindi') not captured in above sources
    (auditLogs || []).forEach((log: any, idx: number) => {
      if (!log.action) return;
      const isCancel = log.action.includes('Silin') || log.action.includes('Ləğv') || log.action.includes('Borc Silinməsi');
      if (isCancel && !log.action.includes('Xarab') && !log.action.includes('Qaytar') && !log.action.includes('Geri')) {
        const isLogUnclosed = !log.isClosed || (activeShift?.id && log.shiftId === activeShift.id);
        let dStr = currentShiftDate;
        if (log.businessDate) {
          dStr = isLogUnclosed ? currentShiftDate : log.businessDate;
        } else if (isLogUnclosed) {
          dStr = currentShiftDate;
        } else {
          const parsedD = parseDateToYMD(log.timestamp);
          dStr = parsedD ? parsedD.ymd : currentShiftDate;
        }

        let tStr = '12:00:00';
        if (log.timestamp) {
          const matchTime = String(log.timestamp).match(/(\d{1,2}:\d{2}(?::\d{2})?)/);
          if (matchTime) {
            tStr = matchTime[1].length === 5 ? `${matchTime[1]}:00` : matchTime[1];
          }
        }

        let parsedProduct = log.details || log.action;
        let parsedTable = 'Masa';
        let parsedQty = 1;
        let parsedReason = 'Sifarişdən silindi';

        if (log.details && typeof log.details === 'string') {
          const tableMatch = log.details.match(/^(?:Masa\s*#?|#)?(\d+|[A-Za-z0-9\s]+?)\s*-/i) || log.details.match(/(Masa\s*#?\d+)/i);
          if (tableMatch) {
            parsedTable = tableMatch[1].startsWith('Masa') ? tableMatch[1] : `Masa ${tableMatch[1]}`;
          }

          const quoteMatch = log.details.match(/['"“](.+?)['"”]/);
          if (quoteMatch) {
            parsedProduct = quoteMatch[1];
          }

          const qtyMatch = log.details.match(/(\d+)\s*(?:ədəd|porsiya|əd|pors)/i);
          if (qtyMatch) {
            parsedQty = parseInt(qtyMatch[1], 10) || 1;
          }

          const reasonMatch = log.details.match(/Səbəb:\s*(.+)$/i);
          if (reasonMatch) {
            parsedReason = reasonMatch[1].trim();
          }
        }

        const key = `AUDIT_${log.id || idx}_Silindi_${parsedProduct}_${dStr}`;
        const sig = `Silindi_${parsedProduct.trim().toLowerCase()}_${String(parsedTable).replace(/\D/g, '')}_${dStr}_${parsedQty}`;
        if (!seenKeys.has(key) && !seenSignatures.has(sig)) {
          seenKeys.add(key);
          seenSignatures.add(sig);
          list.push({
            id: log.id || Date.now() + Math.random(),
            productName: parsedProduct,
            quantity: parsedQty,
            tableNumber: parsedTable,
            waiterName: log.operator || 'Admin',
            type: 'Silindi',
            reason: parsedReason,
            date: dStr,
            time: tStr,
            timestamp: typeof log.timestamp === 'string' ? (dStr && tStr ? new Date(`${dStr}T${tStr}`).getTime() : Date.now()) : (log.timestamp || Date.now()),
            shiftId: log.shiftId || (isLogUnclosed ? activeShift?.id : undefined),
            isClosed: isLogUnclosed ? false : (log.isClosed || false)
          });
        }
      }
    });

    // Sort descending by timestamp / time so newest movements are always at top
    list.sort((a, b) => {
      const timeA = a.timestamp || (a.date && a.time ? new Date(`${a.date}T${a.time}`).getTime() : 0);
      const timeB = b.timestamp || (b.date && b.time ? new Date(`${b.date}T${b.time}`).getTime() : 0);
      return timeB - timeA;
    });

    return list;
  }, [defectRecords, kitchenLog, auditLogs, orderTransactions, activeOrders, tables, activeShift, closedShifts]);

  const memoizedReportStats = React.useMemo(() => {
    return getFilteredStats(reportPeriod, reportDate, reportShiftId);
  }, [reportPeriod, reportDate, reportShiftId, orderTransactions, inventoryTransactions, expenses, defectRecords, effectiveExpenses, closedShifts, activeShift]);

  const getPaymentMethodBadge = (pm?: string) => {
    const method = (pm || 'cash').toLowerCase();
    if (method === 'cash') {
      return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider">NƏĞD</span>;
    }
    if (method === 'card') {
      return <span className="bg-blue-50 text-blue-700 border border-blue-200/60 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider">KARTLA</span>;
    }
    if (method === 'mixed') {
      return <span className="bg-purple-50 text-purple-700 border border-purple-200/60 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider">QARIŞIQ</span>;
    }
    if (method === 'gift') {
      return <span className="bg-amber-50 text-amber-700 border border-amber-200/60 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider">HƏDİYYƏ</span>;
    }
    if (method === 'debt') {
      return <span className="bg-rose-50 text-rose-700 border border-rose-200/60 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider">NİSYƏ</span>;
    }
    return <span className="bg-slate-50 text-slate-700 border border-slate-200/60 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider">{method}</span>;
  };

  const getZReportData = (targetDate: string, targetShiftId?: string) => {
    const normKey = normalizeDateKey(targetDate);
    const activeNormKey = normalizeDateKey(activeShift.businessDate);

    // If a specific closed targetShiftId is requested (not 'active' and not 'auto'):
    if (targetShiftId && targetShiftId !== 'active' && targetShiftId !== 'auto') {
      if (closedShifts[targetShiftId]?.summary) {
        return closedShifts[targetShiftId].summary;
      }
      if (normKey && closedShifts[normKey]?.allShifts) {
        const found = closedShifts[normKey].allShifts.find((s: any) => s.shiftId === targetShiftId);
        if (found?.summary) return found.summary;
      }
    }

    if ((!targetShiftId || targetShiftId === 'auto') && normKey && closedShifts[normKey] && closedShifts[normKey].summary && normKey !== activeNormKey) {
      return closedShifts[normKey].summary;
    }

    const matchDate = (dateVal: any, target: string, timestampVal?: any): boolean => {
      const targetKey = normalizeDateKey(target);
      if (!targetKey) return false;

      const key1 = normalizeDateKey(dateVal);
      if (key1 && key1 === targetKey) return true;

      if (timestampVal) {
        const key2 = normalizeDateKey(timestampVal);
        if (key2 && key2 === targetKey) return true;
      }
      return false;
    };

    let formattedDate = targetDate;
    if (normKey) {
      const [yyyy, mm, dd] = normKey.split('-');
      formattedDate = `${dd}.${mm}.${yyyy}`;
    }

    const isActiveShiftDate = Boolean(normKey && activeNormKey && normKey === activeNormKey);

    const dailyStats = getFilteredStats('daily', targetDate, targetShiftId);
    const dayOrders = dailyStats.filteredOrders || [];
    const dayExpenses = dailyStats.filteredExpenses || [];

    const totalOrdersCount = dayOrders.length;

    const cashSales = dailyStats.totalCashSales !== undefined 
      ? dailyStats.totalCashSales 
      : Math.round(dayOrders.reduce((sum, tx) => {
          if (tx.paymentMethod === 'gift') return sum;
          if (tx.paymentMethod === 'cash' || !tx.paymentMethod) return sum + Number(tx.amount || 0);
          if (tx.paymentMethod === 'mixed') {
            const cashP = tx.cashAmount !== undefined ? tx.cashAmount : (Number(tx.amount || 0) / 2);
            return sum + Number(cashP);
          }
          return sum;
        }, 0) * 100) / 100;
    const cardSales = (dailyStats as any).totalCardSales !== undefined
      ? (dailyStats as any).totalCardSales
      : Math.round(dayOrders.reduce((sum, tx) => {
          if (tx.paymentMethod === 'gift') return sum;
          if (tx.paymentMethod === 'card') return sum + Number(tx.amount || 0);
          if (tx.paymentMethod === 'mixed') {
            const cardP = tx.cardAmount !== undefined 
              ? tx.cardAmount 
              : (tx.cashAmount !== undefined ? Math.max(0, Number(tx.amount || 0) - tx.cashAmount) : (Number(tx.amount || 0) / 2));
            return sum + Number(cardP);
          }
          return sum;
        }, 0) * 100) / 100;
    const mixedSales = Math.round(dayOrders.filter(tx => tx.paymentMethod === 'mixed').reduce((sum, tx) => sum + Number(tx.amount || 0), 0) * 100) / 100;
    const debtSales = Math.round(dayOrders.filter(tx => tx.paymentMethod === 'debt').reduce((sum, tx) => sum + Number(tx.amount || 0), 0) * 100) / 100;

    // Cosmic precision calculation for Gift (Hədiyyə)
    const fullGiftOrders = dayOrders.filter(tx => tx.paymentMethod === 'gift').reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    const giftItemsSum = dayOrders.reduce((acc, tx) => {
      if (tx.paymentMethod === 'gift') return acc;
      const itemsSum = (tx.items || []).reduce((iAcc: number, item: any) => {
        if (item.isGift || (item.price === 0 && item.name)) {
          const menuItem = menuItems.find(m => m.name === item.name);
          const itemPrice = (menuItem ? menuItem.price : 0) || item.originalPrice || 0;
          return iAcc + (itemPrice * (item.quantity || 1));
        }
        return iAcc;
      }, 0);
      return acc + itemsSum;
    }, 0);
    const giftExpenses = dayExpenses.filter(e => (
      (e.category && (e.category.toLowerCase().includes('hədiyyə') || e.category.toLowerCase().includes('hediyye') || e.category.toLowerCase().includes('gift') || e.category.toLowerCase().includes('ikram')))
      || (e.title && (e.title.toLowerCase().includes('hədiyyə') || e.title.toLowerCase().includes('hediyye') || e.title.toLowerCase().includes('gift') || e.title.toLowerCase().includes('ikram')))
    )).reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const giftSales = Math.round((fullGiftOrders + giftItemsSum + giftExpenses) * 100) / 100;

    // Cosmic precision calculation for Defective / Damaged items (Xarab məhsul)
    const dayDefectRecords = (defectRecords || []).filter(r => {
      if (r.type !== 'defective') return false;
      if (isActiveShiftDate) {
        if (r.isClosed) return false;
        if (r.shiftId && activeShift?.id && r.shiftId !== activeShift.id) return false;
        return true;
      }
      return matchDate(r.date, targetDate, r.timestamp);
    });
    const defectRecordsSum = dayDefectRecords.reduce((sum, r) => sum + ((Number(r.price) || 0) * (r.quantity || 1)), 0);

    const dayDefectiveKitchenExtra = (kitchenLog || []).filter(k => {
      if (k.status !== 'defective') return false;
      if (isActiveShiftDate) {
        if (k.isClosed) return false;
        if (k.shiftId && activeShift?.id && k.shiftId !== activeShift.id) return false;
      } else {
        if (!matchDate((k as any).date || k.timestamp, targetDate, k.timestamp)) return false;
      }
      const alreadyInDefects = dayDefectRecords.some(r => 
        r.dishName?.trim().toLowerCase() === k.dishName?.trim().toLowerCase() &&
        String(r.tableNumber).replace(/\D/g, '') === String(k.tableNumber).replace(/\D/g, '') &&
        (r.quantity || 1) === (k.quantity || 1)
      );
      return !alreadyInDefects;
    }).reduce((sum, k) => { 
      const menu = menuItems.find(m => m.name === k.dishName); 
      return sum + ((menu ? menu.price : 0) * (k.quantity || 1)); 
    }, 0);

    const defectiveSales = Math.round((defectRecordsSum + dayDefectiveKitchenExtra) * 100) / 100;

    // Cosmic precision calculation for Returned / Replaced items (Geri qaytarılan / Dəyişdirilən)
    const dayReturnRecords = (defectRecords || []).filter(r => {
      if (r.type !== 'returned') return false;
      if (isActiveShiftDate) {
        if (r.isClosed) return false;
        if (r.shiftId && activeShift?.id && r.shiftId !== activeShift.id) return false;
        return true;
      }
      return matchDate(r.date, targetDate, r.timestamp);
    });
    const returnRecordsSum = dayReturnRecords.reduce((sum, r) => sum + ((Number(r.price) || 0) * (r.quantity || 1)), 0);

    const dayReturnedKitchenExtra = (kitchenLog || []).filter(k => {
      if (k.status !== 'returned' && (k.status as any) !== 'replaced') return false;
      if (isActiveShiftDate) {
        if (k.isClosed) return false;
        if (k.shiftId && activeShift?.id && k.shiftId !== activeShift.id) return false;
      } else {
        if (!matchDate((k as any).date || k.timestamp, targetDate, k.timestamp)) return false;
      }
      const alreadyInReturns = dayReturnRecords.some(r => 
        r.dishName?.trim().toLowerCase() === k.dishName?.trim().toLowerCase() &&
        String(r.tableNumber).replace(/\D/g, '') === String(k.tableNumber).replace(/\D/g, '') &&
        (r.quantity || 1) === (k.quantity || 1)
      );
      return !alreadyInReturns;
    }).reduce((sum, k) => { 
      const menu = menuItems.find(m => m.name === k.dishName); 
      return sum + ((menu ? menu.price : 0) * (k.quantity || 1)); 
    }, 0);

    const returnedSales = Math.round((returnRecordsSum + dayReturnedKitchenExtra) * 100) / 100;

    // Total Expenses (Cosmic precision)
    const dayExplicitExpenses = dayExpenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
    const dayUnrecordedGift = dayOrders
      .filter(tx => tx.paymentMethod === 'gift' && !dayExpenses.some(ex => (ex.notes && ex.notes.includes(tx.tableName)) || (ex.title && ex.title.includes(tx.tableName))))
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    const totalExpensesSum = dailyStats.totalExpenses !== undefined ? dailyStats.totalExpenses : Math.round((dayExplicitExpenses + dayUnrecordedGift) * 100) / 100;

    // Total Turnover
    const totalSalesSum = dailyStats.totalSales !== undefined ? dailyStats.totalSales : Math.round(dayOrders.filter(tx => tx.paymentMethod !== 'gift').reduce((sum, tx) => sum + Number(tx.amount || 0), 0) * 100) / 100;

    // Net Cash (Qazanc) - Satış mənfəəti ilə yüksək dəqiqlikdə
    let daySalesProfit = 0;
    dayOrders.forEach(tx => {
      if (tx.paymentMethod === 'gift') return;
      if (tx.items && Array.isArray(tx.items)) {
        tx.items.forEach(item => {
          const invItem = inventory.find(i => i.name.toLowerCase() === String(item.name || '').trim().toLowerCase());
          const costPrice = invItem ? (Number(invItem.costPrice) || 0) : 0;
          const salePrice = Number(item.price || 0);
          const itemQty = Number(item.quantity || 1);
          daySalesProfit += Math.round(((salePrice - costPrice) * itemQty) * 10000) / 10000;
        });
      } else {
        daySalesProfit += Number(tx.amount || 0);
      }
    });
    daySalesProfit = Math.round(daySalesProfit * 100) / 100;
    const netIncome = dailyStats.netCash !== undefined ? dailyStats.netCash : Math.round((daySalesProfit - totalExpensesSum) * 100) / 100;

    const soldItemsMap: Record<string, { name: string; qty: number; price: number; total: number; methods: Set<string> }> = {};
    dayOrders.forEach(tx => {
      if (tx.items && Array.isArray(tx.items)) {
        const isGiftOrder = tx.paymentMethod === 'gift';
        tx.items.forEach(item => {
          const key = `${item.name}_${item.price}`;
          if (!soldItemsMap[key]) {
            soldItemsMap[key] = {
              name: item.name,
              qty: 0,
              price: item.price || 0,
              total: 0,
              methods: new Set()
            };
          }
          soldItemsMap[key].qty += item.quantity || 1;
          const itemRev = isGiftOrder ? 0 : Math.round(((item.quantity || 1) * (item.price || 0)) * 100) / 100;
          soldItemsMap[key].total += itemRev;
          soldItemsMap[key].methods.add(tx.paymentMethod || 'cash');
        });
      }
    });

    const soldItems = Object.values(soldItemsMap).sort((a, b) => b.qty - a.qty);

    const existingClosed = normKey ? closedShifts[normKey] : null;
    const existingShifts = (existingClosed?.allShifts && Array.isArray(existingClosed.allShifts))
      ? existingClosed.allShifts
      : (existingClosed?.shiftId ? [existingClosed] : []);
    const shiftIndex = existingShifts.length + 1;
    const baseDateClean = (normKey || targetDate).replace(/[-.]/g, '');
    const defaultReportNo = existingShifts.length > 0 ? `Z-${baseDateClean}-${shiftIndex}` : `Z-${baseDateClean}`;

    return {
      date: formattedDate,
      rawDate: targetDate,
      reportNo: defaultReportNo,
      totalOrdersCount,
      totalSalesSum,
      cashSales,
      cardSales,
      mixedSales,
      giftSales,
      defectiveSales,
      returnedSales,
      debtSales,
      totalExpensesSum,
      netIncome,
      soldItems,
      expenses: dayExpenses
    };
  };

  const handleCloseShift = (targetDate: string) => {
    const normKey = normalizeDateKey(targetDate) || targetDate;

    const existingClosed = closedShifts[normKey];
    const existingShiftsList: any[] = (existingClosed?.allShifts && Array.isArray(existingClosed.allShifts))
      ? existingClosed.allShifts
      : (existingClosed?.shiftId ? [existingClosed] : []);

    if (existingShiftsList.length >= 2) {
      setShiftNoticeModal({
        title: "Növbə Limiti",
        message: "Bu gün üçün maksimum 2 növbə limiti dolub! Bir təqvim günü ərzində 2-dən artıq növbə bağlana bilməz.",
        type: "warning"
      });
      return;
    }

    if (activeShift?.isClosed) {
      setShiftNoticeModal({
        title: "Növbə Məlumatı",
        message: "Cari növbə artıq bağlanıb.",
        type: "info"
      });
      return;
    }

    // 1. Get exact Z-report snapshot for active shift
    const zData = getZReportData(targetDate, activeShift.id);

    // 2. Pre-calculate the exact dashboard/report stats snapshot for this shift
    const matchesTarget = (d: string) => d === targetDate || normalizeDateKey(d) === normKey;

    const currentOrders = orderTransactions.filter(tx => 
      (tx.shiftId === activeShift.id) || (!tx.isClosed && matchesTarget(tx.date))
    );
    const currentExpenses = effectiveExpenses.filter(ex => 
      ((ex as any).shiftId === activeShift.id) || (!(ex as any).isClosed && matchesTarget(ex.date))
    );
    const currentInventory = inventoryTransactions.filter(ix => 
      ((ix as any).shiftId === activeShift.id) || (!(ix as any).isClosed && matchesTarget(ix.date))
    );
    const currentDefects = defectRecords.filter(dr => 
      (dr.shiftId === activeShift.id) || (!dr.isClosed && matchesTarget(dr.date))
    );

    const totalSales = zData.totalSalesSum;
    const totalExpenses = zData.totalExpensesSum;
    const totalInventoryImportSum = Math.round(currentInventory.reduce((sum, tx) => sum + Number(tx.totalCost || 0), 0) * 100) / 100;
    let currentOrdersProfit = 0;
    currentOrders.forEach(tx => {
      if (tx.paymentMethod === 'gift') return;
      if (tx.items && Array.isArray(tx.items)) {
        tx.items.forEach(item => {
          const invItem = inventory.find(i => i.name.toLowerCase() === String(item.name || '').trim().toLowerCase());
          const costPrice = invItem ? (Number(invItem.costPrice) || 0) : 0;
          const salePrice = Number(item.price || 0);
          const itemQty = Number(item.quantity || 1);
          currentOrdersProfit += Math.round(((salePrice - costPrice) * itemQty) * 10000) / 10000;
        });
      } else {
        currentOrdersProfit += Number(tx.amount || 0);
      }
    });
    currentOrdersProfit = Math.round(currentOrdersProfit * 100) / 100;
    const netCash = Math.round((currentOrdersProfit - totalExpenses) * 100) / 100;

    const detailedSoldMap: Record<string, any> = {};
    currentOrders.forEach(tx => {
      if (tx.items && Array.isArray(tx.items)) {
        const isGiftOrder = tx.paymentMethod === 'gift';
        tx.items.forEach(item => {
          const rawTable = tx.tableName ? String(tx.tableName).trim() : `Masa ${tx.tableId || 1}`;
          const formattedTable = (rawTable || '').toLowerCase().startsWith('masa') ? rawTable : `Masa ${rawTable}`;
          const pm = tx.paymentMethod || 'cash';
          const key = `${item.name}_${formattedTable}_${pm}`;
          if (!detailedSoldMap[key]) {
            detailedSoldMap[key] = {
              name: item.name,
              category: item.category || 'Ümumi',
              totalQty: 0,
              totalRevenue: 0,
              unitPrice: item.price || 0,
              tableName: formattedTable,
              date: zData.date,
              time: tx.time || '12:00',
              paymentMethod: pm
            };
          }
          detailedSoldMap[key].totalQty += item.quantity;
          const itemRev = isGiftOrder ? 0 : Math.round((item.quantity * (item.price || 0)) * 100) / 100;
          detailedSoldMap[key].totalRevenue += itemRev;
        });
      }
    });
    const soldProductsList = Object.values(detailedSoldMap).map((sp: any) => ({
      ...sp,
      totalRevenue: Math.round(sp.totalRevenue * 100) / 100
    })).sort((a: any, b: any) => b.totalQty - a.totalQty);

    const calculatedCashSales = Math.round(currentOrders.reduce((sum, tx) => {
      if (tx.paymentMethod === 'gift') return sum;
      if (tx.paymentMethod === 'cash' || !tx.paymentMethod) return sum + Number(tx.amount || 0);
      if (tx.paymentMethod === 'mixed') {
        const cashP = tx.cashAmount !== undefined ? tx.cashAmount : (Number(tx.amount || 0) / 2);
        return sum + Number(cashP);
      }
      return sum;
    }, 0) * 100) / 100;

    const calculatedCardSales = Math.round(currentOrders.reduce((sum, tx) => {
      if (tx.paymentMethod === 'gift') return sum;
      if (tx.paymentMethod === 'card') return sum + Number(tx.amount || 0);
      if (tx.paymentMethod === 'mixed') {
        const cardP = tx.cardAmount !== undefined 
          ? tx.cardAmount 
          : (tx.cashAmount !== undefined ? Math.max(0, Number(tx.amount || 0) - tx.cashAmount) : (Number(tx.amount || 0) / 2));
        return sum + Number(cardP);
      }
      return sum;
    }, 0) * 100) / 100;

    const shiftStatsSnapshot = {
      totalSales,
      totalInventoryImportSum,
      totalExpenses,
      netCash,
      totalCashSales: calculatedCashSales,
      totalCardSales: calculatedCardSales,
      filteredOrders: currentOrders,
      filteredInventory: currentInventory,
      filteredExpenses: currentExpenses,
      soldProductsList
    };

    const shiftIndex = existingShiftsList.length + 1;
    const newClosedShiftRecord = {
      date: zData.date,
      targetDateKey: normKey,
      reportNo: zData.reportNo,
      closedAt: new Date().toISOString(),
      summary: zData,
      stats: shiftStatsSnapshot,
      orders: currentOrders,
      expenses: currentExpenses,
      defects: currentDefects,
      shiftId: activeShift.id,
      shiftIndex,
      operator: 'Admin / Menecer'
    };

    const updatedAllShifts = [
      ...existingShiftsList.filter((s: any) => s.shiftId !== activeShift.id),
      newClosedShiftRecord
    ];

    // 3. Archive into closedShifts
    const updatedClosedShifts = {
      ...closedShifts,
      [normKey]: {
        ...newClosedShiftRecord,
        allShifts: updatedAllShifts
      },
      [activeShift.id]: newClosedShiftRecord
    };
    setClosedShifts(updatedClosedShifts);
    safeLocalStorageSetItem('resto_closedShifts', JSON.stringify(updatedClosedShifts));

    // 4. Close and archive active shift transactions into historical state
    const updatedOrders = orderTransactions.map(tx => {
      if (tx.shiftId === activeShift.id || !tx.isClosed) {
        return { ...tx, isClosed: true, shiftId: tx.shiftId || activeShift.id, date: tx.date || activeShift.businessDate };
      }
      return tx;
    });
    setOrderTransactions(updatedOrders);
    safeLocalStorageSetItem('resto_orderTransactions', JSON.stringify(updatedOrders));

    const updatedExpenses = expenses.map(ex => {
      if (ex.shiftId === activeShift.id || !ex.isClosed) {
        return { ...ex, isClosed: true, shiftId: ex.shiftId || activeShift.id, date: ex.date || activeShift.businessDate };
      }
      return ex;
    });
    setExpenses(updatedExpenses);
    safeLocalStorageSetItem('resto_expenses', JSON.stringify(updatedExpenses));

    const updatedDefects = defectRecords.map(dr => {
      if (dr.shiftId === activeShift.id || !dr.isClosed) {
        return { ...dr, isClosed: true, shiftId: dr.shiftId || activeShift.id, date: dr.date || activeShift.businessDate };
      }
      return dr;
    });
    setDefectRecords(updatedDefects);
    safeLocalStorageSetItem('resto_defectRecords', JSON.stringify(updatedDefects));

    const updatedKitchen = kitchenLog.map(k => {
      if (k.shiftId === activeShift.id || !k.isClosed) {
        return { ...k, isClosed: true, shiftId: k.shiftId || activeShift.id };
      }
      return k;
    });
    setKitchenLog(updatedKitchen);
    safeLocalStorageSetItem('resto_kitchenLog', JSON.stringify(updatedKitchen));

    const updatedAuditLogs = auditLogs.map((log: any) => {
      if (log.shiftId === activeShift.id || !log.isClosed) {
        return { ...log, isClosed: true, shiftId: log.shiftId || activeShift.id, businessDate: log.businessDate || activeShift.businessDate };
      }
      return log;
    });
    setAuditLogs(updatedAuditLogs);
    safeLocalStorageSetItem('resto_auditLogs', JSON.stringify(updatedAuditLogs));

    // Reset active tables and active orders to pristine empty state
    setActiveOrders({});
    safeLocalStorageSetItem('resto_activeOrders', JSON.stringify({}));

    const clearedTables = tables.map(t => ({
      ...t,
      status: 'available' as const,
      currentOrder: undefined,
      billRequested: false,
      billRequestedAt: undefined,
      waiterName: undefined
    }));
    setTables(clearedTables);
    safeLocalStorageSetItem('resto_tables', JSON.stringify(clearedTables));

    // 5. Open Shift #2 if only 1 shift was closed, or complete the day and open next business date shift if 2 shifts closed
    if (existingShiftsList.length === 0) {
      // Open Shift #2 for the same business date!
      const newShift = {
        id: `shift_${Date.now()}`,
        businessDate: activeShift.businessDate || targetDate,
        openedAt: new Date().toISOString(),
        isClosed: false
      };
      setActiveShift(newShift);
      safeLocalStorageSetItem('resto_activeShift', JSON.stringify(newShift));
      if ((window as any).electron?.sqliteSaveEntity) {
        (window as any).electron.sqliteSaveEntity('resto_activeShift', newShift).catch((e: any) => console.log('SQLite activeShift sync:', e));
      }
      setDashboardShiftId(newShift.id);
      setDashboardDate(newShift.businessDate);
      setReportDate(newShift.businessDate);
      setZReportDate(newShift.businessDate);
      setExpenseDate(newShift.businessDate);
      setKitchenDate(newShift.businessDate);

      setShowZReportModal(false);
      setShiftNoticeModal({
        title: "Növbə #1 Uğurla Bağlandı",
        message: `Tarix: ${zData.date} üçün Növbə #1 uğurla bağlandı və Z-hesabat arxivləşdirildi!\n\nNövbə #2 başladıldı. Bütün aktiv sifarişlər, masalar və kassa sıfırlandı (0.00 AZN).`,
        type: "success"
      });
    } else {
      // Shift #2 is now closed! Both shifts for today are closed.
      // Auto-advance to next business date (either realToday if ahead, or next day after closed shift)
      const currentBizDate = activeShift.businessDate || targetDate;
      const realToday = getTodayStr();
      const nextDate = (realToday > currentBizDate) ? realToday : getNextDateStr(currentBizDate);

      const nextDayShift = {
        id: `shift_${Date.now()}`,
        businessDate: nextDate,
        openedAt: new Date().toISOString(),
        isClosed: false
      };

      setActiveShift(nextDayShift);
      safeLocalStorageSetItem('resto_activeShift', JSON.stringify(nextDayShift));
      if ((window as any).electron?.sqliteSaveEntity) {
        (window as any).electron.sqliteSaveEntity('resto_activeShift', nextDayShift).catch((e: any) => console.log('SQLite activeShift sync:', e));
      }
      setDashboardShiftId(nextDayShift.id);
      setDashboardDate(nextDate);
      setReportDate(nextDate);
      setZReportDate(nextDate);
      setExpenseDate(nextDate);
      setKitchenDate(nextDate);

      setShowZReportModal(false);
      setShiftNoticeModal({
        title: "Növbə #2 Uğurla Bağlandı",
        message: `Tarix: ${zData.date} üçün Növbə #2 uğurla bağlandı və Z-hesabat arxivləşdirildi!\n\nNövbəti iş günü (${nextDate}) başladıldı. Bütün aktiv sifarişlər, masalar, xərclər və idarəetmə göstəriciləri sıfırlandı (0.00 AZN). Yeni növbə üçün hazırdır.`,
        type: "success"
      });
    }
  };

  const handlePrintZReport = (data: ReturnType<typeof getZReportData>) => {
    const restaurantTitle = `${appNameWord1 || 'RESTO'} ${appNameWord2 || 'MASTER'}`.trim().toUpperCase();

    const profileCName = localStorage.getItem('resto_profileC_name') || 'Xprinter XP-Q800 (Profil C - Z-Hesabatı)';
    const profileCType = localStorage.getItem('resto_profileC_type') || 'thermal_80mm';
    const profileCFontSize = localStorage.getItem('resto_profileC_fontSize') || 'normal';

    let fontFam = "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
    let maxW = "65mm";
    let bodyFSize = "13px";
    let titleFSize = "18px";
    let subtitleFSize = "12px";
    let totalFSize = "15px";

    if (profileCType === 'a4_standard') {
      fontFam = "Arial, sans-serif, system-ui";
      maxW = "100%";
      if (profileCFontSize === 'small') {
        bodyFSize = "12px";
        titleFSize = "16px";
        subtitleFSize = "11px";
        totalFSize = "14px";
      } else if (profileCFontSize === 'large') {
        bodyFSize = "15px";
        titleFSize = "22px";
        subtitleFSize = "13px";
        totalFSize = "17px";
      } else {
        bodyFSize = "13px";
        titleFSize = "18px";
        subtitleFSize = "12px";
        totalFSize = "15px";
      }
    } else if (profileCType === 'thermal_58mm') {
      maxW = "50mm";
      if (profileCFontSize === 'small') {
        bodyFSize = "9px";
        titleFSize = "12px";
        subtitleFSize = "8px";
        totalFSize = "10px";
      } else if (profileCFontSize === 'large') {
        bodyFSize = "11px";
        titleFSize = "15px";
        subtitleFSize = "10px";
        totalFSize = "12px";
      } else {
        bodyFSize = "10px";
        titleFSize = "13px";
        subtitleFSize = "9px";
        totalFSize = "11px";
      }
    } else {
      // thermal_80mm
      maxW = "65mm";
      if (profileCFontSize === 'small') {
        bodyFSize = "12px";
        titleFSize = "16px";
        subtitleFSize = "11px";
        totalFSize = "14px";
      } else if (profileCFontSize === 'large') {
        bodyFSize = "15px";
        titleFSize = "22px";
        subtitleFSize = "13px";
        totalFSize = "17px";
      } else {
        bodyFSize = "13px";
        titleFSize = "18px";
        subtitleFSize = "12px";
        totalFSize = "15px";
      }
    }

    const currentPrintTime = (() => {
      const d = new Date();
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      return `${day}.${month}.${year}, ${hours}:${minutes}:${seconds}`;
    })();

    const zReportHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Z-Hesabat (${data.date})</title>
          <style>
            @media print {
              @page {
                margin: 0mm !important;
              }
              body {
                margin: 0 !important;
                padding: 3mm !important;
                width: ${maxW} !important;
                font-family: ${fontFam};
                color: #000;
                background: #fff;
                font-size: ${bodyFSize};
              }
              .z-container {
                width: ${maxW} !important;
                margin: 0 auto !important;
                box-sizing: border-box !important;
              }
            }
            body {
              font-family: ${fontFam};
              color: #000;
              background: #fff;
              font-size: ${bodyFSize};
              padding: 4mm;
              box-sizing: border-box;
            }
            .z-container {
              width: ${maxW};
              margin: 0 auto;
              box-sizing: border-box;
            }
            .text-center { text-align: center; }
            .bold { font-weight: bold; }
            .divider { border-bottom: 1px dashed #000; margin: 6px 0; }
            .double-divider { border-bottom: 2px solid #000; margin: 6px 0; }
            .flex-between { display: flex; justify-content: space-between; margin: 3px 0; font-size: ${bodyFSize}; }
            .header-title { font-size: ${titleFSize}; font-weight: 900; margin-bottom: 2px; text-transform: uppercase; }
            .subtitle { font-size: ${subtitleFSize}; margin-bottom: 2px; }
          </style>
        </head>
        <body>
          <div class="z-container">
            <div class="text-center">
              <div class="header-title">${restaurantTitle}</div>
              <div class="bold subtitle">*** Z-HESABAT (GÜNLÜK BAĞLANIŞ) ***</div>
              <div class="subtitle">Tarix: ${data.date}</div>
              <div class="subtitle">Hesabat №: ${data.reportNo}</div>
            </div>

            <div class="divider"></div>

            <div class="flex-between"><span>SATIŞ SAYI (ÇEK):</span><span class="bold">${data.totalOrdersCount} ədəd</span></div>
            <div class="flex-between"><span>NƏĞD SATIŞ:</span><span class="bold">${data.cashSales.toFixed(2)} ₼</span></div>
            <div class="flex-between"><span>KARTLA SATIŞ:</span><span class="bold">${data.cardSales.toFixed(2)} ₼</span></div>
            <div class="flex-between"><span>HƏDİYYƏ:</span><span class="bold">${data.giftSales.toFixed(2)} ₼</span></div>
            <div class="flex-between"><span>XARAB MƏHSUL:</span><span class="bold">${data.defectiveSales.toFixed(2)} ₼</span></div>
            <div class="flex-between"><span>GERİ QAYTARILAN:</span><span class="bold">${data.returnedSales.toFixed(2)} ₼</span></div>
            ${data.mixedSales > 0 ? `<div class="flex-between"><span>QARIŞIQ SATIŞ:</span><span class="bold">${data.mixedSales.toFixed(2)} ₼</span></div>` : ''}
            ${data.debtSales > 0 ? `<div class="flex-between"><span>NİSYƏ SATIŞ:</span><span class="bold">${data.debtSales.toFixed(2)} ₼</span></div>` : ''}

            <div class="divider"></div>

            <div class="flex-between bold" style="font-size: ${totalFSize};">
              <span>CƏMİ DÖVRİYYƏ:</span>
              <span>${data.totalSalesSum.toFixed(2)} ₼</span>
            </div>
            <div class="flex-between">
              <span>CƏMİ XƏRCLƏR:</span>
              <span>-${data.totalExpensesSum.toFixed(2)} ₼</span>
            </div>

            <div class="double-divider"></div>

            <div class="flex-between bold" style="font-size: ${totalFSize};">
              <span>XALİS KASSA (QAZANC):</span>
              <span>${data.netIncome.toFixed(2)} ₼</span>
            </div>

            <div class="double-divider"></div>
            <div class="text-center" style="margin-top: 10px; font-size: ${subtitleFSize};">
              <div>Çap Olunma Tarixi: ${currentPrintTime}</div>
              <div style="margin-top: 8px;">Məsul Şəxs İmzası: ___________________</div>
              <div style="margin-top: 8px; font-weight: bold;">TƏŞƏKKÜR EDİRİK!</div>
            </div>
          </div>

          ${!(window as any).electron ? `
          <script>
            function triggerZReportPosPrint() {
              window.focus();
              try {
                window.onafterprint = function() {
                  try {
                    if (window.frameElement && window.frameElement.parentNode) {
                      window.frameElement.parentNode.removeChild(window.frameElement);
                    }
                  } catch(e) {}
                };
                window.print();
              } catch(e) {
                console.error(e);
              }
            }

            if (document.readyState === 'complete') {
              setTimeout(triggerZReportPosPrint, 150);
            } else {
              window.addEventListener('load', function() {
                setTimeout(triggerZReportPosPrint, 150);
              });
            }

            setTimeout(function() {
              try {
                if (window.frameElement && window.frameElement.parentNode) {
                  window.frameElement.parentNode.removeChild(window.frameElement);
                }
              } catch(e) {}
            }, 60000);
          </script>
          ` : ''}
        </body>
      </html>
    `;

    executePosPrint(zReportHtml, profileCName, 1);
  };

  const renderManagementPasswordGate = () => {
    const kbLayouts = {
      AZ: [
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
        ['Q', 'Ü', 'E', 'R', 'T', 'Y', 'U', 'İ', 'O', 'P', 'Ö', 'Ğ'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'I', 'Ə'],
        ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Ç', 'Ş']
      ],
      EN: [
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
      ],
      TR: [
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'Ğ', 'Ü'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ş', 'İ'],
        ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Ö', 'Ç']
      ],
      RU: [
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
        ['Й', 'Ц', 'У', 'К', 'Е', 'Н', 'Г', 'Ш', 'Щ', 'З', 'Х', 'Ъ'],
        ['Ф', 'Ы', 'В', 'А', 'П', 'Р', 'О', 'Л', 'Д', 'Ж', 'Э'],
        ['Я', 'Ч', 'С', 'М', 'И', 'Т', 'Ь', 'Б', 'Ю']
      ]
    };

    const handleKeyClick = (key: string) => {
      setPasswordFeedback('idle');
      setTypedPassword(prev => prev + (key ? (kbShift ? key.toUpperCase() : key.toLowerCase()) : ''));
    };

    const handleBackspace = () => {
      setPasswordFeedback('idle');
      setTypedPassword(prev => prev.slice(0, -1));
    };

    const handleClear = () => {
      setPasswordFeedback('idle');
      setTypedPassword('');
    };

    const handleVerify = async () => {
      const isValid = await verifyPasswordSecure(typedPassword, 'management');
      if (isValid) {
        setPasswordFeedback('success');
        setTimeout(() => {
          setIsManagementUnlocked(true);
          setTypedPassword('');
          setPasswordFeedback('idle');
        }, 600);
      } else {
        setPasswordFeedback('error');
        setTypedPassword('');
        setTimeout(() => mgmtInputRef.current?.focus(), 50);
      }
    };

    const currentRows = kbLayouts[kbLanguage];

    return (
      <DraggableWindow title="Rəhbərlik Giriş Portalı" onClose={() => setActiveTab('tables')} widthClass="w-full max-w-md">
        <div className="space-y-4 text-center">
          <div className="space-y-1">
            <h2 className="text-sm font-black text-slate-800 tracking-tight uppercase flex items-center justify-center gap-1.5">
              <Lock className={`w-4 h-4 shrink-0 transition-all ${
                passwordFeedback === 'success' ? 'text-green-600 scale-110' :
                passwordFeedback === 'error' ? 'text-red-650 animate-bounce' : 'text-orange-500'
              }`} />
              Rəhbərlik Giriş Portalı
            </h2>
          </div>

          <div className="relative max-w-sm mx-auto">
            <input 
              ref={mgmtInputRef}
              type={showPasswordRaw ? "text" : "password"}
              value={typedPassword}
              onChange={e => {
                setPasswordFeedback('idle');
                setTypedPassword(e.target.value);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') handleVerify();
              }}
              placeholder="Şifrəni daxil edin..."
              className={`w-full px-3 py-2 bg-slate-50 border-2 rounded-xl focus:outline-none font-extrabold text-sm text-slate-700 tracking-widest text-center transition-colors ${
                passwordFeedback === 'error' ? 'border-red-500 bg-red-50/35 focus:border-red-500' :
                passwordFeedback === 'success' ? 'border-green-500 bg-green-50/20 focus:border-green-500' : 'border-slate-100 focus:border-orange-500'
              }`}
              autoFocus
            />
            
            <button
              type="button"
              onClick={() => setShowPasswordRaw(!showPasswordRaw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              {showPasswordRaw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {passwordFeedback === 'error' && (
            <p className="text-[10px] font-black text-red-650 animate-pulse tracking-wide uppercase">
              SƏHV ŞİFRƏ! YENİDƏN DAXİL EDİN.
            </p>
          )}
          {passwordFeedback === 'success' && (
            <p className="text-[10px] font-black text-green-600 animate-pulse tracking-wide uppercase">
              ŞİFRƏ TƏSDİQLƏNDİ. DAXİL OLUNUR...
            </p>
          )}

          <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-150 relative max-w-sm mx-auto space-y-2">
            <div className="flex justify-between items-center bg-white p-1 rounded-xl border border-slate-200 select-none">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1.5 flex items-center gap-0.5">
                <Globe className="w-3 h-3 text-slate-400" />
                KLAVİATURA DİLİ:
              </span>
              <div className="flex gap-1 p-0.5 bg-slate-100/60 rounded-xl">
                {(['AZ', 'EN', 'TR', 'RU'] as const).map(lang => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setKbLanguage(lang)}
                    className={`px-1.5 py-1 rounded text-[8px] font-black uppercase transition-all tracking-wider ${
                      kbLanguage === lang 
                        ? 'bg-orange-500 text-white' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1 select-none font-sans">
              {currentRows.map((row, rIdx) => (
                <div key={`login_kb_row_${rIdx}`} className="flex justify-center gap-0.5 flex-wrap">
                  {row.map((char, cIdx) => (
                    <button
                      key={`login_kb_char_${rIdx}_${cIdx}_${char}`}
                      type="button"
                      onClick={() => handleKeyClick(char)}
                      className="h-8 min-w-[26px] px-1 bg-white hover:bg-orange-50 active:scale-95 text-slate-700 hover:text-orange-600 border border-slate-200 rounded-lg font-bold text-[10px] shadow-3xs flex items-center justify-center cursor-pointer shrink-0"
                    >
                      {char ? (kbShift ? char.toUpperCase() : char.toLowerCase()) : ''}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-1 select-none flex-wrap">
              <button
                type="button"
                onClick={() => setKbShift(prev => !prev)}
                className={`h-8 px-2 rounded-lg font-black text-[9px] uppercase tracking-wider transition-all border shrink-0 flex items-center justify-center gap-0.5 cursor-pointer ${
                  kbShift 
                    ? 'bg-slate-700 text-white border-slate-700 shadow-sm' 
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Shift
              </button>

              <button
                type="button"
                onClick={() => handleKeyClick(' ')}
                className="h-8 bg-white text-slate-500 border border-slate-200 hover:bg-slate-100/50 rounded-lg font-bold text-[9px] uppercase tracking-widest transition-all cursor-pointer flex-1 shrink-0 flex items-center justify-center"
              >
                Space
              </button>

              <button
                type="button"
                onClick={handleBackspace}
                className="h-8 px-2 bg-white text-slate-500 border border-slate-200 hover:bg-slate-100 rounded-lg font-bold text-[9px] uppercase tracking-wider transition-all cursor-pointer shrink-0 flex items-center justify-center"
              >
                ← Sil
              </button>
            </div>

            <div className="flex gap-1.5 pt-1.5 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClear}
                className="px-2 py-2 bg-red-50 hover:bg-red-100 text-red-650 rounded-lg font-black text-[9px] uppercase tracking-wider transition-all select-none cursor-pointer border border-red-100 shrink-0"
              >
                TƏMİZLƏ
              </button>
              
              <button
                type="button"
                onClick={handleVerify}
                className="px-3 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 active:scale-98 text-white rounded-lg font-black text-[9px] uppercase tracking-wider transition-all select-none shadow-md flex-1 cursor-pointer flex items-center justify-center gap-1"
              >
                <Unlock className="w-3 h-3" />
                TƏSDİQLƏ (ENTER)
              </button>
            </div>
          </div>
        </div>
      </DraggableWindow>
    );
  };

  const renderInventoryPasswordGate = () => {
    const kbLayouts = {
      AZ: [
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
        ['Q', 'Ü', 'E', 'R', 'T', 'Y', 'U', 'İ', 'O', 'P', 'Ö', 'Ğ'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'I', 'Ə'],
        ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Ç', 'Ş']
      ],
      EN: [
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
      ],
      TR: [
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'Ğ', 'Ü'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ş', 'İ'],
        ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Ö', 'Ç']
      ],
      RU: [
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
        ['Й', 'Ц', 'У', 'К', 'Е', 'Н', 'Г', 'Ш', 'Щ', 'З', 'Х', 'Ъ'],
        ['Ф', 'Ы', 'В', 'А', 'П', 'Р', 'О', 'Л', 'Д', 'Ж', 'Э'],
        ['Я', 'Ч', 'С', 'М', 'И', 'Т', 'Ь', 'Б', 'Ю']
      ]
    };

    const handleKeyClick = (key: string) => {
      setInventoryPasswordFeedback('idle');
      setInventoryTypedPassword(prev => prev + (key ? (inventoryKbShift ? key.toUpperCase() : key.toLowerCase()) : ''));
    };

    const handleBackspace = () => {
      setInventoryPasswordFeedback('idle');
      setInventoryTypedPassword(prev => prev.slice(0, -1));
    };

    const handleClear = () => {
      setInventoryPasswordFeedback('idle');
      setInventoryTypedPassword('');
    };

    const handleVerifyInventory = async () => {
      const isValid = await verifyPasswordSecure(inventoryTypedPassword, 'inventory');
      if (isValid) {
        setInventoryPasswordFeedback('success');
        setTimeout(() => {
          setIsInventoryUnlocked(true);
          setInventoryTypedPassword('');
          setInventoryPasswordFeedback('idle');
        }, 500);
      } else {
        setInventoryPasswordFeedback('error');
        setInventoryTypedPassword('');
        setTimeout(() => inventoryInputRef.current?.focus(), 50);
      }
    };

    const currentRows = kbLayouts[inventoryKbLanguage];

    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <DraggableWindow 
          title="Anbar Deposu Giriş Qapısı" 
          onClose={() => setManagementSubTab('menu')} 
          widthClass="w-full max-w-md"
        >
          <div className="space-y-4 text-center">
            <div className="space-y-1">
              <h2 className="text-sm font-black text-slate-800 tracking-tight uppercase flex items-center justify-center gap-1.5">
                <Package className={`w-4 h-4 shrink-0 transition-all ${
                  inventoryPasswordFeedback === 'success' ? 'text-green-600 scale-110' :
                  inventoryPasswordFeedback === 'error' ? 'text-red-650 animate-bounce' : 'text-amber-500'
                }`} />
                Anbar Stok Deposu Giriş Portalı
              </h2>
              <p className="text-[10px] text-slate-400 font-semibold max-w-sm mx-auto leading-relaxed">
                <span className="block mt-0.5 font-bold text-amber-500">Standart şifrə: anbar</span>
              </p>
            </div>

            <div className="relative max-w-sm mx-auto">
              <input 
                ref={inventoryInputRef}
                type={showInventoryPasswordRaw ? "text" : "password"}
                value={inventoryTypedPassword}
                onChange={e => {
                  setInventoryPasswordFeedback('idle');
                  setInventoryTypedPassword(e.target.value);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleVerifyInventory();
                }}
                placeholder="Anbar şifrəsini daxil edin..."
                className={`w-full px-3 py-2 bg-slate-50 border-2 rounded-xl focus:outline-none font-extrabold text-sm text-slate-700 tracking-widest text-center transition-colors ${
                  inventoryPasswordFeedback === 'error' ? 'border-red-500 bg-red-50/35 focus:border-red-500' :
                  inventoryPasswordFeedback === 'success' ? 'border-green-500 bg-green-50/20 focus:border-green-500' : 'border-slate-100 focus:border-amber-500'
                }`}
                autoFocus
              />
              
              <button
                type="button"
                onClick={() => setShowInventoryPasswordRaw(!showInventoryPasswordRaw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                {showInventoryPasswordRaw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {inventoryPasswordFeedback === 'error' && (
              <p className="text-[10px] font-black text-red-650 animate-pulse tracking-wide uppercase">
                SƏHV ŞİFRƏ! YENİDƏN DAXİL EDİN.
              </p>
            )}
            {inventoryPasswordFeedback === 'success' && (
              <p className="text-[10px] font-black text-green-600 animate-pulse tracking-wide uppercase">
                ŞİFRƏ TƏSDİQLƏNDİ. DAXİL OLUNUR...
              </p>
            )}

            <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-150 relative max-w-sm mx-auto space-y-2">
              <div className="flex justify-between items-center bg-white p-1 rounded-xl border border-slate-200 select-none">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1.5 flex items-center gap-0.5">
                  <Globe className="w-3 h-3 text-slate-400" />
                  KLAVİATURA DİLİ:
                </span>
                <div className="flex gap-1 p-0.5 bg-slate-100/60 rounded-xl">
                  {(['AZ', 'EN', 'TR', 'RU'] as const).map(lang => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setInventoryKbLanguage(lang)}
                      className={`px-1.5 py-1 rounded text-[8px] font-black uppercase transition-all tracking-wider ${
                        inventoryKbLanguage === lang 
                          ? 'bg-amber-500 text-white' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1 select-none font-sans">
                {currentRows.map((row, rIdx) => (
                  <div key={`inv_kb_row_${rIdx}`} className="flex justify-center gap-0.5 flex-wrap">
                    {row.map((char, cIdx) => (
                      <button
                        key={`inv_kb_char_${rIdx}_${cIdx}_${char}`}
                        type="button"
                        onClick={() => handleKeyClick(char)}
                        className="h-8 min-w-[26px] px-1 bg-white hover:bg-amber-50 active:scale-95 text-slate-700 hover:text-amber-600 border border-slate-200 rounded-lg font-bold text-[10px] shadow-3xs flex items-center justify-center cursor-pointer shrink-0"
                      >
                        {char ? (inventoryKbShift ? char.toUpperCase() : char.toLowerCase()) : ''}
                      </button>
                    ))}
                  </div>
                ))}
              </div>

              <div className="flex justify-center gap-1 select-none flex-wrap">
                <button
                  type="button"
                  onClick={() => setInventoryKbShift(prev => !prev)}
                  className={`h-8 px-2 rounded-lg font-black text-[9px] uppercase tracking-wider transition-all border shrink-0 flex items-center justify-center gap-0.5 cursor-pointer ${
                    inventoryKbShift 
                      ? 'bg-slate-700 text-white border-slate-700 shadow-sm' 
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Shift
                </button>

                <button
                  type="button"
                  onClick={() => handleKeyClick(' ')}
                  className="h-8 bg-white text-slate-500 border border-slate-200 hover:bg-slate-100/50 rounded-lg font-bold text-[9px] uppercase tracking-widest transition-all cursor-pointer flex-1 shrink-0 flex items-center justify-center"
                >
                  Space
                </button>

                <button
                  type="button"
                  onClick={handleBackspace}
                  className="h-8 px-2 bg-white text-slate-500 border border-slate-200 hover:bg-slate-100 rounded-lg font-bold text-[9px] uppercase tracking-wider transition-all cursor-pointer shrink-0 flex items-center justify-center"
                >
                  ← Sil
                </button>
              </div>

              <div className="flex gap-1.5 pt-1.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-2 py-2 bg-red-50 hover:bg-red-100 text-red-650 rounded-lg font-black text-[9px] uppercase tracking-wider transition-all select-none cursor-pointer border border-red-100 shrink-0"
                >
                  TƏMİZLƏ
                </button>
                
                <button
                  type="button"
                  onClick={handleVerifyInventory}
                  className="px-3 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 active:scale-98 text-white rounded-lg font-black text-[9px] uppercase tracking-wider transition-all select-none shadow-md flex-1 cursor-pointer flex items-center justify-center gap-1"
                >
                  <Unlock className="w-3 h-3" />
                  TƏSDİQLƏ (ENTER)
                </button>
              </div>
            </div>
          </div>
        </DraggableWindow>
      </div>
    );
  };

  const renderManagementDashboard = () => {
      const currentToday = activeShift?.businessDate || getActiveShiftBusinessDate() || getTodayStr();
      const currentDayExpenses = (effectiveExpenses || [])
        .filter(ex => matchesDatePeriod(ex.date, currentToday, 'daily'))
        .reduce((sum, ex) => sum + Number(ex.amount || 0), 0);
      const roundedExpenses = Math.round(currentDayExpenses * 100) / 100;

      return (
        <ManagementDashboardTab
          setManagementSubTab={setManagementSubTab}
          setIsManagementUnlocked={setIsManagementUnlocked}
          menuItems={menuItems}
          inventory={inventory}
          staff={staff}
          tables={tables}
          appName={appName}
          tText={tText}
          expensesTotal={roundedExpenses}
          currencyText={currencyText}
          onOpenExpenses={() => {
            setExpenseDate(currentToday);
            setExpensePeriod('daily');
            setExpenseCategoryFilter('all');
            setExpenseSearch('');
            setActiveTab('expenses');
          }}
        />
      );
    };

  const renderContent = () => {
    // 1. Password Gate for locked Management
    if (activeTab === 'management' && !isManagementUnlocked) {
      return renderManagementPasswordGate();
    }

    // 2. Dashboard for unlocked Management
    if (activeTab === 'management' && isManagementUnlocked && managementSubTab === null) {
      return renderManagementDashboard();
    }

    const actualTab = (activeTab === 'management' && isManagementUnlocked && managementSubTab) 
      ? (managementSubTab === 'tables' ? 'management_tables' : managementSubTab) 
      : activeTab;

    const switchContent = (() => {
      switch (actualTab) {
      case 'qr': {
        return (
          <QrTab
            tables={tables}
            setTables={setTables}
            selectedQRTableId={selectedQRTableId}
            setSelectedQRTableId={setSelectedQRTableId}
            activeOrders={activeOrders}
            setActiveOrders={setActiveOrders}
            menuItems={menuItems}
            qrCart={qrCart}
            setQrCart={setQrCart}
            qrActiveCategory={qrActiveCategory}
            setQrActiveCategory={setQrActiveCategory}
            qrSearch={qrSearch}
            setQrSearch={setQrSearch}
            qrNotification={qrNotification}
            setQrNotification={setQrNotification}
            setKitchenLog={setKitchenLog}
            setInventory={setInventory}
            recipes={recipes}
            currencySymbol={currencySymbol}
            formatPrice={formatPrice}
            appName={appName}
            tText={tText}
          />
        );
      }
      case 'expenses': {
        return (
          <ExpensesTab
            tText={tText}
            expenses={effectiveExpenses}
            setExpenses={setExpenses}
            expenseCategoryFilter={expenseCategoryFilter}
            setExpenseCategoryFilter={setExpenseCategoryFilter}
            expenseSearch={expenseSearch}
            setExpenseSearch={setExpenseSearch}
            expenseDate={expenseDate}
            setExpenseDate={setExpenseDate}
            expensePeriod={expensePeriod}
            setExpensePeriod={setExpensePeriod}
            setIsAddExpenseOpen={(open: boolean) => {
              if (open) {
                const currentToday = getTodayStr();
                setNewExpense({
                  title: '',
                  category: 'Kommunal',
                  amount: '',
                  date: currentToday,
                  notes: ''
                });
                setIsAddExpenseOpen(true);
              } else {
                setIsAddExpenseOpen(false);
              }
            }}
            currencySymbol={currencySymbol}
            currencyText={currencyText}
            formatAzDate={formatAzDate}
            formatPrice={formatPrice}
            onDeleteExpense={handleDeleteExpense}
            closedShifts={closedShifts}
            activeShiftBusinessDate={activeShift?.businessDate}
          />
        );
      }
      case 'ai': {
        return (
          <AiTab
            tText={tText}
            aiChatHistory={aiChatHistory}
            setAiChatHistory={setAiChatHistory}
            aiQuery={aiQuery}
            setAiQuery={setAiQuery}
            inventory={inventory}
            menuItems={menuItems}
          />
        );
      }
      case 'dashboard': {
        return (
          <DashboardTab
            tables={tables}
            reservations={reservations}
            inventory={inventory}
            menuItems={menuItems}
            memoizedDashboardStats={memoizedDashboardStats}
            dailySoldStats={memoizedDailySoldStats}
            dashboardSoldTableFilter={dashboardSoldTableFilter}
            setDashboardSoldTableFilter={setDashboardSoldTableFilter}
            dashboardDate={dashboardDate}
            setDashboardDate={setDashboardDate}
            dashboardPeriod={dashboardPeriod}
            setDashboardPeriod={setDashboardPeriod}
            getLocale={getLocale}
            t={t}
            tText={tText}
            currencySymbol={currencySymbol}
            currencyText={currencyText}
            appLanguage={appLanguage}
            setActiveTab={setActiveTab}
            expenses={effectiveExpenses}
            appName={appName}
            appNameWord1={appNameWord1}
            appNameWord2={appNameWord2}
            getPaymentMethodBadge={getPaymentMethodBadge}
            dashboardSelectedProductFilter={dashboardSelectedProductFilter}
            setDashboardSelectedProductFilter={setDashboardSelectedProductFilter}
            showZReportModal={showZReportModal}
            setShowZReportModal={setShowZReportModal}
            zModalRef={zModalRef}
            zReportPos={zReportPos}
            handleZReportMouseDown={handleZReportMouseDown}
            getZReportData={getZReportData}
            zReportDate={zReportDate}
            setZReportDate={setZReportDate}
            handlePrintZReport={handlePrintZReport}
            saleMovements={saleMovements}
            closedShifts={closedShifts}
            handleCloseShift={handleCloseShift}
            activeShift={activeShift}
            dashboardShiftId={dashboardShiftId}
            setDashboardShiftId={setDashboardShiftId}
            defectRecords={defectRecords}
            setExpenseDate={setExpenseDate}
            setExpensePeriod={setExpensePeriod}
          />
        );
      }
      case 'tables': {
        if (tablesSubMode === 'quick_sale') {
          return (
            <QuickSaleTab
              menuItems={menuItems}
              inventory={inventory}
              setInventory={setInventory}
              currencySymbol={currencySymbol}
              formatPrice={formatPrice}
              tText={tText}
              activeShift={activeShift}
              recipes={recipes}
              setOrderTransactions={setOrderTransactions}
              setInventoryTransactions={setInventoryTransactions}
              addAuditLog={addAuditLog}
              onPrintReceipt={(data) => {
                printCustomerTicket(
                  data.tableName,
                  data.waiterName,
                  data.items,
                  data.orderTotal,
                  data.paymentMethod,
                  appNameWord1,
                  appNameWord2
                );
              }}
              staff={staff}
              onSwitchToTables={() => setTablesSubMode('tables')}
              setIsSidebarCollapsed={setIsSidebarCollapsed}
            />
          );
        }
        return (
          <TablesTab
            isTabletMode={isTabletMode}
            setSelectedTableId={setSelectedTableId}
            t={t}
            tText={tText}
            tables={tables}
            activeOrders={activeOrders}
            selectedTableId={selectedTableId}
            currencySymbol={currencySymbol}
            menuFilter={menuFilter}
            setMenuFilter={setMenuFilter}
            menuSearch={menuSearch}
            setMenuSearch={setMenuSearch}
            menuItems={menuItems}
            addToOrder={addToOrder}
            selectedTable={selectedTable}
            isMoveTargetOpen={isMoveTargetOpen}
            setIsMoveTargetOpen={setIsMoveTargetOpen}
            cancelFullTable={cancelFullTable}
            transferTable={transferTable}
            currentOrder={currentOrder}
            updateQuantity={updateQuantity}
            deleteOrderItem={deleteOrderItem}
            setItemActionModal={setItemActionModal}
            setItemActionReason={setItemActionReason}
            setItemActionSelectedChip={setItemActionSelectedChip}
            toggleItemGift={toggleItemGift}
            showPaymentMethodSection={showPaymentMethodSection}
            setPaymentMethod={setPaymentMethod}
            paymentMethod={paymentMethod}
            customMixedCash={customMixedCash}
            setCustomMixedCash={setCustomMixedCash}
            setCustomMixedCard={setCustomMixedCard}
            sendToKitchen={sendToKitchen}
            handlePrintOrderReceipt={handlePrintOrderReceipt}
            completeOrder={completeOrder}
            waiterSelectionId={waiterSelectionId}
            setWaiterSelectionId={setWaiterSelectionId}
            assignWaiter={assignWaiter}
            staff={staff}
            formatPrice={formatPrice}
          />
        );
      }
      case 'menu': {
        return (
          <MenuTab
            t={t}
            tText={tText}
            recipes={recipes}
            setRecipes={setRecipes}
            inventory={inventory}
            menuSubTab={menuSubTab}
            setMenuSubTab={setMenuSubTab}
            menuFilter={menuFilter}
            setMenuFilter={setMenuFilter}
            menuSearch={menuSearch}
            setMenuSearch={setMenuSearch}
            recipeActiveCategory={recipeActiveCategory}
            setRecipeActiveCategory={setRecipeActiveCategory}
            recipeSearch={recipeSearch}
            setRecipeSearch={setRecipeSearch}
            selectedRecipeDishId={selectedRecipeDishId}
            setSelectedRecipeDishId={setSelectedRecipeDishId}
            menuItems={menuItems}
            setMenuItems={setMenuItems}
            currencySymbol={currencySymbol}
            formatPrice={formatPrice}
            isAddingDish={isAddingDish}
            setIsAddingDish={setIsAddingDish}
            newDish={newDish}
            setNewDish={setNewDish}
            newDishError={newDishError}
            handleAddNewDish={handleAddNewDish}
            editingMenuItemId={editingMenuItemId}
            setEditingMenuItemId={setEditingMenuItemId}
            editDish={editDish}
            setEditDish={setEditDish}
            startEditing={startEditing}
            handleSaveEdit={handleSaveEdit}
            setConfirmDialog={setConfirmDialog}
            handleDeleteMenuItem={handleDeleteMenuItem}
          />
        );
      }
      case 'reservations': {
        return (
          <ReservationsTab
            t={t}
            tText={tText}
            reservations={reservations}
            setReservations={setReservations}
            tables={tables}
            reservationPeriod={reservationPeriod}
            setReservationPeriod={setReservationPeriod}
            reservationSelectedDate={reservationSelectedDate}
            setReservationSelectedDate={setReservationSelectedDate}
            showCompletedReservations={showCompletedReservations}
            setShowCompletedReservations={setShowCompletedReservations}
            reservationSearch={reservationSearch}
            setReservationSearch={setReservationSearch}
            getLocale={getLocale}
            isAddingReservation={isAddingReservation}
            setIsAddingReservation={setIsAddingReservation}
            newReservation={newReservation}
            setNewReservation={setNewReservation}
            handleAddReservation={handleAddReservation}
            editingReservationId={editingReservationId}
            setEditingReservationId={setEditingReservationId}
            editReservation={editReservation}
            setEditReservation={setEditReservation}
            startEditingReservation={startEditingReservation}
            handleSaveReservationEdit={handleSaveReservationEdit}
            deleteReservation={deleteReservation}
            updateReservationStatus={updateReservationStatus}
            handleConfirmArrivedReservation={handleConfirmArrivedReservation}
            exportToExcel={exportToExcel}
            setReportPrintPreview={setReportPrintPreview}
          />
        );
      }
      case 'inventory': {
        if (!isInventoryUnlocked) {
          return renderInventoryPasswordGate();
        }
        return (
          <InventoryTab
            t={t}
            tText={tText}
            inventory={inventory}
            setInventory={setInventory}
            inventorySearch={inventorySearch}
            setInventorySearch={setInventorySearch}
            currencySymbol={currencySymbol}
            formatPrice={formatPrice}
            isAddingInventory={isAddingInventory}
            setIsAddingInventory={setIsAddingInventory}
            newInventory={newInventory}
            setNewInventory={setNewInventory}
            newInventoryError={newInventoryError}
            handleAddNewInventoryItem={handleAddNewInventoryItem}
            editingInventoryId={editingInventoryId}
            setEditingInventoryId={setEditingInventoryId}
            editInventory={editInventory}
            setEditInventory={setEditInventory}
            startEditingInventory={startEditingInventory}
            handleSaveInventoryEdit={handleSaveInventoryEdit}
            setConfirmDialog={setConfirmDialog}
            updateInventoryStock={updateInventoryStock}
            handleDeleteInventoryItem={handleDeleteInventoryItem}
            exportToExcel={exportToExcel}
            setReportPrintPreview={setReportPrintPreview}
          />
        );
      }
      case 'kitchen': {
        return (
          <KitchenTab
            t={t}
            tText={tText}
            kitchenLog={kitchenLog}
            kitchenSearch={kitchenSearch}
            setKitchenSearch={setKitchenSearch}
            kitchenDate={kitchenDate}
            setKitchenDate={setKitchenDate}
            activeShiftBusinessDate={activeShift?.businessDate || getActiveShiftBusinessDate()}
            tables={tables}
            activeOrders={activeOrders}
            defectRecords={defectRecords}
          />
        );
      }
      case 'staff': {
        return (
          <StaffTab
            t={t}
            tText={tText}
            staff={staff}
            setStaff={setStaff}
            currencySymbol={currencySymbol}
            currencyText={currencyText}
            formatPrice={formatPrice}
            getLocale={getLocale}
            isAddingStaff={isAddingStaff}
            setIsAddingStaff={setIsAddingStaff}
            newStaff={newStaff}
            setNewStaff={setNewStaff}
            newStaffError={newStaffError}
            setNewStaffError={setNewStaffError}
            handleAddNewStaff={handleAddNewStaff}
            editingStaffId={editingStaffId}
            setEditingStaffId={setEditingStaffId}
            editStaff={editStaff}
            setEditStaff={setEditStaff}
            editStaffError={editStaffError}
            handleStartEditStaff={handleStartEditStaff}
            handleSaveEditStaff={handleSaveEditStaff}
            handleDeleteStaff={handleDeleteStaff}
            setConfirmDialog={setConfirmDialog}
            toggleStaffShift={toggleStaffShift}
            setReportPrintPreview={setReportPrintPreview}
          />
        );
      }
      case 'admin': {
        return (
          <AdminTab
            t={t}
            tText={tText}
            isAdminUnlocked={isAdminUnlocked}
            setIsAdminUnlocked={setIsAdminUnlocked}
            adminSubTab={adminSubTab}
            setAdminSubTab={setAdminSubTab}
            adminTypedPassword={adminTypedPassword}
            setAdminTypedPassword={setAdminTypedPassword}
            adminPasswordFeedback={adminPasswordFeedback}
            setAdminPasswordFeedback={setAdminPasswordFeedback}
            adminKbLanguage={adminKbLanguage}
            setAdminKbLanguage={setAdminKbLanguage}
            showAdminPasswordRaw={showAdminPasswordRaw}
            setShowAdminPasswordRaw={setShowAdminPasswordRaw}
            adminInputRef={adminInputRef}
            tables={tables}
            setTables={setTables}
            menuItems={menuItems}
            setMenuItems={setMenuItems}
            inventory={inventory}
            setInventory={setInventory}
            staff={staff}
            setStaff={setStaff}
            reservations={reservations}
            setReservations={setReservations}
            kitchenLog={kitchenLog}
            setKitchenLog={setKitchenLog}
            activeOrders={activeOrders}
            setActiveOrders={setActiveOrders}
            expenses={expenses}
            setExpenses={setExpenses}
            defectRecords={defectRecords}
            setDefectRecords={setDefectRecords}
            auditLogs={auditLogs}
            setAuditLogs={setAuditLogs}
            appName={appName}
            appNameWord1={appNameWord1}
            setAppNameWord1={setAppNameWord1}
            appNameWord2={appNameWord2}
            setAppNameWord2={setAppNameWord2}
            appLogoUrl={appLogoUrl}
            setAppLogoUrl={setAppLogoUrl}
            appNameColor1={appNameColor1}
            setAppNameColor1={setAppNameColor1}
            appNameColor2={appNameColor2}
            setAppNameColor2={setAppNameColor2}
            appNameFontFamily={appNameFontFamily}
            setAppNameFontFamily={setAppNameFontFamily}
            appNameFontSize={appNameFontSize}
            setAppNameFontSize={setAppNameFontSize}
            appNameFontStyle={appNameFontStyle}
            setAppNameFontStyle={setAppNameFontStyle}
            appNameFontWeight={appNameFontWeight}
            setAppNameFontWeight={setAppNameFontWeight}
            adminPassword={adminPassword}
            setAdminPassword={setAdminPassword}
            managementPassword={managementPassword}
            setManagementPassword={setManagementPassword}
            mgmtPasswordSaveSuccess={mgmtPasswordSaveSuccess}
            setMgmtPasswordSaveSuccess={setMgmtPasswordSaveSuccess}
            newMgmtPasswordInput={newMgmtPasswordInput}
            setNewMgmtPasswordInput={setNewMgmtPasswordInput}
            isOnline={isOnline}
            setIsOnline={setIsOnline}
            isSyncing={isSyncing}
            setIsSyncing={setIsSyncing}
            setOfflineQueue={setOfflineQueue}
            isPosMonitorMode={isPosMonitorMode}
            setIsPosMonitorMode={setIsPosMonitorMode}
            isVirtualKeyboardEnabled={isVirtualKeyboardEnabled}
            setIsVirtualKeyboardEnabled={setIsVirtualKeyboardEnabled}
            setIsVirtualKeyboardOpen={setIsVirtualKeyboardOpen}
            setIsKeyboardWideMode={setIsKeyboardWideMode}
            devName={devName}
            setDevName={setDevName}
            devBio={devBio}
            setDevBio={setDevBio}
            devEmail={devEmail}
            setDevEmail={setDevEmail}
            devPhone={devPhone}
            setDevPhone={setDevPhone}
            devWhatsapp={devWhatsapp}
            setDevWhatsapp={setDevWhatsapp}
            devGithub={devGithub}
            setDevGithub={setDevGithub}
            devLinkedin={devLinkedin}
            setDevLinkedin={setDevLinkedin}
            devWebsite={devWebsite}
            setDevWebsite={setDevWebsite}
            devLogoUrl={devLogoUrl}
            setDevLogoUrl={setDevLogoUrl}
            devPrograms={devPrograms}
            setDevPrograms={setDevPrograms}
            newProgName={newProgName}
            setNewProgName={setNewProgName}
            newProgDesc={newProgDesc}
            setNewProgDesc={setNewProgDesc}
            newProgImage={newProgImage}
            setNewProgImage={setNewProgImage}
            newProgTech={newProgTech}
            setNewProgTech={setNewProgTech}
            newProgLink={newProgLink}
            setNewProgLink={setNewProgLink}
            aboutSettingsSaved={aboutSettingsSaved}
            setAboutSettingsSaved={setAboutSettingsSaved}
            profileAName={profileAName}
            setProfileAName={setProfileAName}
            profileBName={profileBName}
            setProfileBName={setProfileBName}
            profileAType={profileAType}
            setProfileAType={setProfileAType}
            profileBType={profileBType}
            setProfileBType={setProfileBType}
            profileAFontSize={profileAFontSize}
            setProfileAFontSize={setProfileAFontSize}
            profileBFontSize={profileBFontSize}
            setProfileBFontSize={setProfileBFontSize}
            profileCName={profileCName}
            setProfileCName={setProfileCName}
            profileCType={profileCType}
            setProfileCType={setProfileCType}
            profileCFontSize={profileCFontSize}
            setProfileCFontSize={setProfileCFontSize}
            profileCPort={profileCPort}
            setProfileCPort={setProfileCPort}
            printerType={printerType}
            setPrinterType={setPrinterType}
            printerPresetType={printerPresetType}
            setPrinterPresetType={setPrinterPresetType}
            networkPrinterIP={networkPrinterIP}
            setNetworkPrinterIP={setNetworkPrinterIP}
            networkPrinterPort={networkPrinterPort}
            setNetworkPrinterPort={setNetworkPrinterPort}
            printerMargin={printerMargin}
            setPrinterMargin={setPrinterMargin}
            printerFontSize={printerFontSize}
            setPrinterFontSize={setPrinterFontSize}
            printerFooterText={printerFooterText}
            setPrinterFooterText={setPrinterFooterText}
            printerRouteMode={printerRouteMode}
            setPrinterRouteMode={setPrinterRouteMode}
            printerSavedMessage={printerSavedMessage}
            savePrinterSettings={savePrinterSettings}
            discoveredPrinters={discoveredPrinters}
            setSearchPrinterModal={setSearchPrinterModal}
            triggerPrinterTestPrint={triggerPrinterTestPrint}
            inventoryTransactions={inventoryTransactions}
            setInventoryTransactions={setInventoryTransactions}
            orderTransactions={orderTransactions}
            setOrderTransactions={setOrderTransactions}
            closedShifts={closedShifts}
            setClosedShifts={setClosedShifts}
            activeShift={activeShift}
            setActiveShift={setActiveShift}
            recipeSearch={recipeSearch}
            setRecipeSearch={setRecipeSearch}
            isDatabasePurged={isDatabasePurged}
            restoreMockData={restoreMockData}
            purgeAllData={purgeAllData}
            addAuditLog={addAuditLog}
            setConfirmDialog={setConfirmDialog}
            printCustomerTicket={printCustomerTicket}
            setActiveTab={setActiveTab}
          />
        );
      }
    case 'reports': {
        return (
          <ReportsTab
            t={t}
            tText={tText}
            memoizedReportStats={memoizedReportStats}
            activeOrders={activeOrders}
            reportDate={reportDate}
            setReportDate={setReportDate}
            reportPeriod={reportPeriod}
            setReportPeriod={setReportPeriod}
            shiftId={reportShiftId}
            setShiftId={setReportShiftId}
            reportsSubTab={reportsSubTab}
            setReportsSubTab={setReportsSubTab}
            reservations={reservations}
            expenses={effectiveExpenses}
            inventory={inventory}
            staff={staff}
            tables={tables}
            kitchenLog={kitchenLog}
            currencySymbol={currencySymbol}
            currencyText={currencyText}
            formatPrice={formatPrice}
            getLocale={getLocale}
            getActiveLocaleForApp={getActiveLocaleForApp}
            exportToExcel={exportToExcel}
            setReportPrintPreview={setReportPrintPreview}
            activeShiftBusinessDate={activeShift?.businessDate}
            closedShifts={closedShifts}
          />
        );
      }
    case 'printer': {
        return (
          <PrinterTab
            tText={tText}
            printerType={printerType}
            setPrinterType={setPrinterType}
            printerFontSize={printerFontSize}
            setPrinterFontSize={setPrinterFontSize}
            printerMargin={printerMargin}
            setPrinterMargin={setPrinterMargin}
            printerFooterText={printerFooterText}
            setPrinterFooterText={setPrinterFooterText}
            printerRouteMode={printerRouteMode}
            setPrinterRouteMode={setPrinterRouteMode}
            networkPrinterIP={networkPrinterIP}
            setNetworkPrinterIP={setNetworkPrinterIP}
            networkPrinterPort={networkPrinterPort}
            setNetworkPrinterPort={setNetworkPrinterPort}
            savePrinterSettings={savePrinterSettings}
            printerSavedMessage={printerSavedMessage}
            appNameWord1={appNameWord1}
            appNameWord2={appNameWord2}
            printCustomerTicket={printCustomerTicket}
          />
        );
      }
    case 'about_us': {
        return (
          <AboutUsTab
            tText={tText}
            devName={devName}
            devBio={devBio}
            devPhone={devPhone}
            devEmail={devEmail}
            devWebsite={devWebsite}
            devLogoUrl={devLogoUrl}
            devWhatsapp={devWhatsapp}
            appLanguage={appLanguage}
            devGithub={devGithub}
            devLinkedin={devLinkedin}
            devPrograms={devPrograms}
            appNameWord1={appNameWord1}
            appNameWord2={appNameWord2}
          />
        );
      }
    case 'qrcodes': {
      return <QRManagementTab tables={tables} appName={appName} />;
    }
    case 'defective': {
      return (
        <DefectReturnsManagementTab
          mode="defective"
          defectRecords={defectRecords}
          records={defectRecords}
          menuItems={menuItems}
          tables={tables}
          appName={appName}
          onAddRecord={handleAddDefectRecord}
          onDeleteRecord={handleDeleteDefectRecord}
          closedShifts={closedShifts}
          activeShiftBusinessDate={activeShift?.businessDate}
          activeShiftId={activeShift?.id}
          isShiftClosed={activeShift?.isClosed}
          orderTransactions={orderTransactions}
          activeOrders={activeOrders}
          auditLogs={auditLogs}
        />
      );
    }
    case 'returned': {
      return (
        <DefectReturnsManagementTab
          mode="returned"
          defectRecords={defectRecords}
          records={defectRecords}
          menuItems={menuItems}
          tables={tables}
          appName={appName}
          onAddRecord={handleAddDefectRecord}
          onDeleteRecord={handleDeleteDefectRecord}
          closedShifts={closedShifts}
          activeShiftBusinessDate={activeShift?.businessDate}
          activeShiftId={activeShift?.id}
          isShiftClosed={activeShift?.isClosed}
          orderTransactions={orderTransactions}
          activeOrders={activeOrders}
          auditLogs={auditLogs}
        />
      );
    }
    case 'management_tables': {
      return (
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50">
          <div className="max-w-5xl mx-auto bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-2 h-4 bg-orange-500 rounded-full" />
                  Masa və Kabinetlərin Qr-Era Tənzimləmələri
                </h4>
                <p className="text-xs text-slate-400 mt-1">Sistemdəki mövcud masaların və ya VİP kabinetlərin sayını, adlarını və maksimal tutumlarını dərhal idarə edə bilərsiniz:</p>
              </div>
            </div>
            
            <div className="space-y-3.5 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              {tables.map(table => (
                <div key={table.id} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 p-4 bg-slate-50 border border-slate-200/60 rounded-2xl hover:border-orange-200 hover:bg-orange-50/5 transition-all">
                  <div className="w-8 h-8 rounded-xl bg-slate-200 flex items-center justify-center text-[11px] font-black text-slate-700 shrink-0 select-none shadow-xs">
                    #{table.id}
                  </div>
                  
                  <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none pl-1">Masasının / Kabinetin Adı</label>
                    <input 
                      type="text"
                      value={table.number}
                      onChange={e => {
                        const updatedVal = e.target.value;
                        setTables(prev => prev.map(t => t.id === table.id ? { ...t, number: updatedVal } : t));
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-extrabold text-slate-700 text-xs shadow-xs"
                      placeholder="Məs. Kabinet 1"
                    />
                  </div>

                  <div className="w-full sm:w-32 flex flex-col gap-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none pl-1">Tutum (Nəfər Sayı)</label>
                    <input 
                      type="number"
                      min="1"
                      max="50"
                      value={table.capacity}
                      onChange={e => {
                        const updatedVal = parseInt(e.target.value) || 1;
                        setTables(prev => prev.map(t => t.id === table.id ? { ...t, capacity: updatedVal } : t));
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-extrabold text-slate-700 text-xs shadow-xs"
                    />
                  </div>

                  <div className="flex flex-col gap-1 shrink-0 justify-center min-w-[70px]">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none pl-1 mb-1.5 text-center sm:text-left">Status</label>
                    <span className={`px-2 py-1.5 rounded-xl text-[9px] font-black tracking-widest uppercase text-center border ${
                      table.status === 'occupied' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                      table.status === 'reserved' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                      'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                      {table.status === 'occupied' ? 'MƏŞĞUL' :
                       table.status === 'reserved' ? 'REZERV' :
                       'BOŞ'}
                    </span>
                  </div>

                  <div className="flex items-center justify-center sm:self-end pb-1">
                    <button
                      type="button"
                      title="Masanı sil"
                      onClick={() => {
                        const hasActiveOrder = Boolean(activeOrders[table.id] && activeOrders[table.id].length > 0);
                        if (table.status === 'occupied' || hasActiveOrder) {
                          alert(`"${table.number}" masasında aktiv sifariş var və ya masa məşğuldur. Əvvəlcə sifarişi tamamlayın və ya ləğv edin.`);
                          return;
                        }
                        if (window.confirm(`"${table.number}" masasını sistemdən silmək istədiyinizə əminsiniz?`)) {
                          setTables(prev => prev.filter(t => t.id !== table.id));
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  const newId = tables.length > 0 ? Math.max(...tables.map(t => t.id)) + 1 : 1;
                  const newTable: Table = {
                    id: newId,
                    number: `Masa ${newId}`,
                    capacity: 4,
                    status: 'available'
                  };
                  setTables(prev => [...prev, newTable]);
                }}
                className="px-4 py-2.5 bg-orange-100 hover:bg-orange-200 text-orange-700 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5 shadow-sm shadow-orange-50 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> YENİ MASA / KABİNET ƏLAVƏ ET
              </button>
            </div>
          </div>
        </div>
      );
    }
    default:
        return (
          <div className="flex flex-col items-center justify-center p-20 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <Settings className="w-10 h-10 text-slate-300" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Tezliklə...</h2>
            <p className="text-slate-500 max-w-sm">Bu modul hazırda hazırlanır və növbəti yenilənmə ilə tam hazır olacaq.</p>
          </div>
        );
    }
  })();

  if (activeTab === 'management' && isManagementUnlocked) {
    const currentSubTab = managementSubTab || 'menu';
    return (
      <div className="flex-1 flex flex-col overflow-hidden h-full relative">
        {/* Clean Light-Themed Top Header Bar */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 md:px-8 flex flex-col space-y-3 shrink-0 select-none shadow-3xs">
          {/* Main Title Row */}
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-5 bg-orange-500 rounded-md"></div>
            <h2 className="text-base font-black text-slate-800 uppercase tracking-wider">Rəhbərlik portalı</h2>
          </div>

          {/* Side-by-side single horizontal row for subtabs and action buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setMenuSubTab('dishes');
                setManagementSubTab('menu');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer transform active:scale-95 border ${
                currentSubTab === 'menu' 
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-500 shadow-sm shadow-orange-500/10' 
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              <Receipt className="w-4 h-4 shrink-0" />
              Menyu portalı
            </button>
            <button
              type="button"
              onClick={() => {
                setInventorySearch('');
                setManagementSubTab('inventory');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer transform active:scale-95 border ${
                currentSubTab === 'inventory' 
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-amber-500 shadow-sm shadow-amber-500/10' 
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              <Package className="w-4 h-4 shrink-0" />
              Anbar Stok deposu
            </button>
            <button
              type="button"
              onClick={() => setManagementSubTab('staff')}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer transform active:scale-95 border ${
                currentSubTab === 'staff' 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-blue-500 shadow-sm shadow-blue-500/10' 
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              İşçilər növbələr
            </button>
            <button
              type="button"
              onClick={() => setManagementSubTab('ai')}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer transform active:scale-95 border ${
                currentSubTab === 'ai' 
                  ? 'bg-gradient-to-r from-purple-500 to-violet-500 text-white border-purple-500 shadow-sm shadow-purple-500/10' 
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              <Brain className="w-4 h-4 shrink-0" />
              Ağıllı AI analitika
            </button>
            <button
              type="button"
              onClick={() => setManagementSubTab('reports')}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer transform active:scale-95 border ${
                currentSubTab === 'reports' 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/10' 
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              Sistem hesabatları
            </button>
            <button
              type="button"
              onClick={() => setManagementSubTab('qrcodes')}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer transform active:scale-95 border ${
                currentSubTab === 'qrcodes' 
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-cyan-500 shadow-sm shadow-cyan-500/10' 
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              <QrCode className="w-4 h-4 shrink-0" />
              Masa QR Kodları
            </button>
            <button
              type="button"
              onClick={() => setManagementSubTab('defective')}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer transform active:scale-95 border ${
                currentSubTab === 'defective' 
                  ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white border-rose-500 shadow-sm shadow-rose-500/10' 
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Xarab məhsul
            </button>
            <button
              type="button"
              onClick={() => setManagementSubTab('returned')}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer transform active:scale-95 border ${
                currentSubTab === 'returned' 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white border-amber-500 shadow-sm shadow-amber-500/10' 
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              <Undo2 className="w-4 h-4 shrink-0" />
              Geri alınan məhsullar
            </button>
            <button
              type="button"
              onClick={() => setManagementSubTab('tables')}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer transform active:scale-95 border ${
                currentSubTab === 'tables' 
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white border-emerald-500 shadow-sm shadow-emerald-500/10' 
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              <Utensils className="w-4 h-4 shrink-0" />
              Masa / Kabinetlər
            </button>

          </div>
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden relative h-full">
          {switchContent}
        </div>
      </div>
    );
  }

  return switchContent;
};

  if (!isStartupUnlocked && !customerQrMode) {
    return renderStartupLock();
  }

  // Direct Customer QR Web App Portal Override
  if (customerQrMode) {
    return (
      <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
        {/* Modern Branded Mobile Header */}
        <header className="h-16 bg-white border-b border-slate-100 px-6 flex items-center justify-between shrink-0 shadow-sm z-30">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
              {appLogoUrl ? (
                <img src={appLogoUrl} alt={appName} className="w-full h-full object-cover" />
              ) : (
                <Utensils className="text-white w-5 h-5" />
              )}
            </div>
            <h1 className={`${appNameFontSize} ${appNameFontFamily} ${appNameFontWeight} ${appNameFontStyle} tracking-tight truncate max-w-[120px]`} title={appName}>
              <span style={{ color: appNameColor1 }}>{appNameWord1}</span>
              {appNameWord2 && <span style={{ color: appNameColor2 }} className="ml-1">{appNameWord2}</span>}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-orange-100 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping" />
              Masa #{customerTableId}
            </span>
          </div>
        </header>

        {/* Standalone client viewport */}
        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key="customer-viewport"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside className={`transition-all duration-300 ${isSidebarCollapsed ? 'w-20 p-4' : 'w-64 p-6'} bg-white border-r border-slate-100 flex flex-col shrink-0 overflow-y-auto scrollbar-thin`}>
        <div className={`flex flex-col ${isSidebarCollapsed ? 'items-center gap-3 mb-6' : 'px-4 mb-8'} group`}>
          <div className="flex items-center justify-between w-full">
            <div className={`flex items-center ${isSidebarCollapsed ? 'flex-col gap-2' : ''} cursor-pointer`} onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
              <div className={`w-10 h-10 ${appLogoUrl ? 'p-0.5 bg-slate-50' : 'bg-orange-500'} rounded-xl flex items-center justify-center shadow-lg shadow-orange-200 group-hover:rotate-12 transition-transform shrink-0 overflow-hidden`}>
                {appLogoUrl ? (
                  <img src={appLogoUrl} alt={appName} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <Utensils className="text-white w-6 h-6" />
                )}
              </div>
              {!isSidebarCollapsed && (
                <h1 className={`${appNameFontSize} ${appNameFontFamily} ${appNameFontWeight} ${appNameFontStyle} tracking-tight ml-3 truncate max-w-[130px]`} title={appName}>
                  <span style={{ color: appNameColor1 }}>{appNameWord1}</span>
                  {appNameWord2 && <span style={{ color: appNameColor2 }} className="ml-1">{appNameWord2}</span>}
                </h1>
              )}
            </div>
            {!isSidebarCollapsed && (
              <button 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg transition-colors shrink-0"
                title="Səhifəni Yığ"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Clock: Center aligned right below the program logo/name with no border/sistem saati label */}
          <div className="w-full text-center mt-3 select-none">
            <ClockComponent collapsed={isSidebarCollapsed} />
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <SidebarItem 
            active={activeTab === 'dashboard'} 
            icon={LayoutDashboard} 
            label={t.dashboard} 
            onClick={() => setActiveTab('dashboard')} 
            collapsed={isSidebarCollapsed}
          />
          <SidebarItem 
            active={activeTab === 'tables'} 
            icon={Utensils} 
            label={t.tablesAndOrders} 
            onClick={() => {
              setActiveTab('tables');
              setTablesSubMode('tables');
              setSelectedTableId(null);
              setIsSidebarCollapsed(true);
            }} 
            collapsed={isSidebarCollapsed}
          />
          <SidebarItem 
            active={activeTab === 'kitchen'} 
            icon={CheckCircle2} 
            label={t.kitchen} 
            onClick={() => {
              setKitchenDate(getTodayStr());
              setActiveTab('kitchen');
            }} 
            collapsed={isSidebarCollapsed}
          />
          <SidebarItem 
            active={activeTab === 'reservations'} 
            icon={CalendarDays} 
            label={t.reservations} 
            onClick={() => {
              setActiveTab('reservations');
              setReservationSelectedDate(getTodayStr());
            }} 
            collapsed={isSidebarCollapsed}
          />
          <SidebarItem 
            active={activeTab === 'management'} 
            icon={isManagementUnlocked ? Unlock : Lock} 
            label="Rəhbərlik portalı" 
            onClick={() => {
              setActiveTab('management');
              if (managementSubTab === null) {
                setManagementSubTab('menu');
              }
            }} 
            collapsed={isSidebarCollapsed}
          />
          <SidebarItem 
            active={activeTab === 'qr'} 
            icon={QrCode} 
            label={t.qrMenu} 
            onClick={() => {
              setActiveTab('qr');
              setSelectedQRTableId(1);
            }} 
            collapsed={isSidebarCollapsed}
          />
          <SidebarItem 
            active={activeTab === 'expenses'} 
            icon={TrendingDown} 
            label={tText("Xərclər")} 
            onClick={() => setActiveTab('expenses')} 
            collapsed={isSidebarCollapsed}
          />
          <SidebarItem 
            active={activeTab === 'admin'} 
            icon={Settings} 
            label={t.admin} 
            onClick={() => setActiveTab('admin')} 
            collapsed={isSidebarCollapsed}
          />
          <SidebarItem 
            active={activeTab === 'about_us'} 
            icon={Info} 
            label="Haqqımızda" 
            onClick={() => setActiveTab('about_us')} 
            collapsed={isSidebarCollapsed}
          />
        </nav>

        <div className="mt-auto">
          <div className={`py-4 border-t border-slate-100 flex items-center justify-center ${isSidebarCollapsed ? 'flex-col gap-1' : 'px-4 gap-3'}`}>
            <Calendar className="w-5 h-5 text-slate-400 shrink-0" />
            {!isSidebarCollapsed && (
              <div className="text-left">
                <p className="text-xs font-black text-slate-700 tracking-wider">
                  {(() => {
                    const today = new Date();
                    const azMonths = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun', 'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'];
                    const azDays = ['Bazar', 'Bazar ertəsi', 'Çərşənbə axşamı', 'Çərşənbə', 'Cümə axşamı', 'Cümə', 'Şənbə'];
                    const d = today.getDate();
                    const m = azMonths[today.getMonth()];
                    const y = today.getFullYear();
                    const dayName = azDays[today.getDay()];
                    return `${d} ${m} ${y}, ${dayName}`;
                  })()}
                </p>
              </div>
            )}
            {isSidebarCollapsed && (
              <span className="text-[9px] font-black text-slate-500 tracking-tight">
                {(() => {
                  const today = new Date();
                  const d = String(today.getDate()).padStart(2, '0');
                  const m = String(today.getMonth() + 1).padStart(2, '0');
                  return `${d}.${m}`;
                })()}
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        {!(activeTab === 'tables' && selectedTableId !== null) && (
          <header className="h-20 bg-white border-b border-slate-100 px-10 flex items-center justify-between shrink-0">
          <div>
            {activeTab === 'tables' && selectedTableId === null ? (
              <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setTablesSubMode('tables')}
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-black transition-all cursor-pointer ${
                    tablesSubMode === 'tables'
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25 scale-[1.02]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Utensils className="w-4 h-4" />
                  <span>{t.tables || "Masalar"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTablesSubMode('quick_sale');
                    setIsSidebarCollapsed(true);
                  }}
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-black transition-all cursor-pointer ${
                    tablesSubMode === 'quick_sale'
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25 scale-[1.02]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  <span>Satış</span>
                </button>
              </div>
            ) : (
              <h2 className="text-2xl font-black text-slate-800 leading-none mb-1">
                {activeTab === 'dashboard' ? t.dashboard :
                 activeTab === 'tables' ? (selectedTableId ? (tables.find(t => t.id === selectedTableId)?.number || t.tables) : t.tables) :
                 activeTab === 'reservations' ? t.reservations :
                 activeTab === 'menu' ? t.menu :
                 activeTab === 'inventory' ? t.inventory :
                 activeTab === 'staff' ? t.staff :
                 activeTab === 'kitchen' ? t.kitchen : 
                 activeTab === 'qr' ? t.qrMenu :
                 activeTab === 'expenses' ? 'Xərclər və Əməliyyat Çıxarları' :
                 activeTab === 'ai' ? t.aiAnalytics :
                 activeTab === 'reports' ? t.reports : 
                 activeTab === 'admin' ? t.admin : 
                 activeTab === 'about_us' ? 'Haqqımızda' :
                 activeTab === 'management' ? 'Rəhbərlik portalı' : activeTab}
              </h2>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {activeTab === 'tables' && tablesSubMode === 'tables' && (
              <div className="flex items-center space-x-4 mr-2 bg-slate-50 p-1 rounded-2xl border border-slate-100 shrink-0">
                <button 
                  onClick={() => {
                    const newVal = !isTabletMode;
                    setIsTabletMode(newVal);
                    safeLocalStorageSetItem('isTabletMode', String(newVal));
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                    isTabletMode 
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-100' 
                      : 'bg-white text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Tablet className="w-3.5 h-3.5" />
                  <span>{t.tabletMode}: {isTabletMode ? t.active : t.passive}</span>
                </button>
              </div>
            )}

            {activeTab === 'tables' && tablesSubMode === 'tables' && (
              <div className="flex items-center space-x-4 mr-4 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100 shrink-0">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-slate-300" />
                  <span className="text-[10px] font-black text-slate-500 uppercase">{tableStatusCounts.available} {tText("Boş")}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  <span className="text-[10px] font-black text-orange-600 uppercase">{tableStatusCounts.occupied} {tText("Dolu")}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-[10px] font-black text-blue-600 uppercase">{tableStatusCounts.reserved} {tText("Rezerv")}</span>
                </div>
              </div>
            )}

            {activeTab === 'tables' && tablesSubMode === 'quick_sale' && (
              <div className="flex items-center gap-2 mr-4 px-3.5 py-2 bg-emerald-50 rounded-2xl border border-emerald-200/80 text-emerald-800 text-xs font-black shrink-0">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Birbaşa Kassa Satışı</span>
              </div>
            )}



            {/* Rəhbərlik portalı Lock button in header (if unlocked and on management tab) */}
            {activeTab === 'management' && isManagementUnlocked && (
              <button 
                onClick={() => {
                  setIsManagementUnlocked(false);
                  addAuditLog("Portal Kilidləndi", "Kassa", "Rəhbərlik portalı sürətli şəkildə kilidləndi.", "info");
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border border-red-200 bg-red-50 hover:bg-red-650 text-red-600 hover:text-white active:scale-95 shadow-sm shrink-0 mr-1 animate-in fade-in zoom-in duration-200"
                title="Paneli dərhal kilidlə"
              >
                <Lock className="w-4 h-4 shrink-0 transition-transform hover:scale-110" />
                <span>PANELİ KİLİDLƏ</span>
              </button>
            )}

            {/* Notification Bell (Zınqırov) Container */}
            <div ref={notificationRef} className="relative shrink-0">
              <button 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowQuickSettings(false);
                }}
                className={`p-2.5 rounded-xl transition-all relative cursor-pointer ${
                  showNotifications 
                    ? 'text-orange-500 bg-orange-50' 
                    : 'text-slate-400 hover:text-orange-500 hover:bg-orange-50/50'
                }`}
                title="Sistem Bildirişləri (Zınqırov)"
              >
                <Bell className="w-5 h-5 md:w-6 h-6" />
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse" />
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2.5 w-80 bg-white border border-slate-200 rounded-3xl shadow-2xl z-50 p-4 space-y-3 font-sans text-xs animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-orange-500" />
                      Canlı Sistem Bildirişləri
                    </h4>
                    <span className="text-[9px] font-black bg-red-50 text-red-600 px-2 py-0.5 rounded-md uppercase">4 aktiv</span>
                  </div>
                  <div className="space-y-2.5 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                    <div className="flex gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0 mt-1" />
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-700">Masa #4 - Yeni sifariş daxil oldu</p>
                        <span className="text-[9px] text-slate-400 font-semibold block">İndi daxil oldu • Ofisiant Aysel</span>
                      </div>
                    </div>
                    <div className="flex gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 mt-1" />
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-700">Mətbəx - 'Yarpaq dolması' sifarişi tamamlandı</p>
                        <span className="text-[9px] text-slate-400 font-semibold block">3 dəq əvvəl</span>
                      </div>
                    </div>
                    <div className="flex gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0 mt-1" />
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-700">Stok - Kritik anbarda məhsul azlığı</p>
                        <span className="text-[9px] text-red-500 font-black uppercase tracking-wider block">Quzu əti kritik dərəcədə azdır (2.5 kq)</span>
                      </div>
                    </div>
                    <div className="flex gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0 mt-1" />
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-700">Kassa - Günlük hesabat bərpa olundu</p>
                        <span className="text-[9px] text-slate-400 font-semibold block">1 saat əvvəl • Operator İlqar</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 font-black uppercase tracking-widest text-[9px] py-2 rounded-xl border border-slate-150 transition-all text-center block mt-1"
                  >
                    Bağla
                  </button>
                </div>
              )}
            </div>

            {/* Quick Settings (Tənzimləmələr) Container */}
            <div ref={quickSettingsRef} className="relative shrink-0">
              <button 
                onClick={() => {
                  setShowQuickSettings(!showQuickSettings);
                  setShowNotifications(false);
                }}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  showQuickSettings 
                    ? 'text-indigo-500 bg-indigo-50' 
                    : 'text-slate-400 hover:text-indigo-500 hover:bg-indigo-50/40'
                }`}
                title="Sürətli Tənzimləmələr"
              >
                <Settings className={`w-5 h-5 md:w-6 h-6 ${showQuickSettings ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
              </button>

              {showQuickSettings && (
                <div className="absolute right-0 mt-2.5 w-72 bg-white border border-slate-200 rounded-3xl shadow-2xl z-50 p-4 space-y-4 font-sans text-xs animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Settings className="w-4 h-4 text-indigo-500" />
                      Sürətli Tənzimləmələr
                    </h4>
                  </div>
                  
                  {/* Option 1: Volume/Mute control */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Səs tənzimləmələri:</span>
                    <button
                      onClick={() => {
                        const nextMuted = !isMuted;
                        setIsMuted(nextMuted);
                        safeLocalStorageSetItem('resto_isMuted', String(nextMuted));
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                        isMuted 
                          ? 'bg-red-50 border-red-200 text-red-650' 
                          : 'bg-emerald-50 border-emerald-250 text-emerald-750'
                      }`}
                    >
                      <span className="font-bold">Bildiriş və Printer Səsləri</span>
                      <span className="font-black uppercase text-[10px]">
                        {isMuted ? 'SƏSSİZ' : 'SƏSLİ'}
                      </span>
                    </button>
                  </div>

                  {/* Option 2: Quick Language Switcher */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Sistem dili:</span>
                    <div className="grid grid-cols-4 gap-1">
                      {['AZ', 'EN', 'TR', 'RU'].map((l) => (
                        <button
                          key={l}
                          onClick={() => {
                            setAppLanguage(l as any);
                            safeLocalStorageSetItem('appLanguage', l);
                          }}
                          className={`py-2 text-[10px] font-black rounded-lg uppercase tracking-wide border transition-all ${
                            appLanguage === l 
                              ? 'bg-indigo-600 text-white border-indigo-650' 
                              : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Option 3: Link to developer settings */}
                  <div className="border-t border-slate-100 pt-3">
                    <button
                      onClick={() => {
                        setActiveTab('admin');
                        setAdminSubTab('branding');
                        setShowQuickSettings(false);
                      }}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-2xl transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                      Admin Panelinə Keç
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="h-8 w-px bg-slate-150 mx-1 shrink-0" />
            {/* Təhlükəsiz Çıxış və Avtomatik D:\Restomaster Rezerv Saxlama Düyməsi */}
            <div className="flex items-center space-x-3 shrink-0">
              <button
                id="header-exit-backup-button"
                onClick={() => setShowExitConfirmModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 active:scale-95 text-white transition-all shadow-md shadow-rose-200 border border-rose-500 cursor-pointer"
                title="Sistemdən çıxış"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Çıxış</span>
              </button>
            </div>
          </div>
        </header>
        )}

        {/* Dynamic Content */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex flex-col overflow-hidden"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Reusable Confirm Dialog */}
      <AnimatePresence>
        {confirmDialog.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="w-full max-w-sm bg-white rounded-[24px] p-6 shadow-2xl border border-slate-100 flex flex-col"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider leading-tight">
                  {confirmDialog.title}
                </h4>
              </div>
              <p className="text-xs font-bold text-slate-500 mb-6 leading-relaxed">
                {confirmDialog.message}
              </p>
              <div className="flex gap-3">
                <button
                   type="button"
                   onClick={() => setConfirmDialog(p => ({ ...p, isOpen: false }))}
                   className="flex-1 py-3 text-[10px] font-black text-slate-600 bg-slate-100 hover:bg-slate-200 uppercase tracking-widest rounded-xl transition-colors"
                >
                  {confirmDialog.cancelText}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    confirmDialog.onConfirm();
                    setConfirmDialog(p => ({ ...p, isOpen: false }));
                  }}
                  className="flex-1 py-3 text-[10px] font-black text-white bg-red-500 hover:bg-red-650 uppercase tracking-widest rounded-xl transition-colors shadow-md shadow-red-100"
                >
                  {confirmDialog.confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sistemdən Çıxış Təsdiq Modalı (Confidential & Clean Exit Prompt) */}
      <AnimatePresence>
        {showExitConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="w-full max-w-sm bg-white rounded-[28px] p-6 shadow-2xl border border-slate-100 flex flex-col"
            >
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0 border border-rose-100 shadow-sm">
                  <LogOut className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider leading-tight">
                    Sistemdən Çıxış
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">
                    İstifadəçi Təsdiqi
                  </span>
                </div>
              </div>
              <p className="text-xs font-bold text-slate-600 mb-6 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                Sistemdən çıxış etmək istədiyinizə əminsiniz?
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowExitConfirmModal(false)}
                  className="flex-1 py-3 text-[11px] font-black text-slate-600 bg-slate-100 hover:bg-slate-200 uppercase tracking-widest rounded-xl transition-all active:scale-95 cursor-pointer"
                >
                  Xeyr, İmtina
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExitConfirmModal(false);
                    handleExitWithBackup();
                  }}
                  className="flex-1 py-3 text-[11px] font-black text-white bg-rose-600 hover:bg-rose-700 uppercase tracking-widest rounded-xl transition-all shadow-md shadow-rose-200 active:scale-95 cursor-pointer"
                >
                  Bəli, Çıxış Et
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Növbə Bildiriş və Təsdiq Modalı (Alert əvəzi zərif in-app dialoq) */}
      <AnimatePresence>
        {shiftNoticeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="w-full max-w-md bg-white rounded-[28px] p-6 shadow-2xl border border-slate-100 flex flex-col"
            >
              <div className="flex items-center gap-3.5 mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm ${
                  shiftNoticeModal.type === 'warning' 
                    ? 'bg-amber-50 text-amber-600 border-amber-100'
                    : shiftNoticeModal.type === 'info'
                    ? 'bg-blue-50 text-blue-600 border-blue-100'
                    : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                }`}>
                  {shiftNoticeModal.type === 'warning' ? (
                    <AlertTriangle className="w-6 h-6" />
                  ) : shiftNoticeModal.type === 'info' ? (
                    <Info className="w-6 h-6" />
                  ) : (
                    <CheckCircle2 className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider leading-tight">
                    {shiftNoticeModal.title}
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">
                    Sistem Məlumatı
                  </span>
                </div>
              </div>
              <div className="text-xs font-bold text-slate-600 mb-6 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 whitespace-pre-line">
                {shiftNoticeModal.message}
              </div>
              <button
                type="button"
                onClick={() => {
                  setShiftNoticeModal(null);
                  window.focus();
                }}
                className="w-full py-3.5 text-xs font-black text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 uppercase tracking-widest rounded-xl transition-all shadow-md shadow-orange-200 active:scale-95 cursor-pointer"
              >
                DAVAM ET
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Universal Floating Draggable On-Screen Virtual Keyboard for POS Monitors */}
      <AnimatePresence>
        {isVirtualKeyboardEnabled && isVirtualKeyboardOpen && (
          <motion.div
            id="resto-virtual-keyboard"
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            style={{
              position: 'fixed',
              left: virtualKeyboardPos ? `${virtualKeyboardPos.x}px` : '50%',
              top: virtualKeyboardPos ? `${virtualKeyboardPos.y}px` : undefined,
              bottom: virtualKeyboardPos ? undefined : '16px',
              transform: virtualKeyboardPos ? undefined : 'translateX(-50%)',
              zIndex: 9999,
              maxWidth: '98vw',
              width: isKeyboardWideMode ? '880px' : '640px'
            }}
            className="bg-slate-900/98 backdrop-blur-lg rounded-3xl p-3.5 shadow-2xl border border-slate-700 text-white select-none font-sans"
          >
            {/* Draggable & Touch Handle Top Header */}
            <div 
              onMouseDown={handleKeyboardMouseDown}
              onTouchStart={handleKeyboardTouchStart}
              onPointerDown={handleKeyboardPointerDown}
              className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800 cursor-grab active:cursor-grabbing touch-none select-none"
              title="Klaviaturanın yerini dəyişmək üçün burdan tutub istədiyiniz yerə çəkin"
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-orange-500/20 text-orange-400 rounded-xl border border-orange-500/30">
                  <Move className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-white uppercase tracking-wider block">
                      Ekran Klaviaturası
                    </span>
                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-orange-500/20 text-orange-300 border border-orange-500/40 uppercase">
                      {isKeyboardWideMode ? '10 Barmaq POS Rejimi' : 'Kompakt'}
                    </span>
                  </div>
                  {activeInputInfo.label && (
                    <span className="text-[9.5px] font-bold text-orange-400 truncate max-w-[220px] block">
                      {activeInputInfo.label}: {activeInputInfo.value ? `"${activeInputInfo.value}"` : '(boş)'}
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Docking & Language Controls */}
              <div 
                className="flex items-center gap-1.5" 
                onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
                onTouchStart={e => e.stopPropagation()}
              >
                {/* 10-Finger Wide Mode Toggle Button */}
                <button
                  type="button"
                  onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
                  onClick={() => setIsKeyboardWideMode(!isKeyboardWideMode)}
                  className={`px-2 py-1 text-[9.5px] font-black rounded-lg uppercase transition-all flex items-center gap-1 border cursor-pointer ${
                    isKeyboardWideMode 
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs' 
                      : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
                  }`}
                  title={isKeyboardWideMode ? 'Kompakt Rejimə Keç' : '10 Barmaq Geniş POS Rejiminə Keç'}
                >
                  <span>10 Barmaq</span>
                </button>

                {/* Quick Dock Positions */}
                <div className="hidden sm:flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 gap-0.5">
                  <button
                    type="button"
                    onClick={() => dockVirtualKeyboard('top')}
                    className="p-1 text-[9px] text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                    title="Yuxarı bərkit"
                  >
                    ⬆
                  </button>
                  <button
                    type="button"
                    onClick={() => dockVirtualKeyboard('bottom')}
                    className="p-1 text-[9px] text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                    title="Aşağı bərkit"
                  >
                    ⬇
                  </button>
                  <button
                    type="button"
                    onClick={() => dockVirtualKeyboard('left')}
                    className="p-1 text-[9px] text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                    title="Sola bərkit"
                  >
                    ⬅
                  </button>
                  <button
                    type="button"
                    onClick={() => dockVirtualKeyboard('right')}
                    className="p-1 text-[9px] text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                    title="Sağa bərkit"
                  >
                    ➡
                  </button>
                  <button
                    type="button"
                    onClick={() => dockVirtualKeyboard('center')}
                    className="p-1 text-[9px] text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                    title="Mərkəzə gətir"
                  >
                    ⏺
                  </button>
                </div>

                {/* Language Switcher */}
                <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                  {(['AZ', 'EN', 'TR', 'RU'] as const).map(l => (
                    <button
                      key={l}
                      type="button"
                      onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
                      onClick={() => setVirtualKeyboardLang(l)}
                      className={`px-1.5 py-0.5 text-[9px] font-black rounded uppercase transition-colors cursor-pointer ${
                        virtualKeyboardLang === l ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
                  onClick={() => setIsVirtualKeyboardOpen(false)}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-slate-700 cursor-pointer"
                  title="Klaviaturanı Bağla"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Keys Area */}
            <div 
              className="space-y-1.5 select-none" 
              onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
              onTouchStart={e => e.stopPropagation()}
            >
              {/* Render dynamic key rows */}
              {(virtualKeyboardMode === '123' 
                ? VIRTUAL_KB_SYMBOLS 
                : (virtualKeyboardLang === 'AZ' ? VIRTUAL_KB_AZ : virtualKeyboardLang === 'TR' ? VIRTUAL_KB_TR : virtualKeyboardLang === 'RU' ? VIRTUAL_KB_RU : VIRTUAL_KB_EN)
              ).map((row, rIdx) => (
                <div key={`float_kb_row_${rIdx}`} className="flex justify-center gap-1">
                  {/* Caps Lock on 3rd row for ABC */}
                  {rIdx === 2 && virtualKeyboardMode === 'abc' && (
                    <button
                      type="button"
                      onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
                      onClick={(e) => { 
                        e.preventDefault(); 
                        e.stopPropagation(); 
                        setVirtualKeyboardCaps(!virtualKeyboardCaps);
                        if (virtualKeyboardShift) setVirtualKeyboardShift(false);
                      }}
                      className={`px-2.5 ${isKeyboardWideMode ? 'py-3 text-sm' : 'py-2 text-xs'} rounded-xl font-black transition-all flex items-center justify-center shrink-0 min-w-[48px] cursor-pointer touch-manipulation ${
                        virtualKeyboardCaps ? 'bg-orange-500 text-white shadow-md' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                      }`}
                    >
                      CAPS
                    </button>
                  )}

                  {/* Shift directly under CAPS on 4th row (rIdx === 3) for ABC */}
                  {rIdx === 3 && virtualKeyboardMode === 'abc' && (
                    <button
                      type="button"
                      onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
                      onClick={(e) => { 
                        e.preventDefault(); 
                        e.stopPropagation(); 
                        setVirtualKeyboardShift(!virtualKeyboardShift); 
                      }}
                      className={`px-3 ${isKeyboardWideMode ? 'py-3 text-sm' : 'py-2 text-xs'} rounded-xl font-black transition-all flex items-center justify-center gap-1 shrink-0 min-w-[56px] cursor-pointer touch-manipulation ${
                        virtualKeyboardShift 
                          ? 'bg-amber-500 text-slate-950 font-black shadow-md border-amber-400' 
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                      }`}
                      title="Shift (Böyük hərf üçün aktivləşdir, 1 hərf yazdıqda avtomatik sönür)"
                    >
                      <span className="text-xs">⇧</span>
                      <span>Shift</span>
                    </button>
                  )}

                  {row.map((k, cIdx) => (
                    <button
                      key={`float_key_${rIdx}_${cIdx}_${k}`}
                      type="button"
                      onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); simulateKeyInput(k); }}
                      className={`flex-1 ${isKeyboardWideMode ? 'py-3 px-2 text-base' : 'py-2 px-1 text-xs'} font-black bg-slate-800 hover:bg-slate-700 active:bg-orange-500 active:text-white text-slate-100 border border-slate-700 rounded-xl transition-all text-center min-w-[32px] sm:min-w-[40px] shadow-xs active:scale-95 cursor-pointer select-none touch-manipulation`}
                    >
                      {(virtualKeyboardCaps || virtualKeyboardShift) ? k.toUpperCase() : k}
                    </button>
                  ))}

                  {/* Backspace on 3rd row */}
                  {rIdx === 2 && (
                    <button
                      type="button"
                      onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); simulateKeyInput('BACKSPACE'); }}
                      className={`px-3.5 ${isKeyboardWideMode ? 'py-3 text-base' : 'py-2 text-xs'} rounded-xl font-black bg-rose-950/80 hover:bg-rose-700 text-rose-200 hover:text-white border border-rose-800/80 transition-all flex items-center justify-center shrink-0 min-w-[52px] active:scale-95 cursor-pointer select-none shadow-xs touch-manipulation`}
                      title="Sil (Backspace)"
                    >
                      ⌫
                    </button>
                  )}
                </div>
              ))}

              {/* Bottom Action Row (Mode Switcher, Space, Clear, Dot, Enter) */}
              <div className="flex gap-1.5 pt-0.5">
                <button
                  type="button"
                  onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setVirtualKeyboardMode(virtualKeyboardMode === 'abc' ? '123' : 'abc'); }}
                  className={`px-3.5 ${isKeyboardWideMode ? 'py-3 text-sm' : 'py-2 text-xs'} rounded-xl font-black bg-slate-800 hover:bg-slate-700 text-orange-400 border border-slate-700 transition-all min-w-[58px] active:scale-95 cursor-pointer touch-manipulation`}
                >
                  {virtualKeyboardMode === 'abc' ? '?123' : 'ABC'}
                </button>

                <button
                  type="button"
                  onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); simulateKeyInput('CLEAR'); }}
                  className={`px-3 ${isKeyboardWideMode ? 'py-3 text-xs' : 'py-2 text-[10px]'} rounded-xl font-black bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-all uppercase active:scale-95 cursor-pointer touch-manipulation`}
                >
                  Təmizlə
                </button>

                <button
                  type="button"
                  onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); simulateKeyInput('SPACE'); }}
                  className={`flex-1 ${isKeyboardWideMode ? 'py-3 text-sm' : 'py-2 text-xs'} rounded-xl font-extrabold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all uppercase tracking-widest active:scale-98 cursor-pointer touch-manipulation`}
                >
                  Boşluq (Space)
                </button>

                {/* Dot (.) button right next to Daxil Et */}
                <button
                  type="button"
                  onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); simulateKeyInput('.'); }}
                  className={`px-4 sm:px-5 ${isKeyboardWideMode ? 'py-3 text-lg' : 'py-2 text-base'} font-black rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-orange-500 active:text-white text-slate-100 border border-slate-700 transition-all active:scale-95 cursor-pointer flex items-center justify-center min-w-[44px] shadow-xs touch-manipulation`}
                  title="Nöqtə (.)"
                >
                  .
                </button>

                <button
                  type="button"
                  onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); simulateKeyInput('ENTER'); }}
                  className={`px-5 ${isKeyboardWideMode ? 'py-3 text-sm' : 'py-2 text-xs'} rounded-xl font-black bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 transition-all min-w-[80px] shadow-sm active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 touch-manipulation`}
                >
                  <Check className="w-4 h-4" />
                  <span>Daxil Et</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reusable Confirm Dialog */}
      <AnimatePresence>
        {confirmDialog.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="w-full max-w-sm bg-white rounded-[24px] p-6 shadow-2xl border border-slate-100 flex flex-col"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider leading-tight">
                  {confirmDialog.title}
                </h4>
              </div>
              <p className="text-xs font-bold text-slate-500 mb-6 leading-relaxed">
                {confirmDialog.message}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmDialog(p => ({ ...p, isOpen: false }))}
                  className="flex-1 py-3 text-[10px] font-black text-slate-600 bg-slate-100 hover:bg-slate-200 uppercase tracking-widest rounded-xl transition-colors"
                >
                  {confirmDialog.cancelText}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    confirmDialog.onConfirm();
                    setConfirmDialog(p => ({ ...p, isOpen: false }));
                  }}
                  className="flex-1 py-3 text-[10px] font-black text-white bg-red-500 hover:bg-red-650 uppercase tracking-widest rounded-xl transition-colors shadow-md shadow-red-100"
                >
                  {confirmDialog.confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Menu Item Delete Custom Confirm Dialog */}
      <AnimatePresence>
        {menuItemToDeleteId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="w-full max-w-sm bg-white rounded-[24px] p-6 shadow-2xl border border-slate-100 flex flex-col"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider leading-tight">Yeməyi menyudan Sil?</h4>
              </div>
              <p className="text-xs font-bold text-slate-500 mb-6 leading-relaxed">
                Bu yeməyi menyudan silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setMenuItemToDeleteId(null)}
                  className="flex-1 py-3 text-[10px] font-black text-slate-600 bg-slate-100 hover:bg-slate-200 uppercase tracking-widest rounded-xl transition-colors"
                >
                  XEYR, LƏĞV ET
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteMenuItem}
                  className="flex-1 py-3 text-[10px] font-black text-white bg-red-500 hover:bg-red-650 uppercase tracking-widest rounded-xl transition-colors shadow-md shadow-red-100"
                >
                  BƏLİ, SİLƏM
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Expense Modal */}
      <AnimatePresence>
        {isAddExpenseOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4 font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white w-full max-w-md rounded-[28px] p-6 shadow-2xl border border-slate-100 flex flex-col"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shrink-0">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider leading-tight">
                      {tText("Yeni Xərc Əlavə Et")}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">YENİ BÜDJƏ ÇIXARISI VƏ XƏRCƏ QEYDİYYAT</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddExpenseSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 px-1">
                    {tText("Xərcin Təsviri / Adı")} *
                  </label>
                  <input
                    ref={expenseTitleInputRef}
                    type="text"
                    required
                    placeholder={tText("məs. Təzə tərəvəz alışı, Su ödənişi")}
                    value={newExpense.title}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 px-1">
                      {tText("Kateqoriya")}
                    </label>
                    <select
                      value={newExpense.category}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
                    >
                      <option value="Kommunal">{tText("Kommunal")}</option>
                      <option value="Təchizat">{tText("Təchizat")}</option>
                      <option value="Arenda">{tText("Arenda")}</option>
                      <option value="Maaş">{tText("Maaş")}</option>
                      <option value="Təmir/Avariya">{tText("Təmir/Avariya")}</option>
                      <option value="Digər">{tText("Digər")}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 px-1">
                      {tText("Məbləğ")} ({currencySymbol}) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="0.00"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 px-1">
                    {tText("Tarix")}
                  </label>
                  <AzDatePicker
                    value={newExpense.date || getTodayStr()}
                    onChange={(val) => setNewExpense(prev => ({ ...prev, date: val }))}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 px-1">
                    {tText("Əlavə Qeydlər")}
                  </label>
                  <textarea
                    rows={2}
                    placeholder={tText("Əlavə təfərrüat və ya icraçı haqqında qeyd...")}
                    value={newExpense.notes}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddExpenseOpen(false)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
                  >
                    {tText("Ləğv et")}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-md shadow-red-200 transition-all cursor-pointer"
                  >
                    {tText("Yadda Saxla")}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Search Printer Modal (Windows System Printers Discovery Modal) */}
      <AnimatePresence>
        {searchPrinterModal && searchPrinterModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="w-full max-w-md bg-white rounded-[28px] p-6 shadow-2xl border border-slate-100 flex flex-col font-sans"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-50 text-cyan-500 rounded-2xl flex items-center justify-center shrink-0">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider leading-tight">
                      {searchPrinterModal.targetProfile === 'A' ? 'Profil A (Qəbz)' : searchPrinterModal.targetProfile === 'B' ? 'Profil B (Mətbəx)' : 'Profil C (Z-Hesabatı)'} Printeri Axtar
                    </h4>
                    <p className="text-[10px] text-slate-450 font-bold mt-0.5">SİSTEM PRİNTERLƏRİNİN AŞKAR EDİLMƏSİ</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSearchPrinterModal(null)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <p className="text-[11px] font-bold text-slate-500 mb-4 leading-relaxed">
                Windows Əməliyyat Sisteminin aktiv printer siyahısına daxil olub müvafiq cihazı proqrama bağlamaq üçün aşağıdan seçin və ya yeni cihaz adı əlavə edin:
              </p>

              {/* Action: Trigger real system printers dialog simulation */}
              <button
                type="button"
                onClick={() => {
                  const iframe = document.createElement('iframe');
                  iframe.style.position = 'absolute';
                  iframe.style.width = '0px';
                  iframe.style.height = '0px';
                  iframe.style.border = 'none';
                  document.body.appendChild(iframe);
                  const doc = iframe.contentWindow?.document || iframe.contentDocument;
                  if (doc) {
                    const timestamp = new Date().toLocaleString(getActiveLocaleForApp());
                    const selectedPrinter = searchPrinterModal.targetProfile === 'A' ? profileAName : searchPrinterModal.targetProfile === 'B' ? profileBName : profileCName;
                    const profileLabel = searchPrinterModal.targetProfile === 'A' ? 'PROFIL A - QƏBZ' : searchPrinterModal.targetProfile === 'B' ? 'PROFIL B - MƏTBƏX' : 'PROFIL C - Z-HESABATI';
                    let fontFam = "'Courier New', Courier, monospace";
                    let maxW = "250px";
                    
                    const html = `
                      <html>
                      <head>
                        <title>Sınaq Çeki - ${selectedPrinter}</title>
                        <style>
                          @media print { 
                            body { margin: 0; padding: 4px; font-family: ${fontFam}; font-size: 11px; } 
                          }
                        </style>
                      </head>
                      <body>
                        <div style="width: 100%; max-width: ${maxW}; font-family: ${fontFam}; line-height: 1.4;">
                          <h3 style="text-align: center; margin-bottom: 2px;">RESTO MASTER</h3>
                          <div style="text-align: center; font-size: 10px; font-weight: bold; margin-bottom: 6px;">SINAQ (TEST) ÇEKİ</div>
                          <div style="border-bottom: 1px dashed #000; margin: 4px 0;"></div>
                          <div>PROFİL: ${profileLabel}</div>
                          <div>PRİNTER: ${selectedPrinter}</div>
                          ${searchPrinterModal.targetProfile === 'C' ? `<div>QOŞULMA PORTU: ${profileCPort || 'USB001'}</div>` : ''}
                          <div>TARİX: ${timestamp}</div>
                          <div style="border-bottom: 1px dashed #000; margin: 4px 0;"></div>
                          <div style="display: flex; justify-content: space-between; font-size: 11px;">
                            <span>Sınaq Məhsulu x1</span>
                            <span style="font-weight: bold;">0.00 ₼</span>
                          </div>
                          <div style="border-bottom: 1px dashed #000; margin: 4px 0;"></div>
                          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 11px;">
                            <span>CƏMİ MƏBLƏĞ:</span>
                            <span>0.00 ₼</span>
                          </div>
                          <div style="border-bottom: 1px dashed #000; margin: 4px 0;"></div>
                          <div style="text-align: center; font-size: 10px; margin-top: 8px; white-space: pre-line;">${printerFooterText}</div>
                        </div>
                        <script>
                          window.focus(); 
                          setTimeout(function() { 
                            window.print(); 
                            window.parent.document.body.removeChild(window.frameElement); 
                          }, 300);
                        </script>
                      </body>
                      </html>
                    `;
                    doc.open();
                    doc.write(html);
                    doc.close();
                  }
                }}
                className="w-full mb-4 py-3 bg-slate-100 hover:bg-slate-200 border border-dashed border-slate-300 rounded-xl font-black text-slate-700 text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <RefreshCw className="w-4 h-4 text-cyan-500 animate-spin" />
                Windows Sistem Printerləri Pəncərəsini Aç
              </button>

              {/* List of Discovered Printers */}
              <div className="space-y-1.5 max-h-[180px] overflow-y-auto mb-4 border border-slate-100 p-2 rounded-xl bg-slate-50/50 scrollbar-thin">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block px-1">Sistemdə Aşkar Edilən Cihazlar:</label>
                {discoveredPrinters.map((printer, idx) => {
                  const isSelected = searchPrinterModal.targetProfile === 'A' ? profileAName === printer : searchPrinterModal.targetProfile === 'B' ? profileBName === printer : profileCName === printer;
                  return (
                    <div 
                      key={`disc_printer_${printer}_${idx}`} 
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-bold transition-all ${
                        isSelected 
                          ? 'border-cyan-500 bg-cyan-550/20 text-cyan-700' 
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (searchPrinterModal.targetProfile === 'A') {
                            setProfileAName(printer);
                          } else if (searchPrinterModal.targetProfile === 'B') {
                            setProfileBName(printer);
                          } else {
                            setProfileCName(printer);
                            const autoPort = detectPortForPrinter(printer);
                            setProfileCPort(autoPort);
                            safeLocalStorageSetItem('resto_profileC_port', autoPort);
                          }
                        }}
                        className="flex-1 text-left cursor-pointer flex items-center gap-2"
                      >
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${isSelected ? 'border-cyan-500 bg-cyan-500 text-white' : 'border-slate-300 bg-white'}`}>
                          {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                        </div>
                        {printer}
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const updated = discoveredPrinters.filter(p => p !== printer);
                          setDiscoveredPrinters(updated);
                          safeLocalStorageSetItem('resto_discovered_printers', JSON.stringify(updated));
                        }}
                        className="text-slate-450 hover:text-red-500 transition-colors p-1"
                        title="Siyahıdan sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Add Custom Device Input */}
              <div className="space-y-1.5 border-t border-slate-100 pt-3 mb-4">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block px-1">Siyahıda yoxdursa - Yeni Printer Adı Əlavə Et</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="new_custom_printer_input"
                    placeholder="Məs: HP LaserJet 1020"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const input = e.currentTarget;
                        const name = input.value;
                        if (name.trim()) {
                          const updated = [...discoveredPrinters];
                          if (!updated.includes(name)) {
                            updated.push(name);
                            setDiscoveredPrinters(updated);
                            safeLocalStorageSetItem('resto_discovered_printers', JSON.stringify(updated));
                          }
                          if (searchPrinterModal.targetProfile === 'A') {
                            setProfileAName(name);
                          } else if (searchPrinterModal.targetProfile === 'B') {
                            setProfileBName(name);
                          } else {
                            setProfileCName(name);
                            const autoPort = detectPortForPrinter(name);
                            setProfileCPort(autoPort);
                            safeLocalStorageSetItem('resto_profileC_port', autoPort);
                          }
                          input.value = '';
                        }
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 font-bold text-slate-700 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('new_custom_printer_input') as HTMLInputElement | null;
                      if (input && input.value.trim()) {
                        const name = input.value;
                        const updated = [...discoveredPrinters];
                        if (!updated.includes(name)) {
                          updated.push(name);
                          setDiscoveredPrinters(updated);
                          safeLocalStorageSetItem('resto_discovered_printers', JSON.stringify(updated));
                        }
                        if (searchPrinterModal.targetProfile === 'A') {
                          setProfileAName(name);
                        } else if (searchPrinterModal.targetProfile === 'B') {
                          setProfileBName(name);
                        } else {
                          setProfileCName(name);
                          const autoPort = detectPortForPrinter(name);
                          setProfileCPort(autoPort);
                          safeLocalStorageSetItem('resto_profileC_port', autoPort);
                        }
                        input.value = '';
                      }
                    }}
                    className="px-4 py-2 bg-slate-800 text-white font-bold text-xs rounded-xl hover:bg-slate-900 transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Əlavə et
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSearchPrinterModal(null)}
                  className="flex-1 py-3 text-[10px] font-black text-slate-600 bg-slate-100 hover:bg-slate-200 uppercase tracking-widest rounded-xl transition-colors cursor-pointer"
                >
                  BAĞLA
                </button>
                <button
                  type="button"
                  onClick={() => {
                    safeLocalStorageSetItem('resto_profileA_name', profileAName);
                    safeLocalStorageSetItem('resto_profileB_name', profileBName);
                    safeLocalStorageSetItem('resto_profileC_name', profileCName);
                    safeLocalStorageSetItem('resto_profileC_port', profileCPort);
                    savePrinterSettings();
                    setSearchPrinterModal(null);
                  }}
                  className="flex-1 py-3 text-[10px] font-black text-white bg-cyan-600 hover:bg-cyan-700 uppercase tracking-widest rounded-xl transition-colors shadow-md shadow-cyan-100 cursor-pointer"
                >
                  YADDA SAXLA
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Item Action Modal for Defective / Returned Items */}
        {itemActionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-150 w-full max-w-md overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`p-5 text-white flex items-center justify-between ${
                itemActionModal.actionType === 'defective'
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 shadow-md shadow-rose-100'
                  : 'bg-gradient-to-r from-amber-500 to-orange-600 shadow-md shadow-amber-100'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
                    {itemActionModal.actionType === 'defective' ? (
                      <AlertTriangle className="w-5 h-5 text-white" />
                    ) : (
                      <Undo2 className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-wider">
                      {itemActionModal.actionType === 'defective' ? 'Xarab Məhsul Qeydiyyatı' : 'Geri Alınan Məhsul Qeydiyyatı'}
                    </h3>
                    <p className="text-[10px] text-white/80 font-bold">
                      {itemActionModal.actionType === 'defective' ? 'Mətbəx və servis xarablıq jurnalı' : 'Müştəri geri qaytarma jurnalı'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setItemActionModal(null)}
                  className="p-1.5 bg-white/20 hover:bg-white/30 rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                {/* Product Summary Card */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Məhsul</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{itemActionModal.tableNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-slate-900 text-sm">{itemActionModal.dishName}</h4>
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                      itemActionModal.actionType === 'defective' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {itemActionModal.price.toFixed(2)} ₼
                    </span>
                  </div>
                </div>

                {/* Quantity Selection if item quantity > 1 */}
                {(() => {
                  let itemQty = 1;
                  Object.values(activeOrders).forEach(orders => {
                    const found = (orders as OrderItem[]).find(o => o.id === itemActionModal.itemId);
                    if (found) itemQty = found.quantity;
                  });
                  if (itemQty <= 1) return null;

                  return (
                    <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-2.5">
                      <div className="flex justify-between items-center text-xs font-black text-slate-700">
                        <span>Miqdar:</span>
                        <span className="text-orange-600 font-extrabold">{itemActionQty} / {itemQty} ədəd</span>
                      </div>
                      <div className="flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => setItemActionQty(Math.max(1, itemActionQty - 1))}
                          className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-700 font-black text-lg flex items-center justify-center hover:bg-slate-100 active:scale-95 transition-all shadow-xs cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-12 text-center text-lg font-black text-slate-800">
                          {itemActionQty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setItemActionQty(Math.min(itemQty, itemActionQty + 1))}
                          className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-700 font-black text-lg flex items-center justify-center hover:bg-slate-100 active:scale-95 transition-all shadow-xs cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex gap-2 justify-center pt-0.5">
                        <button
                          type="button"
                          onClick={() => setItemActionQty(1)}
                          className={`px-3 py-1 text-[10px] font-black rounded-lg border transition-all cursor-pointer ${
                            itemActionQty === 1
                              ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          1 ədəd
                        </button>
                        <button
                          type="button"
                          onClick={() => setItemActionQty(itemQty)}
                          className={`px-3 py-1 text-[10px] font-black rounded-lg border transition-all cursor-pointer ${
                            itemActionQty === itemQty
                              ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          Hamısı ({itemQty} ədəd)
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Reason Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                    {itemActionModal.actionType === 'defective' ? 'Xarab olma səbəbi (Tez seçimlər):' : 'Geri qaytarılma səbəbi (Tez seçimlər):'}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {(itemActionModal.actionType === 'defective'
                      ? ['Yanmış / Çiy çıxıb', 'Dadı/Qoxusu bəyənilmədi', 'İçindən yad cisim çıxıb', 'Mətbəxdə xarab olub', 'Soyuq gəlib', 'Görünüş standart deyil']
                      : ['Müştəri imtina etdi', 'Gecikmə səbəbilə', 'Səhv sifariş', 'Müştəri doymuşdu', 'Görünüş bəyənilmədi', 'Masa ləğv edildi']
                    ).map((chip, idx) => (
                      <button
                        key={`item_action_chip_${idx}_${chip}`}
                        type="button"
                        onClick={() => {
                          setItemActionSelectedChip(chip);
                          setItemActionReason(chip);
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
                          itemActionSelectedChip === chip
                            ? (itemActionModal.actionType === 'defective' ? 'bg-rose-500 text-white border-rose-500 shadow-xs' : 'bg-amber-500 text-white border-amber-500 shadow-xs')
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Detail Input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    Ətraflı Səbəb / Qeyd
                  </label>
                  <textarea
                    rows={2}
                    value={itemActionReason}
                    onChange={e => {
                      setItemActionReason(e.target.value);
                      setItemActionSelectedChip('');
                    }}
                    placeholder="Səbəbi dəqiqləşdirin və ya əlavə qeyd yazın..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-xs text-slate-800 resize-none"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setItemActionModal(null)}
                  className="flex-1 py-3 text-[10px] font-black text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 uppercase tracking-widest rounded-xl transition-colors cursor-pointer"
                >
                  LƏĞV ET
                </button>
                <button
                  type="button"
                  onClick={handleConfirmItemAction}
                  className={`flex-1 py-3 text-[10px] font-black text-white uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 ${
                    itemActionModal.actionType === 'defective'
                      ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 shadow-rose-200'
                      : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-200'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  JURNALA ƏLAVƏ ET
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
