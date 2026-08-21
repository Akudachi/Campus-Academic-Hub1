import * as XLSX from 'xlsx';

export interface ParsedStudentRow {
  usn: string;
  name: string;
  department: string;
  semester: number;
  section: string;
  email?: string;
}

export interface ParsedTeacherRow {
  teacherCode: string;
  name: string;
  department: string;
  email?: string;
  designation?: string;
  qualification?: string;
}

export function normalizeDepartmentCode(rawDept: string): string {
  const d = (rawDept || '').trim().toUpperCase();
  if (!d) return 'CSE';
  if (['CSE', 'CS', 'COMPUTER SCIENCE', 'CSE-AI', 'CSE (AI)', 'COMP SCI'].some((k) => d.includes(k) || d === k)) {
    return 'CSE';
  }
  if (['ECE', 'EC', 'ELECTRONICS', 'E&C', 'COMMUNICATION'].some((k) => d.includes(k) || d === k)) {
    return 'ECE';
  }
  if (['ISE', 'IS', 'INFORMATION SCIENCE', 'INFO SCI', 'IT'].some((k) => d.includes(k) || d === k)) {
    return 'ISE';
  }
  if (['MECH', 'ME', 'MECHANICAL', 'MECHATRONICS'].some((k) => d.includes(k) || d === k)) {
    return 'MECH';
  }
  if (['CIVIL', 'CV'].some((k) => d.includes(k) || d === k)) {
    return 'CIVIL';
  }
  if (['AIML', 'AI/ML', 'DATA SCIENCE', 'AIDS'].some((k) => d.includes(k) || d === k)) {
    return 'CSE';
  }
  return d.length <= 4 ? d : 'CSE';
}

/**
 * Checks if a string looks like a valid student USN / Roll number
 */
function isValidUsnFormat(str: string): boolean {
  if (!str) return false;
  const clean = str.trim().toUpperCase();
  // Filter out headers or footer words
  const blacklisted = [
    'USN', 'ROLL', 'ROLL NO', 'ROLL NUMBER', 'REG NO', 'REGISTRATION',
    'SL NO', 'SL.NO', 'SLNO', 'S.NO', 'SERIAL', 'NAME', 'STUDENT NAME',
    'TOTAL', 'SIGNATURE', 'STAFF', 'TEACHER', 'FACULTY', 'REMARKS', 'DATE'
  ];
  if (blacklisted.includes(clean)) return false;
  // Must be at least 4 characters and contain at least one digit or alphanumeric
  if (clean.length < 4 || clean.length > 25) return false;
  return /^[A-Z0-9_-]+$/i.test(clean) && /[0-9]/.test(clean);
}

/**
 * Options for student parsing
 */
export interface StudentParseOptions {
  defaultDept?: string;
  defaultSemester?: number;
  defaultSection?: string;
}

/**
 * Parses raw text or file array buffer using xlsx into Student rows
 * Specifically handles 3-column format:
 * Column 1: Sl No
 * Column 2: USN
 * Column 3: Name
 * Ignores any extra columns or unrelated rows.
 */
export async function parseStudentFile(file: File, options?: StudentParseOptions): Promise<ParsedStudentRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  return parseStudentRawRows(rawRows, options);
}

export function parseStudentText(text: string, options?: StudentParseOptions): ParsedStudentRow[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const rawRows = lines.map((line) => {
    // Split by comma, tab, semicolon or pipe, handling quotes if any
    const parts = line.split(/[,\t;|]/).map((p) => p.replace(/^["']|["']$/g, '').trim());
    return parts;
  });

  return parseStudentRawRows(rawRows, options);
}

export function parseStudentRawRows(rawRows: any[][], options?: StudentParseOptions): ParsedStudentRow[] {
  if (!rawRows || rawRows.length === 0) return [];

  const defaultDept = options?.defaultDept || 'CSE';
  const defaultSem = options?.defaultSemester || 4;
  const defaultSec = options?.defaultSection || 'A';

  // Detect header row if present
  let headerIndex = -1;
  let usnCol = -1;
  let nameCol = -1;

  for (let i = 0; i < Math.min(6, rawRows.length); i++) {
    const row = rawRows[i].map((c) => String(c).trim().toLowerCase());
    const foundUsn = row.findIndex((c) =>
      c === 'usn' || c.includes('usn') || c.includes('roll') || c.includes('reg no') || c.includes('roll no')
    );
    const foundName = row.findIndex((c) =>
      c === 'name' || c.includes('name') || c.includes('student name') || c.includes('student')
    );

    if (foundUsn !== -1 || (foundName !== -1 && row.some((c) => c.includes('sl') || c.includes('s.no') || c.includes('#')))) {
      headerIndex = i;
      usnCol = foundUsn;
      nameCol = foundName;
      break;
    }
  }

  // If header wasn't explicitly named, detect by pattern
  // Check if Col 0 is SlNo (numbers 1, 2, 3) and Col 1 is USN, Col 2 is Name
  if (usnCol === -1 || nameCol === -1) {
    // Look at first non-empty data row
    const testRow = rawRows.find((r) => r && r.length >= 2 && r.some((c: any) => c && String(c).trim() !== ''));
    if (testRow) {
      const col0 = String(testRow[0] || '').trim();
      const col1 = String(testRow[1] || '').trim();
      const col2 = String(testRow[2] || '').trim();

      // If Col 0 is a number (Sl No) and Col 1 has digits (USN)
      if (/^\d+$/.test(col0) && isValidUsnFormat(col1)) {
        usnCol = 1;
        nameCol = col2 ? 2 : -1;
      } else if (isValidUsnFormat(col0)) {
        // Col 0 is USN directly, Col 1 is Name
        usnCol = 0;
        nameCol = 1;
      } else if (isValidUsnFormat(col1)) {
        usnCol = 1;
        nameCol = col2 ? 2 : 0;
      }
    }
  }

  // Fallback defaults if still unresolved
  if (usnCol === -1) usnCol = 1; // Default: Col 1 is USN (after Col 0 Sl No)
  if (nameCol === -1) nameCol = 2; // Default: Col 2 is Name

  const results: ParsedStudentRow[] = [];
  const startRow = headerIndex !== -1 ? headerIndex + 1 : 0;

  for (let i = startRow; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0) continue;

    // Extract USN and Name only (ignore other extra columns)
    let rawUsn = '';
    let rawName = '';

    if (row.length > usnCol && row[usnCol] !== undefined) {
      rawUsn = String(row[usnCol]).trim().toUpperCase();
    }
    if (row.length > nameCol && row[nameCol] !== undefined) {
      rawName = String(row[nameCol]).trim();
    }

    // Fallback: If Col 0 is actually USN and Col 1 is Name
    if (!isValidUsnFormat(rawUsn)) {
      const altUsn = String(row[0] || '').trim().toUpperCase();
      if (isValidUsnFormat(altUsn)) {
        rawUsn = altUsn;
        rawName = String(row[1] || rawName).trim();
      }
    }

    // If still not a valid USN, check if other rows present should be ignored ("if other rows present dont add it")
    if (!isValidUsnFormat(rawUsn)) {
      // Ignore this row (skip non-student rows, headers, footers, blank padding, remarks)
      continue;
    }

    // Clean student name
    let cleanName = rawName.replace(/^["']|["']$/g, '').trim();
    if (!cleanName || cleanName.toLowerCase() === 'null' || cleanName.toLowerCase() === 'undefined') {
      cleanName = `Student ${rawUsn}`;
    }

    // Derive department from USN if evident (e.g., 2KL23CS... -> CSE, 2KL23EC... -> ECE, 2KL23IS... -> ISE)
    let studentDept = defaultDept;
    if (rawUsn.includes('CS') || rawUsn.includes('CSE')) studentDept = 'CSE';
    else if (rawUsn.includes('EC') || rawUsn.includes('ECE')) studentDept = 'ECE';
    else if (rawUsn.includes('IS') || rawUsn.includes('ISE')) studentDept = 'ISE';
    else if (rawUsn.includes('ME') || rawUsn.includes('MECH')) studentDept = 'MECH';
    else if (rawUsn.includes('CV') || rawUsn.includes('CIVIL')) studentDept = 'CIVIL';

    results.push({
      usn: rawUsn,
      name: cleanName,
      department: studentDept,
      semester: defaultSem,
      section: defaultSec,
      email: `${rawUsn.toLowerCase()}@student.campus.edu`,
    });
  }

  return results;
}

/**
 * Parses raw text or file array buffer using xlsx into Teacher rows
 */
export async function parseTeacherFile(file: File): Promise<ParsedTeacherRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  return parseTeacherRawRows(rawRows);
}

export function parseTeacherText(text: string): ParsedTeacherRow[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const rawRows = lines.map((line) => {
    const parts = line.split(/[,\t;|]/).map((p) => p.replace(/^["']|["']$/g, '').trim());
    return parts;
  });

  return parseTeacherRawRows(rawRows);
}

function parseTeacherRawRows(rawRows: any[][]): ParsedTeacherRow[] {
  if (!rawRows || rawRows.length === 0) return [];

  let headerIndex = -1;
  let codeCol = -1;
  let nameCol = -1;
  let deptCol = -1;
  let emailCol = -1;
  let desigCol = -1;
  let qualCol = -1;

  for (let i = 0; i < Math.min(5, rawRows.length); i++) {
    const row = rawRows[i].map((c) => String(c).trim().toLowerCase());
    const foundCode = row.findIndex((c) => c.includes('code') || c.includes('id') || c.includes('teacher id') || c.includes('faculty id'));
    const foundName = row.findIndex((c) => c.includes('name') || c.includes('faculty') || c.includes('teacher'));

    if (foundCode !== -1 || (foundName !== -1 && row.length >= 2)) {
      headerIndex = i;
      codeCol = foundCode;
      nameCol = foundName;
      deptCol = row.findIndex((c) => c.includes('dept') || c.includes('branch') || c.includes('department'));
      emailCol = row.findIndex((c) => c.includes('email') || c.includes('mail'));
      desigCol = row.findIndex((c) => c.includes('desig') || c.includes('role') || c.includes('position'));
      qualCol = row.findIndex((c) => c.includes('qual') || c.includes('degree'));
      break;
    }
  }

  const results: ParsedTeacherRow[] = [];
  const startRow = headerIndex !== -1 ? headerIndex + 1 : 0;

  for (let i = startRow; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0 || row.every((c: any) => !c || String(c).trim() === '')) continue;

    let code = '';
    let name = '';
    let dept = 'CSE';
    let email = '';
    let designation = 'Assistant Professor';
    let qualification = 'M.Tech';

    if (headerIndex !== -1) {
      if (codeCol !== -1 && row[codeCol]) code = String(row[codeCol]).trim().toUpperCase();
      if (nameCol !== -1 && row[nameCol]) name = String(row[nameCol]).trim();
      if (deptCol !== -1 && row[deptCol]) dept = normalizeDepartmentCode(String(row[deptCol]));
      if (emailCol !== -1 && row[emailCol]) email = String(row[emailCol]).trim().toLowerCase();
      if (desigCol !== -1 && row[desigCol]) designation = String(row[desigCol]).trim();
      if (qualCol !== -1 && row[qualCol]) qualification = String(row[qualCol]).trim();
    } else {
      code = row[0] ? String(row[0]).trim().toUpperCase() : '';
      name = row[1] ? String(row[1]).trim() : '';
      dept = row[2] ? normalizeDepartmentCode(String(row[2])) : 'CSE';
      email = row[3] ? String(row[3]).trim().toLowerCase() : '';
      designation = row[4] ? String(row[4]).trim() : 'Assistant Professor';
      qualification = row[5] ? String(row[5]).trim() : 'M.Tech';
    }

    if (code || name) {
      results.push({
        teacherCode: code,
        name: name || `Faculty ${code}`,
        department: dept || 'CSE',
        email: email || '',
        designation: designation || 'Assistant Professor',
        qualification: qualification || 'M.Tech',
      });
    }
  }

  return results;
}

/**
 * Download sample Excel template strictly with 3 columns:
 * 1st column: Sl.No
 * 2nd column: USN
 * 3rd column: Name
 */
export function downloadStudentSampleExcel() {
  const data = [
    { 'Sl.No': 1, USN: '2KL23CS011', Name: 'Ananya Rao' },
    { 'Sl.No': 2, USN: '2KL23CS012', Name: 'Vignesh Iyer' },
    { 'Sl.No': 3, USN: '2KL23CS013', Name: 'Rohit Sharma' },
    { 'Sl.No': 4, USN: '2KL23CS014', Name: 'Pooja Hegde' },
    { 'Sl.No': 5, USN: '2KL23CS015', Name: 'Divya Kulkarni' },
    { 'Sl.No': 6, USN: '2KL23CS016', Name: 'Aditya Deshpande' },
    { 'Sl.No': 7, USN: '2KL23CS017', Name: 'Sneha Patil' },
    { 'Sl.No': 8, USN: '2KL23CS018', Name: 'Rahul Verma' },
  ];

  const ws = XLSX.utils.json_to_sheet(data);
  // Set column widths
  ws['!cols'] = [
    { wch: 8 },  // Sl.No
    { wch: 16 }, // USN
    { wch: 25 }, // Name
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Student_List');
  XLSX.writeFile(wb, 'student_enrollment_template.xlsx');
}

export function downloadTeacherSampleExcel() {
  const data = [
    { 'Teacher Code': 'T008', 'Faculty Name': 'Dr. Sanjay Hegde', Department: 'CSE', Email: 'sanjay.h@campus.edu', Designation: 'Professor', Qualification: 'Ph.D' },
    { 'Teacher Code': 'T009', 'Faculty Name': 'Prof. Kavita Rao', Department: 'ECE', Email: 'kavita.r@campus.edu', Designation: 'Assistant Professor', Qualification: 'M.Tech' },
    { 'Teacher Code': 'T010', 'Faculty Name': 'Dr. Manjunath Swamy', Department: 'MECH', Email: 'manjunath.s@campus.edu', Designation: 'Associate Professor', Qualification: 'Ph.D' },
    { 'Teacher Code': 'T011', 'Faculty Name': 'Prof. Nithya Menon', Department: 'ISE', Email: 'nithya.m@campus.edu', Designation: 'Assistant Professor', Qualification: 'M.Tech' },
  ];

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Faculty_Master');
  XLSX.writeFile(wb, 'faculty_bulk_import_template.xlsx');
}
