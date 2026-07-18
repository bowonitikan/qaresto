import { Customer } from './types';

// Convert array of objects to Excel-compatible CSV with UTF-8 BOM
export function exportToCSV(filename: string, headers: string[], rows: any[][]) {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      row.map(value => {
        const str = value === null || value === undefined ? '' : String(value);
        // Escape quotes
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    )
  ].join('\n');

  // Add UTF-8 Byte Order Mark (BOM) so Excel opens Indonesian accents/symbols correctly
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Convert common Google Sheets URLs to direct CSV export URLs
export function getGoogleSheetsExportUrl(inputUrl: string): string {
  try {
    const trimmed = inputUrl.trim();
    if (!trimmed) return '';
    
    // Check if already an export URL
    if (trimmed.includes('/export?') && trimmed.includes('format=csv')) {
      return trimmed;
    }
    
    // Extract Spreadsheet ID
    const matches = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (matches && matches[1]) {
      const sheetId = matches[1];
      // Get gid parameter if present
      const gidMatch = trimmed.match(/[#&]gid=([0-9]+)/);
      const gidSuffix = gidMatch ? `&gid=${gidMatch[1]}` : '';
      return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gidSuffix}`;
    }
    
    return trimmed;
  } catch (error) {
    console.error('Error parsing Google Sheets URL', error);
    return inputUrl;
  }
}

// Parse CSV text string into array of Customer objects
export function parseCustomerCSV(csvText: string): Customer[] {
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return [];

  // Determine delimiter (comma or semicolon)
  const firstLine = lines[0];
  const delimiter = firstLine.includes(';') ? ';' : ',';

  // Helper to split line respecting quotes
  const splitLine = (line: string) => {
    const result: string[] = [];
    let insideQuote = false;
    let currentToken = '';
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === delimiter && !insideQuote) {
        result.push(currentToken.trim());
        currentToken = '';
      } else {
        currentToken += char;
      }
    }
    result.push(currentToken.trim());
    return result.map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"'));
  };

  const headers = splitLine(lines[0]).map(h => h.toLowerCase());
  const customers: Customer[] = [];

  // Find header index mappings (supporting various English, Indonesian & generic field aliases)
  const nameIdx = headers.findIndex(h => 
    h.includes('nama') || 
    h.includes('name') || 
    h.includes('pelanggan') || 
    h.includes('customer') || 
    h.includes('member') || 
    h.includes('anggota') || 
    h.includes('user') ||
    h.includes('client') ||
    h.includes('klien') ||
    h.includes('nama pelanggan')
  );
  
  const phoneIdx = headers.findIndex(h => 
    h.includes('telp') || 
    h.includes('phone') || 
    h.includes('hp') || 
    h.includes('kontak') || 
    h.includes('contact') || 
    h.includes('telepon') || 
    h.includes('wa') || 
    h.includes('whatsapp')
  );
  
  const emailIdx = headers.findIndex(h => 
    h.includes('email') || 
    h.includes('surel') || 
    h.includes('mail')
  );
  
  const prefIdx = headers.findIndex(h => 
    h.includes('preferensi') || 
    h.includes('pref') || 
    h.includes('catatan') || 
    h.includes('note') || 
    h.includes('keterangan') || 
    h.includes('desc') || 
    h.includes('description')
  );

  // Parse lines starting from the second row (if headers detected)
  const hasValidHeader = nameIdx !== -1;
  const startIndex = hasValidHeader ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const cols = splitLine(line);
    if (cols.length === 0) continue;
    
    const targetIdx = nameIdx === -1 ? 0 : nameIdx;
    const name = cols[targetIdx] || 'Tanpa Nama';
    const phone = cols[phoneIdx !== -1 ? phoneIdx : 1] || '-';
    const email = cols[emailIdx !== -1 ? emailIdx : 2] || '';
    const preferences = cols[prefIdx !== -1 ? prefIdx : 3] || 'Tidak ada preferensi khusus';

    customers.push({
      id: `c_import_${Math.random().toString(36).substring(2, 9)}`,
      name,
      phone,
      email,
      preferences,
      points: 10, // Initial welcome points
      orderCount: 0,
      totalSpent: 0,
      joinDate: new Date().toISOString().split('T')[0]
    });
  }

  // Resilient fallback: If parsing failed completely, parse every line as values directly
  if (customers.length === 0) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const cols = splitLine(line);
      if (cols.length === 0 || !cols[0]) continue;
      
      // Skip the line only if it matches typical headers
      const firstColLower = cols[0].toLowerCase();
      if (
        firstColLower === 'nama' || 
        firstColLower === 'name' || 
        firstColLower === 'nama pelanggan' || 
        firstColLower === 'customer name' || 
        firstColLower === 'pelanggan'
      ) {
        if (lines.length > 1) continue;
      }

      const name = cols[0] || 'Tanpa Nama';
      const phone = cols[1] || '-';
      const email = cols[2] || '';
      const preferences = cols[3] || 'Tidak ada preferensi khusus';

      customers.push({
        id: `c_import_hl_${Math.random().toString(36).substring(2, 9)}`,
        name,
        phone,
        email,
        preferences,
        points: 10,
        orderCount: 0,
        totalSpent: 0,
        joinDate: new Date().toISOString().split('T')[0]
      });
    }
  }

  return customers;
}

// Format currency into Indonesian Rupiah format
export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
}
