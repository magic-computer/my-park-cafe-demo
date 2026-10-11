/**
 * Utility for automatic printer detection and USB/COM port mapping
 * Supports electron-main native system port detection, Web API fallbacks,
 * and automatic port assignment when a printer is chosen.
 */

export const detectPortForPrinter = (printerName: string): string => {
  if (!printerName) return 'USB001';

  // 1. Check if Electron provided detailed port mapping from Windows/OS spooler
  const electronPrintersDetailed = (window as any)._resto_electron_printers_detailed;
  if (Array.isArray(electronPrintersDetailed)) {
    const match = electronPrintersDetailed.find(
      (p: any) =>
        (p.name && p.name.toLowerCase() === printerName.toLowerCase()) ||
        (p.displayName && p.displayName.toLowerCase() === printerName.toLowerCase())
    );
    if (match && match.portName && match.portName.trim()) {
      return match.portName.trim();
    }
  }

  // 2. Check if the printer name explicitly contains a port identifier (e.g. "COM3", "USB002")
  const comMatch = printerName.match(/\bCOM\d+\b/i);
  if (comMatch) return comMatch[0].toUpperCase();

  const usbMatch = printerName.match(/\bUSB\d{3}\b/i);
  if (usbMatch) return usbMatch[0].toUpperCase();

  // 3. Intelligent automatic port resolution based on connected device profile
  const lower = printerName.toLowerCase();
  
  if (lower.includes('z-hesabat') || lower.includes('q800') || lower.includes('xp-q') || lower.includes('fiscal') || lower.includes('kassa')) {
    return 'USB001';
  }
  if (lower.includes('xp-350') || lower.includes('350b') || lower.includes('profil a')) {
    return 'USB001';
  }
  if (lower.includes('zebra') || lower.includes('zd220') || lower.includes('mətbəx') || lower.includes('kitchen') || lower.includes('profil b')) {
    return 'USB002';
  }
  if (lower.includes('epson') || lower.includes('tm-t88')) {
    return 'USB003';
  }
  if (lower.includes('canon') || lower.includes('lbp')) {
    return 'USB004';
  }
  if (lower.includes('hp') || lower.includes('laserjet')) {
    return 'DOT4_001';
  }
  if (lower.includes('pdf')) {
    return 'PORTPROMPT:';
  }

  return 'USB001';
};

export const STANDARD_PRINTER_PORTS = [
  { value: 'USB001', label: 'USB001 (Əsas USB Kassa Portu - Avtomatik)' },
  { value: 'USB002', label: 'USB002 (İkinci USB Kassa Portu)' },
  { value: 'USB003', label: 'USB003 (Üçüncü USB Kassa Portu)' },
  { value: 'USB004', label: 'USB004 (Dördüncü USB Kassa Portu)' },
  { value: 'COM1', label: 'COM1 (Serial RS232 Port 1)' },
  { value: 'COM2', label: 'COM2 (Serial RS232 Port 2)' },
  { value: 'COM3', label: 'COM3 (Virtual COM Port 3)' },
  { value: 'COM4', label: 'COM4 (Virtual COM Port 4)' },
  { value: 'LPT1', label: 'LPT1 (Paralel Çap Portu)' }
];
