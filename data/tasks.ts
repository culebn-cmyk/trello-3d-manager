export type Task = {
  id: string;
  title: string;
  level: string;
  assignedTo: string;
  dueDate: string;
  priority: string;

  mapId: string;
  bdgId: string;
  nameJoin: string;

  notes: string;
  image: string;

  // --- Properti Sinkronisasi Spreadsheet ---
  status: string; 
  progress?: number;
  archived?: boolean;
  lat?: number | null;
  lon?: number | null;
  height?: number | null;
  gdriveLink?: string;
};

export type Columns = {
  [key: string]: Task[];
};

// Local proxy route that forwards requests to Google Apps Script
export const SPREADSHEET_API_URL = "/api";

// Menggunakan 6 kolom spesifik alur kerja software
export const initialColumns: Columns = {
  TODO: [],
  WIP_BLENDER: [],
  WIP_REVIT: [],
  REVIEW: [],
  DONE_BLENDER: [],
  DONE_REVIT: [],
};