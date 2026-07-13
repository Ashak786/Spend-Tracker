import { Transaction, UserProfile } from './types';

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
 * Gets the base salary and optional incentive for a user in a specific month,
 * taking into account any monthly overrides.
 */
export function getMonthlyIncomeDetails(user: UserProfile, monthYear: string) {
  if (user.monthlyIncomes && user.monthlyIncomes[monthYear]) {
    const override = user.monthlyIncomes[monthYear];
    return {
      salary: override.salary,
      incentive: override.incentive ?? null,
      isCustom: true,
    };
  }
  return {
    salary: user.salary,
    incentive: user.incentive ?? null,
    isCustom: false,
  };
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

async function loadPoppinsFonts(doc: any): Promise<boolean> {
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
 * Renders the original SVG logo or fetches the custom Google Drive logo to a high-resolution PNG data URI.
 */
async function renderSvgLogoToPng(): Promise<string> {
  return new Promise((resolve) => {
    const logoUrl = "https://lh3.googleusercontent.com/d/1nm8tjDQZ2x4j_ZOjtcwRdtqMpIOhsDUJ";
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    const renderSvgFallback = () => {
      const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none" width="200" height="200">
        <defs>
          <linearGradient id="logoBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1E3A8A" />
            <stop offset="50%" stop-color="#2563EB" />
            <stop offset="100%" stop-color="#1D4ED8" />
          </linearGradient>
          <linearGradient id="logoOrangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FB923C" />
            <stop offset="60%" stop-color="#EA580C" />
            <stop offset="100%" stop-color="#C2410C" />
          </linearGradient>
          <linearGradient id="arrowGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#2563EB" />
            <stop offset="60%" stop-color="#F97316" />
            <stop offset="100%" stop-color="#EA580C" />
          </linearGradient>
          <filter id="subtleShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="1" dy="2" stdDeviation="2" flood-opacity="0.15" />
          </filter>
        </defs>

        {/* OWL SILHOUETTE BODY (Deep Blue) */}
        <path
          d="M 40,55 C 35,25 50,15 65,22 C 80,30 120,30 135,22 C 150,15 165,25 160,55 C 155,90 155,140 140,165 C 125,190 75,190 60,165 C 45,140 45,90 40,55 Z"
          fill="url(#logoBlueGrad)"
          filter="url(#subtleShadow)"
        />

        {/* ORANGE EYEBROW / FOREHEAD TRIM */}
        <path
          d="M 47,45 C 55,30 75,32 90,42 C 100,48 100,48 110,42 C 125,32 145,30 153,45 C 155,50 145,55 135,50 C 120,42 110,50 100,58 C 90,50 80,42 65,50 C 55,55 45,50 47,45 Z"
          fill="url(#logoOrangeGrad)"
        />

        {/* OWL FACE EYE BACKGROUNDS (White patches) */}
        <circle cx="72" cy="70" r="26" fill="#FFFFFF" />
        <circle cx="128" cy="70" r="26" fill="#FFFFFF" />

        {/* OWL EYE OUTLINE (Blue) */}
        <circle cx="72" cy="70" r="20" fill="none" stroke="url(#logoBlueGrad)" stroke-width="4.5" />
        <circle cx="128" cy="70" r="20" fill="none" stroke="url(#logoBlueGrad)" stroke-width="4.5" />

        {/* PUPILS (Blue) */}
        <circle cx="72" cy="70" r="13" fill="#1E3A8A" />
        <circle cx="128" cy="70" r="13" fill="#1E3A8A" />

        {/* EYE REFLECTIONS */}
        <circle cx="68" cy="65" r="4.5" fill="#FFFFFF" />
        <circle cx="124" cy="65" r="4.5" fill="#FFFFFF" />
        <circle cx="77" cy="74" r="2" fill="#FFFFFF" />
        <circle cx="133" cy="74" r="2" fill="#FFFFFF" />

        {/* BEAK (Orange) */}
        <path
          d="M 93,76 L 107,76 L 100,99 Z"
          fill="url(#logoOrangeGrad)"
        />

        {/* WHITE CHEST EMBLEM AREA */}
        <path
          d="M 60,110 C 60,95 140,95 140,110 C 140,135 125,165 100,165 C 75,165 60,135 60,110 Z"
          fill="#FFFFFF"
        />

        {/* RIGHT ORANGE WING / SIDE BODY ACCENT */}
        <path
          d="M 140,110 C 152,110 162,130 152,155 C 142,175 120,175 120,175 C 120,175 135,160 140,140 C 143,125 140,110 140,110 Z"
          fill="url(#logoOrangeGrad)"
        />

        {/* RISING TREND ARROW */}
        <g>
          <path
            d="M 45,165 L 142,68"
            stroke="url(#arrowGrad)"
            stroke-width="11"
            stroke-linecap="round"
          />
          {/* ARROW HEAD */}
          <path
            d="M 124,65 L 152,61 L 148,89 Z"
            fill="url(#logoOrangeGrad)"
          />
        </g>

        {/* RUPEE SYMBOL (₹) inside chest */}
        <text
          x="100"
          y="143"
          font-family="sans-serif"
          font-weight="900"
          font-size="36"
          fill="#1E3A8A"
          text-anchor="middle"
        >
          ₹
        </text>
      </svg>`;

      const svgImg = new Image();
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      svgImg.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(svgImg, 0, 0, 400, 400);
          const pngData = canvas.toDataURL('image/png');
          URL.revokeObjectURL(url);
          resolve(pngData);
        } else {
          URL.revokeObjectURL(url);
          resolve('');
        }
      };
      svgImg.onerror = () => {
        URL.revokeObjectURL(url);
        resolve('');
      };
      svgImg.src = url;
    };

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Clear any background & clip context to a perfect circle to prevent corner overflow
          ctx.beginPath();
          ctx.arc(200, 200, 200, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(img, 0, 0, 400, 400);
          const pngData = canvas.toDataURL('image/png');
          resolve(pngData);
        } else {
          renderSvgFallback();
        }
      } catch (err) {
        console.warn("Failed drawing custom logo to canvas, falling back to SVG logo:", err);
        renderSvgFallback();
      }
    };

    img.onerror = () => {
      renderSvgFallback();
    };

    img.src = logoUrl;
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
  // Filter transactions for the selected month and sort in descending chronological order (Big to small)
  const filtered = transactions
    .filter(t => t.date.startsWith(selectedMonth))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  const totalSpent = filtered.reduce((sum, t) => sum + t.amount, 0);
  
  const { salary, incentive } = getMonthlyIncomeDetails(user, selectedMonth);
  const effectiveSalary = salary + (incentive || 0);
  const balance = effectiveSalary - totalSpent;

  // Dynamic import jsPDF to reduce initial bundle size and speed up site load
  const { jsPDF } = await import('jspdf');

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
  
  // Custom Color Theme: Deep Blue / Slate / Orange Accent
  const primaryColor = [30, 58, 138];   // Deep Blue (#1E3A8A)
  const secondaryColor = [30, 41, 59];  // Slate-800
  const lightBgColor = [241, 245, 249];  // Slate-100
  const accentColor = [234, 88, 12];    // Orange-600 (#EA580C)
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
  doc.text('SPEND WISELY', 39, 21);

  // Subtitle
  doc.setFont(font, 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(254, 215, 170); // Light Orange-200 text
  doc.text('SMART SPEND TRACKER', 39, 27);

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
  
  // Reset colors
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);

  const categoryColors: Record<string, number[]> = {
    'Rent & Housing': [37, 99, 235],         // Blue-600
    'Food & Groceries': [217, 119, 6],       // Amber-600
    'Bills & Utilities': [234, 88, 12],       // Orange-600
    'Transport & Commute': [8, 145, 178],    // Cyan-600
    'Dining & Entertainment': [225, 29, 72], // Rose-600
    'Investments & Savings': [5, 150, 105],  // Emerald-600
    'Shopping': [147, 51, 234],              // Purple-600
    'Healthcare & Insurance': [220, 38, 38], // Red-600
    'EMI & Loan': [13, 148, 136],             // Teal-600
    'Subscriptions': [79, 70, 229],          // Indigo-600
    'Credit Card': [124, 58, 237],           // Violet-600
    'Other Expenses': [236, 72, 153],        // Pink-600
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

  // Dynamic card height to perfectly fit the category legend list (4.5mm per category item)
  // Ensure the card height is tall enough to hold optional income items if present
  const minCardHeight = 38 + (incentive ? 6 : 0);
  const cardHeight = Math.max(minCardHeight, 12 + slices.length * 4.5);
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

  // Middle column values (Financial labels and numbers) - drawn dynamically downwards
  let summaryY = y + 16;
  doc.setFont(font, 'bold');
  doc.setFontSize(8);
  doc.text('Base Salary:', 72, summaryY);
  doc.setFont(font, 'normal');
  doc.text(`${formatPDFCurrency(salary)}`, 120, summaryY, { align: 'right' });
  summaryY += 6;

  if (incentive) {
    doc.setFont(font, 'bold');
    doc.text('Incentive / Bonus:', 72, summaryY);
    doc.setFont(font, 'normal');
    doc.text(`+ ${formatPDFCurrency(incentive)}`, 120, summaryY, { align: 'right' });
    summaryY += 6;
  }

  doc.setFont(font, 'bold');
  doc.text('Total Spent:', 72, summaryY);
  doc.setFont(font, 'normal');
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text(`- ${formatPDFCurrency(totalSpent)}`, 120, summaryY, { align: 'right' });
  summaryY += 6;

  doc.setFont(font, 'bold');
  if (balance >= 0) {
    doc.setTextColor(22, 163, 74); // Green-600
  } else {
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  }
  doc.text('Remaining:', 72, summaryY);
  doc.text(`${formatPDFCurrency(balance)}`, 120, summaryY, { align: 'right' });

  // Reset colors
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);

  // 3b. Vector Pie Chart Drawing inside the card (right side)
  const cx = 134;
  const cy = y + (cardHeight / 2);
  const r = 11;

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

  // Legend for Pie Chart (Centered vertically with respect to card height)
  const legendX = 148;
  const legendStartY = y + (cardHeight - (slices.length - 1) * 4.5) / 2 + 1;
  slices.forEach((slice, idx) => {
    const itemY = legendStartY + idx * 4.5;
    doc.setFillColor(slice.color[0], slice.color[1], slice.color[2]);
    doc.rect(legendX, itemY - 2.2, 2.5, 2.5, 'F');
    doc.setFont(font, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    
    let displayName = slice.name;
    if (displayName.length > 22) {
      displayName = displayName.substring(0, 20) + '..';
    }
    const pctStr = slice.percentage < 1 && slice.percentage > 0 ? slice.percentage.toFixed(1) : slice.percentage.toFixed(0);
    doc.text(`${displayName} (${pctStr}%)`, legendX + 4.5, itemY);
  });

  // Reset colors
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);

  y += cardHeight + 7;

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
  doc.text('Amount (INR)', 190, y + 5.5, { align: 'right' });

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
        doc.text('Amount (INR)', 190, y + 5.5, { align: 'right' });
        
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
      doc.text(formatPDFCurrency(t.amount), 190, y + 5.5, { align: 'right' });

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

