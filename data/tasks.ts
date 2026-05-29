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
  lat?: number | null;
  lon?: number | null;
  height?: number | null;
  gdriveLink?: string;
};

export type Columns = {
  [key: string]: Task[];
};

// URL API Google Apps Script Web App kamu
export const SPREADSHEET_API_URL = "https://script.google.com/macros/s/AKfycbxmxpojeor2QCX2yWY02gZnHEg7KTa9r7JbItRIMTMevMqWC-kH-fRZpeZLlEgPTgsq3g/exec";

// Menggunakan 6 kolom spesifik alur kerja software
export const initialColumns: Columns = {
  TODO: [],
  WIP_BLENDER: [],
  WIP_REVIT: [],
  REVIEW: [],
  DONE_BLENDER: [],
  DONE_REVIT: [],
};