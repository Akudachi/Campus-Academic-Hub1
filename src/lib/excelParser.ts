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
  subjectCode?: string;
  subjectName?: string;
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
  let subCodeCol = -1;
  let subNameCol = -1;

  for (let i = 0; i < Math.min(5, rawRows.length); i++) {
    const row = rawRows[i].map((c) => String(c).trim().toLowerCase());
    
    // Sl.No detection to avoid false code match
    const isSlNo = (c: string) => /^(sl\.?\s*no\.?|s\.?\s*no\.?|sr\.?\s*no\.?|serial|#|no\.?)$/i.test(c);

    const foundCode = row.findIndex((c) => 
      !isSlNo(c) && (
        c.includes('teacher code') ||
        c.includes('faculty code') ||
        c.includes('emp code') ||
        c.includes('staff code') ||
        c.includes('tcode') ||
        c.includes('teacher id') ||
        c.includes('faculty id') ||
        c.includes('staff id') ||
        c.includes('emp id') ||
        c === 'code' ||
        c === 'id' ||
        (c.includes('code') && !c.includes('sub') && !c.includes('course'))
      )
    );

    const foundName = row.findIndex((c) => 
      c.includes('faculty name') ||
      c.includes('teacher name') ||
      c.includes('staff name') ||
      c.includes('professor') ||
      (c.includes('name') && !c.includes('sub') && !c.includes('course') && !c.includes('dept'))
    );

    if (foundCode !== -1 || (foundName !== -1 && row.length >= 2)) {
      headerIndex = i;
      codeCol = foundCode;
      nameCol = foundName;
      deptCol = row.findIndex((c) => c.includes('dept') || c.includes('branch') || c.includes('department'));
      emailCol = row.findIndex((c) => c.includes('email') || c.includes('mail'));
      desigCol = row.findIndex((c) => c.includes('desig') || c.includes('role') || c.includes('position'));
      qualCol = row.findIndex((c) => c.includes('qual') || c.includes('degree'));
      subCodeCol = row.findIndex((c) => c.includes('subject code') || c.includes('course code') || c.includes('sub code') || c.includes('paper code') || c === 'code' && foundCode !== row.indexOf(c));
      subNameCol = row.findIndex((c) => c.includes('subject title') || c.includes('subject name') || c.includes('course title') || c.includes('course name') || c.includes('sub name') || c === 'subject' || c === 'course');
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
    let subjectCode = '';
    let subjectName = '';

    if (headerIndex !== -1) {
      if (codeCol !== -1 && row[codeCol] !== undefined && String(row[codeCol]).trim()) {
        code = String(row[codeCol]).trim().toUpperCase();
      }
      if (nameCol !== -1 && row[nameCol] !== undefined && String(row[nameCol]).trim()) {
        name = String(row[nameCol]).trim();
      }
      if (deptCol !== -1 && row[deptCol]) dept = normalizeDepartmentCode(String(row[deptCol]));
      if (emailCol !== -1 && row[emailCol]) email = String(row[emailCol]).trim().toLowerCase();
      if (desigCol !== -1 && row[desigCol]) designation = String(row[desigCol]).trim();
      if (qualCol !== -1 && row[qualCol]) qualification = String(row[qualCol]).trim();
      if (subCodeCol !== -1 && row[subCodeCol]) subjectCode = String(row[subCodeCol]).trim().toUpperCase();
      if (subNameCol !== -1 && row[subNameCol]) subjectName = String(row[subNameCol]).trim();
    } else {
      // Positional check for columns: Sl.No, Teacher Code, Teacher Name, Subject Code, Subject Name, Dept...
      const col0 = String(row[0] || '').trim();
      const col1 = String(row[1] || '').trim();
      const col2 = String(row[2] || '').trim();
      const col3 = String(row[3] || '').trim();
      const col4 = String(row[4] || '').trim();

      if (/^\d+$/.test(col0) && col1) {
        // Col 0 is Serial Number (1, 2, 3...)
        code = col1.toUpperCase();
        name = col2 || `Faculty ${col1}`;
        if (col3 && /^[A-Z0-9]{4,10}$/i.test(col3)) {
          // [Sl, Code, Name, SubjectCode, SubjectName, Dept, Email...]
          subjectCode = col3.toUpperCase();
          subjectName = col4;
          dept = row[5] ? normalizeDepartmentCode(String(row[5])) : 'CSE';
          email = row[6] ? String(row[6]).trim().toLowerCase() : '';
          designation = row[7] ? String(row[7]).trim() : 'Assistant Professor';
          qualification = row[8] ? String(row[8]).trim() : 'M.Tech';
        } else {
          dept = row[3] ? normalizeDepartmentCode(String(row[3])) : 'CSE';
          email = row[4] ? String(row[4]).trim().toLowerCase() : '';
          designation = row[5] ? String(row[5]).trim() : 'Assistant Professor';
          qualification = row[6] ? String(row[6]).trim() : 'M.Tech';
        }
      } else {
        code = col0.toUpperCase();
        name = col1 || `Faculty ${col0}`;
        dept = row[2] ? normalizeDepartmentCode(String(row[2])) : 'CSE';
        email = row[3] ? String(row[3]).trim().toLowerCase() : '';
        designation = row[4] ? String(row[4]).trim() : 'Assistant Professor';
        qualification = row[5] ? String(row[5]).trim() : 'M.Tech';
      }
    }

    if (code || name) {
      results.push({
        teacherCode: code,
        name: name || `Faculty ${code}`,
        department: dept || 'CSE',
        email: email || '',
        designation: designation || 'Assistant Professor',
        qualification: qualification || 'M.Tech',
        subjectCode: subjectCode || undefined,
        subjectName: subjectName || undefined,
      });
    }
  }

  return results;
}

/**
 * Download sample Excel template for Faculty / Teachers with Subject Assignment columns
 */
export function downloadTeacherSampleExcel() {
  const data = [
    { 'Sl.No': 1, 'Teacher Code': 'T001', 'Faculty Name': 'Dr. Sanjay Pujari', Department: 'ECE', Email: 'sanjay.pujari@campus.edu', 'Subject Code': 'BEC701', 'Subject Title': 'Microwave Engineering and Antenna Theory', Designation: 'Professor & HOD', Qualification: 'Ph.D' },
    { 'Sl.No': 2, 'Teacher Code': 'T002', 'Faculty Name': 'Mr. Mallikarjun Biradar', Department: 'ECE', Email: 'mallikarjun.b@campus.edu', 'Subject Code': 'BEC702', 'Subject Title': 'Computer Networks and Protocols', Designation: 'Associate Professor', Qualification: 'M.Tech' },
    { 'Sl.No': 3, 'Teacher Code': 'T003', 'Faculty Name': 'Ms. Laxmi R Motagi', Department: 'ECE', Email: 'laxmi.m@campus.edu', 'Subject Code': 'BEC703', 'Subject Title': 'Wireless Communication Systems', Designation: 'Assistant Professor', Qualification: 'M.Tech' },
    { 'Sl.No': 4, 'Teacher Code': 'T004', 'Faculty Name': 'Mr. Prashant A H.', Department: 'ECE', Email: 'prashant.ah@campus.edu', 'Subject Code': 'BEC714D', 'Subject Title': 'Radar Communication', Designation: 'Assistant Professor', Qualification: 'M.Tech' },
    { 'Sl.No': 5, 'Teacher Code': 'T005', 'Faculty Name': 'Dr. Ramesh Kulkarni', Department: 'CSE', Email: 'ramesh.k@campus.edu', 'Subject Code': 'BCS701', 'Subject Title': 'Cloud Computing and Virtualization', Designation: 'Professor & HOD', Qualification: 'Ph.D' },
  ];

  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 8 },   // Sl.No
    { wch: 14 },  // Teacher Code
    { wch: 25 },  // Faculty Name
    { wch: 14 },  // Department
    { wch: 26 },  // Email
    { wch: 15 },  // Subject Code
    { wch: 38 },  // Subject Title
    { wch: 22 },  // Designation
    { wch: 14 },  // Qualification
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Faculty_Roster');
  XLSX.writeFile(wb, 'Faculty_Subject_Import_Template.xlsx');
}

/**
 * Download sample Excel template for Subject & Faculty Allocation
 */
export function downloadSubjectAllocationSampleExcel(deptCode: string = 'ECE', semNum: number = 7) {
  const data = [
    { 'Sl No': 1, 'Teacher Code': 'T001', 'Teacher Name': 'Dr. Sanjay Pujari', 'Subject Code': 'BEC701', 'Subject Title': 'Microwave Engineering and Antenna Theory', Credit: 4, Department: deptCode, Semester: semNum },
    { 'Sl No': 2, 'Teacher Code': 'T002', 'Teacher Name': 'Mr. Mallikarjun Biradar', 'Subject Code': 'BEC702', 'Subject Title': 'Computer Networks and Protocols', Credit: 4, Department: deptCode, Semester: semNum },
    { 'Sl No': 3, 'Teacher Code': 'T003', 'Teacher Name': 'Ms. Laxmi R Motagi', 'Subject Code': 'BEC703', 'Subject Title': 'Wireless Communication Systems', Credit: 4, Department: deptCode, Semester: semNum },
    { 'Sl No': 4, 'Teacher Code': 'T004', 'Teacher Name': 'Mr. Prashant A H.', 'Subject Code': 'BEC714D', 'Subject Title': 'Radar Communication', Credit: 3, Department: deptCode, Semester: semNum },
    { 'Sl No': 5, 'Teacher Code': 'T005', 'Teacher Name': 'Mr. Amit Ghantimath', 'Subject Code': 'BME755D', 'Subject Title': 'Non-conventional energy resources', Credit: 3, Department: deptCode, Semester: semNum },
    { 'Sl No': 6, 'Teacher Code': 'T006', 'Teacher Name': 'Mr. Avadhut Ambole', 'Subject Code': 'BECL701', 'Subject Title': 'Microwave Engineering Lab(IPCC)', Credit: 2, Department: deptCode, Semester: semNum },
    { 'Sl No': 7, 'Teacher Code': 'T002', 'Teacher Name': 'Mr. Mallikarjun Biradar', 'Subject Code': 'BECL702', 'Subject Title': 'Computer Networks and Protocols Lab', Credit: 2, Department: deptCode, Semester: semNum },
    { 'Sl No': 8, 'Teacher Code': 'T002', 'Teacher Name': 'Mr. Mallikarjun Biradar', 'Subject Code': 'BEC786', 'Subject Title': 'Major Project Phase-II', Credit: 6, Department: deptCode, Semester: semNum },
  ];

  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 8 },   // Sl No
    { wch: 14 },  // Teacher Code
    { wch: 25 },  // Teacher Name
    { wch: 15 },  // Subject Code
    { wch: 40 },  // Subject Title
    { wch: 8 },   // Credit
    { wch: 14 },  // Department
    { wch: 10 },  // Semester
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Subject_Faculty');
  XLSX.writeFile(wb, `Subject_Faculty_Allocation_${deptCode}_Sem${semNum}.xlsx`);
}

/**
 * Universal Parser for Subject-Faculty Excel or CSV files
 */
export async function parseSubjectAllocationFile(file: File): Promise<any[]> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'xlsx' || extension === 'xls') {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' });
    return parseSubjectAllocationRawRows(rawRows);
  } else {
    const text = await file.text();
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const rawRows = lines.map((line) => {
      let inQuote = false;
      let curr = '';
      const cells: string[] = [];
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"' || ch === "'") inQuote = !inQuote;
        else if ((ch === ',' || ch === '\t') && !inQuote) {
          cells.push(curr.trim());
          curr = '';
        } else curr += ch;
      }
      cells.push(curr.trim());
      return cells;
    });
    return parseSubjectAllocationRawRows(rawRows);
  }
}

export function parseSubjectAllocationRawRows(rawRows: any[][]): any[] {
  if (!rawRows || rawRows.length === 0) return [];

  let headerIdx = -1;
  let slNoIdx = -1;
  let tCodeIdx = -1;
  let tNameIdx = -1;
  let sCodeIdx = -1;
  let sNameIdx = -1;
  let creditIdx = -1;
  let deptIdx = -1;
  let semIdx = -1;

  for (let i = 0; i < Math.min(5, rawRows.length); i++) {
    const row = rawRows[i].map((c) => String(c || '').toLowerCase().trim().replace(/[^a-z0-9]/g, ''));
    if (row.some((c) => ['teachercode', 'teachername', 'subjectcode', 'subjecttitle', 'coursename', 'credit'].includes(c))) {
      headerIdx = i;
      row.forEach((h, idx) => {
        if (['slno', 'sno', 'serialno', 'srno', 'sl', 'no'].includes(h)) slNoIdx = idx;
        else if (['teachercode', 'staffcode', 'facultycode', 'tcode', 'teacherid'].includes(h)) tCodeIdx = idx;
        else if (['teachername', 'staffname', 'facultyname', 'facultymember', 'teacher', 'faculty', 'professor'].includes(h)) tNameIdx = idx;
        else if (['subjectcode', 'coursecode', 'subcode', 'scode', 'papercode'].includes(h)) sCodeIdx = idx;
        else if (['subjecttitle', 'subjectname', 'coursetitle', 'coursename', 'subject', 'course'].includes(h)) sNameIdx = idx;
        else if (['credit', 'credits', 'cr'].includes(h)) creditIdx = idx;
        else if (['department', 'dept', 'branch'].includes(h)) deptIdx = idx;
        else if (['semester', 'sem'].includes(h)) semIdx = idx;
      });
      break;
    }
  }

  const startRow = headerIdx !== -1 ? headerIdx + 1 : 0;
  const results: any[] = [];

  for (let i = startRow; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length < 2 || row.every((c: any) => !c || String(c).trim() === '')) continue;

    let slNo = slNoIdx !== -1 && row[slNoIdx] ? parseInt(String(row[slNoIdx]), 10) : results.length + 1;
    let tCode = tCodeIdx !== -1 ? String(row[tCodeIdx] || '').trim() : '';
    let tName = tNameIdx !== -1 ? String(row[tNameIdx] || '').trim() : '';
    let sCode = sCodeIdx !== -1 ? String(row[sCodeIdx] || '').trim() : '';
    let sName = sNameIdx !== -1 ? String(row[sNameIdx] || '').trim() : '';
    let creditVal = creditIdx !== -1 ? parseInt(String(row[creditIdx]), 10) : 4;
    let deptVal = deptIdx !== -1 && row[deptIdx] ? String(row[deptIdx]).trim() : '';
    let semVal = semIdx !== -1 && row[semIdx] ? parseInt(String(row[semIdx]), 10) : 0;

    // Positional fallback
    if (row.length >= 5) {
      if (!tCode && row[1]) tCode = String(row[1]).trim();
      if (!tName && row[2]) tName = String(row[2]).trim();
      if (!sCode && row[3]) sCode = String(row[3]).trim();
      if (!sName && row[4]) sName = String(row[4]).trim();
      if (isNaN(creditVal) && row[5]) creditVal = parseInt(String(row[5]), 10) || 4;
    }

    if (tName || tCode || sName || sCode) {
      results.push({
        slNo: isNaN(slNo) ? results.length + 1 : slNo,
        teacherCode: tCode.toUpperCase(),
        teacherName: tName,
        subjectCode: sCode.toUpperCase(),
        subjectName: sName,
        credits: isNaN(creditVal) || creditVal <= 0 ? 4 : creditVal,
        departmentCode: (deptVal || 'ECE').toUpperCase(),
        semesterNumber: isNaN(semVal) || semVal <= 0 ? 7 : semVal,
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
