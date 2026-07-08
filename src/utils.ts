import { Transaction, UserProfile } from './types';
import { jsPDF } from 'jspdf';

/**
 * Formats a number to Indian Rupee currency format (e.g., ₹1,50,000).
 * Handles the unique Indian dual-comma system.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats a number to Indian currency representation using 'Rs.' instead of the Unicode symbol '₹'.
 * This prevents font-rendering corruption in standard PDF engines like Helvetica.
 */
export function formatPDFCurrency(amount: number): string {
  const isNegative = amount < 0;
  const absVal = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(absVal);
  return `${isNegative ? '-' : ''}Rs. ${formatted}`;
}

/**
 * Converts YYYY-MM-DD to Indian date format (DD/MM/YYYY).
 */
export function formatIndianDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

/**
 * Gets the month and year label in a user-friendly format (e.g., "July 2026").
 */
export function formatMonthYear(dateStr: string): string {
  if (!dateStr) return '';
  // Can accept "YYYY-MM" or "YYYY-MM-DD"
  const parts = dateStr.split('-');
  if (parts.length < 2) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed month
  
  const dateObj = new Date(year, month, 1);
  return dateObj.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

/**
 * Exports transactions to a beautiful PDF statement using Indian standards.
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

async function loadPoppinsFonts(doc: jsPDF): Promise<boolean> {
  try {
    const regularUrl = 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/poppins/Poppins-Regular.ttf';
    const boldUrl = 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/poppins/Poppins-Bold.ttf';

    const [regRes, boldRes] = await Promise.all([
      fetch(regularUrl),
      fetch(boldUrl)
    ]);

    if (!regRes.ok || !boldRes.ok) {
      throw new Error('Failed to fetch Poppins fonts');
    }

    const [regBuf, boldBuf] = await Promise.all([
      regRes.arrayBuffer(),
      boldRes.arrayBuffer()
    ]);

    const regBase64 = arrayBufferToBase64(regBuf);
    const boldBase64 = arrayBufferToBase64(boldBuf);

    doc.addFileToVFS('Poppins-Regular.ttf', regBase64);
    doc.addFont('Poppins-Regular.ttf', 'Poppins', 'normal');

    doc.addFileToVFS('Poppins-Bold.ttf', boldBase64);
    doc.addFont('Poppins-Bold.ttf', 'Poppins', 'bold');

    return true;
  } catch (error) {
    console.warn('Could not load Poppins, falling back to Helvetica:', error);
    return false;
  }
}

/**
 * Renders the original SVG logo to a high-resolution PNG data URI.
 */
async function renderSvgLogoToPng(): Promise<string> {
  return new Promise((resolve) => {
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none" width="200" height="200">
      <defs>
        <linearGradient id="tealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#2E8A99" />
          <stop offset="100%" stop-color="#0B4F5C" />
        </linearGradient>
        <linearGradient id="greenArrowGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#15803D" />
          <stop offset="50%" stop-color="#22C55E" />
          <stop offset="100%" stop-color="#86EFAC" />
        </linearGradient>
        <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#F8FAFC" />
          <stop offset="30%" stop-color="#CBD5E1" />
          <stop offset="70%" stop-color="#64748B" />
          <stop offset="100%" stop-color="#E2E8F0" />
        </linearGradient>
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="1" dy="1" stdDeviation="1" flood-opacity="0.2" />
        </filter>
      </defs>

      {/* Outer circular arrows */}
      <g>
        <path
          d="M 55,145 A 70,70 0 0,1 140,55"
          stroke="url(#tealGrad)"
          stroke-width="10"
          stroke-linecap="round"
        />
        <path
          d="M 125,50 L 148,50 L 142,75 Z"
          fill="#2E8A99"
        />

        <path
          d="M 145,55 A 70,70 0 0,1 60,145"
          stroke="url(#tealGrad)"
          stroke-width="10"
          stroke-linecap="round"
        />
        <path
          d="M 75,150 L 52,150 L 58,125 Z"
          fill="#2E8A99"
        />
      </g>

      {/* Bar Chart Bars */}
      <g>
        <rect
          x="68"
          y="110"
          width="16"
          height="35"
          rx="3"
          fill="#166534"
        />
        <rect
          x="88"
          y="90"
          width="16"
          height="55"
          rx="3"
          fill="#15803D"
        />
        <rect
          x="108"
          y="70"
          width="16"
          height="75"
          rx="3"
          fill="#22C55E"
        />
      </g>

      {/* Rising Arrow path */}
      <g>
        <path
          d="M 55,130 L 85,95 L 125,55"
          stroke="url(#greenArrowGrad)"
          stroke-width="8"
          stroke-linecap="round"
        />
        <path
          d="M 115,55 L 132,48 L 125,65 Z"
          fill="#86EFAC"
        />
      </g>

      {/* Silver Rupee symbol on Bar 3 */}
      <text
        x="114"
        y="112"
        font-family="sans-serif"
        font-weight="900"
        font-size="24"
        fill="url(#silverGrad)"
        filter="url(#shadow)"
      >
        ₹
      </text>
    </svg>`;

    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, 400, 400);
        const pngData = canvas.toDataURL('image/png');
        URL.revokeObjectURL(url);
        resolve(pngData);
      } else {
        URL.revokeObjectURL(url);
        resolve('');
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve('');
    };
    img.src = url;
  });
}

/**
 * Exports transactions to a beautiful PDF statement using Indian standards.
 */
export async function exportToPDF(
  user: UserProfile,
  transactions: Transaction[],
  selectedMonth: string // YYYY-MM
) {
  // Filter transactions for the selected month and sort in ascending chronological order (Small to big)
  const filtered = transactions
    .filter(t => t.date.startsWith(selectedMonth))
    .sort((a, b) => a.date.localeCompare(b.date));
  const totalSpent = filtered.reduce((sum, t) => sum + t.amount, 0);
  const balance = user.salary - totalSpent;

  // Initialize jsPDF document (standard A4, vertical, mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Dynamic Font configuration
  let font = 'helvetica';
  const poppinsLoaded = await loadPoppinsFonts(doc);
  if (poppinsLoaded) {
    font = 'Poppins';
  }
  const italicStyle = font === 'Poppins' ? 'normal' : 'italic';
  
  // Custom Color Theme: Teal / Slate / Crimson Accent
  const primaryColor = [13, 148, 136];   // Teal-600
  const secondaryColor = [30, 41, 59];  // Slate-800
  const lightBgColor = [241, 245, 249];  // Slate-100
  const accentColor = [220, 38, 38];    // Crimson Red-600
  const grayColor = [100, 116, 139];    // Slate-500

  // 1. Draw Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 38, 'F');

  // Draw Outer Badge (White Circle) for the original logo
  const logoCx = 24;
  const logoCy = 19;
  const logoBadgeR = 12.5;

  doc.setFillColor(255, 255, 255);
  doc.ellipse(logoCx, logoCy, logoBadgeR, logoBadgeR, 'F');

  // Insert original high-res logo PNG from SVG
  const logoPng = await renderSvgLogoToPng();
  if (logoPng) {
    doc.addImage(logoPng, 'PNG', logoCx - 9.5, logoCy - 9.5, 19, 19);
  }

  // App Logo/Branding text next to the white logo badge
  doc.setTextColor(255, 255, 255);
  doc.setFont(font, 'bold');
  doc.setFontSize(20);
  doc.text('Spend Wisely', 39, 21);

  // Subtitle
  doc.setFont(font, 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(204, 251, 241); // Light Teal-100 text
  doc.text('SPEND TRACKER STATEMENT', 39, 27);

  // 2. Right Aligned Metadata in Banner
  doc.setFont(font, 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('OFFICIAL RECORD', 150, 20);
  doc.setFont(font, 'normal');
  doc.setFontSize(8);
  const formattedToday = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  doc.text(`Generated: ${formattedToday}`, 150, 26);

  let y = 48;
  
  // 3. User Profile & Monthly Financial Summary (Gray Card)
  const cardHeight = 38;
  doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
  doc.rect(14, y, 182, cardHeight, 'F');
  
  // Outer frame for the card
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.rect(14, y, 182, cardHeight, 'D');

  doc.setFont(font, 'bold');
  doc.setFontSize(10);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text('LEDGER ACCOUNT SUMMARY', 20, y + 8);

  doc.setFont(font, 'normal');
  doc.setFontSize(8);
  doc.text(`Name:                ${user.name}`, 20, y + 18);
  doc.text(`Statement Period:    ${formatMonthYear(selectedMonth)}`, 20, y + 26);

  // Middle column values (Financial labels and numbers)
  doc.setFont(font, 'bold');
  doc.setFontSize(8);
  doc.text('Base Salary:', 84, y + 16);
  doc.setFont(font, 'normal');
  doc.text(`${formatPDFCurrency(user.salary)}`, 112, y + 16);

  doc.setFont(font, 'bold');
  doc.text('Total Spent:', 84, y + 23);
  doc.setFont(font, 'normal');
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text(`- ${formatPDFCurrency(totalSpent)}`, 112, y + 23);

  doc.setFont(font, 'bold');
  if (balance >= 0) {
    doc.setTextColor(22, 163, 74); // Green-600
  } else {
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  }
  doc.text('Remaining:', 84, y + 30);
  doc.text(`${formatPDFCurrency(balance)}`, 112, y + 30);

  // Reset colors
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);

  // 3b. Vector Pie Chart Drawing inside the card (right side)
  const cx = 142;
  const cy = y + 19;
  const r = 10;

  // Pie chart helper function using standard filled triangles
  const drawSector = (startAngleDeg: number, endAngleDeg: number, fillRgb: number[]) => {
    const diff = endAngleDeg - startAngleDeg;
    if (diff <= 0.1) return;
    
    if (diff >= 359.9) {
      doc.setFillColor(fillRgb[0], fillRgb[1], fillRgb[2]);
      doc.ellipse(cx, cy, r, r, 'F');
      return;
    }
    
    const startRad = (startAngleDeg * Math.PI) / 180;
    const endRad = (endAngleDeg * Math.PI) / 180;
    
    doc.setFillColor(fillRgb[0], fillRgb[1], fillRgb[2]);
    const steps = 40;
    for (let i = 0; i < steps; i++) {
      const angle1 = startRad + (endRad - startRad) * (i / steps);
      const angle2 = startRad + (endRad - startRad) * ((i + 1) / steps);
      
      const x1 = cx + r * Math.cos(angle1);
      const y1 = cy + r * Math.sin(angle1);
      const x2 = cx + r * Math.cos(angle2);
      const y2 = cy + r * Math.sin(angle2);
      
      doc.triangle(cx, cy, x1, y1, x2, y2, 'F');
    }
  };

  const categoryColors: Record<string, number[]> = {
    'Rent & Housing': [37, 99, 235],         // Blue-600
    'Food & Groceries': [217, 119, 6],       // Amber-600
    'Bills & Utilities': [79, 70, 229],      // Indigo-600
    'Transport & Commute': [8, 145, 178],    // Cyan-600
    'Dining & Entertainment': [225, 29, 72], // Rose-600
    'Investments & Savings': [5, 150, 105],  // Emerald-600
    'Shopping': [147, 51, 234],              // Purple-600
    'Healthcare & Insurance': [220, 38, 38], // Red-600
    'EMI & Loan': [13, 148, 136],             // Teal-600
    'Other Expenses': [71, 85, 105],         // Slate-600
  };

  interface PieSlice {
    name: string;
    amount: number;
    percentage: number;
    color: number[];
  }

  const slices: PieSlice[] = [];
  if (totalSpent === 0) {
    slices.push({
      name: 'No expenses',
      amount: 0,
      percentage: 100,
      color: [203, 213, 225] // Slate-300
    });
  } else {
    const categoryTotals: Record<string, number> = {};
    filtered.forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    const sortedCategories = Object.entries(categoryTotals)
      .filter(([_, amt]) => amt > 0)
      .sort((a, b) => b[1] - a[1]);

    sortedCategories.forEach(([cat, amt]) => {
      slices.push({
        name: cat,
        amount: amt,
        percentage: (amt / totalSpent) * 100,
        color: categoryColors[cat] || [100, 116, 139]
      });
    });
  }

  // Draw slices
  let currentAngle = -90;
  slices.forEach(slice => {
    const nextAngle = currentAngle + (360 * slice.percentage) / 100;
    drawSector(currentAngle, nextAngle, slice.color);
    currentAngle = nextAngle;
  });

  // Outer border circle for high polish
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.ellipse(cx, cy, r, r, 'D');

  // Legend for Pie Chart
  const legendX = 158;
  slices.forEach((slice, idx) => {
    const itemY = y + 8 + idx * 7;
    doc.setFillColor(slice.color[0], slice.color[1], slice.color[2]);
    doc.rect(legendX, itemY - 2.2, 2.5, 2.5, 'F');
    doc.setFont(font, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    
    let displayName = slice.name;
    if (displayName.length > 18) {
      displayName = displayName.substring(0, 16) + '..';
    }
    doc.text(`${displayName} (${slice.percentage.toFixed(0)}%)`, legendX + 4.5, itemY);
  });

  // Reset colors
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);

  y += 45;

  // 4. Detailed Logs Section Header
  doc.setFont(font, 'bold');
  doc.setFontSize(11);
  doc.text('Statement', 14, y);
  
  y += 5;
  
  // Table Column Headers
  doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.rect(14, y, 182, 8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont(font, 'bold');
  doc.text('Date', 18, y + 5.5);
  doc.text('Category', 40, y + 5.5);
  doc.text('Expense Item / Description', 78, y + 5.5);
  doc.text('Amount (INR)', 162, y + 5.5);

  y += 8;

  // Render transactions
  doc.setFont(font, 'normal');
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);

  if (filtered.length === 0) {
    doc.setFont(font, italicStyle);
    doc.setFontSize(9);
    doc.text('No matching transaction entries logged for this period.', 18, y + 8);
  } else {
    filtered.forEach((t, index) => {
      // Check for page boundary (Standard A4 height is 297mm)
      if (y > 265) {
        doc.addPage();
        y = 20;
        
        // Render a compact Table Header on the new page
        doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.rect(14, y, 182, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont(font, 'bold');
        doc.setFontSize(8.5);
        doc.text('Date', 18, y + 5.5);
        doc.text('Category', 40, y + 5.5);
        doc.text('Expense Item / Description', 78, y + 5.5);
        doc.text('Amount (INR)', 162, y + 5.5);
        
        y += 8;
        doc.setFont(font, 'normal');
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      }

      // Zebra striping for table readability
      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252); // Very light slate-50
        doc.rect(14, y, 182, 8, 'F');
      }

      doc.setFont(font, 'normal');
      doc.setFontSize(8.5);
      doc.text(formatIndianDate(t.date), 18, y + 5.5);
      doc.text(t.category, 40, y + 5.5);
      
      // Combine title and description nicely
      let displayTitle = t.title;
      if (t.description) {
        displayTitle += ` — ${t.description}`;
      }
      if (displayTitle.length > 44) {
        displayTitle = displayTitle.substring(0, 41) + '...';
      }
      doc.text(displayTitle, 78, y + 5.5);

      // Numeric values right aligned relatively
      doc.setFont(font, 'bold');
      doc.text(formatPDFCurrency(t.amount), 162, y + 5.5);

      y += 8;
    });
  }

  // Draw Page Number Footers on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, 280, 196, 280); // Thin baseline
    
    doc.setFontSize(7.5);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.setFont(font, 'normal');
    doc.text(
      `Spend Wisely Ledger Service • Strictly Encrypted Local Storage • Sheet Period: ${formatMonthYear(selectedMonth)}`,
      14,
      285
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      182,
      285
    );
  }

  // Download File as PDF
  const [yearStr, monthStr] = selectedMonth.split('-'); // e.g., "2026", "07"
  const cleanUserName = user.name.trim().replace(/\s+/g, '_');
  const fileName = `${cleanUserName}_${monthStr}_${yearStr}_Statement.pdf`;
  doc.save(fileName);
}

