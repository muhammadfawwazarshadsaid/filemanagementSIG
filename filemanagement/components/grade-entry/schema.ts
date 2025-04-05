// app/components/schema.ts

// Tipe dasar yang Anda gunakan
export interface Student {
  id: string;
  name: string;
  class: string;
}

export interface AssessmentComponent {
  id: string;
  name: string;
  weight: number;
}

export type GradesState = Record<string, Record<string, number | null>>;

// Tipe data baris tabel yang sudah dikalkulasi
export interface GradeTableRowData extends Record<string, any> { // Izinkan properti dinamis untuk skor komponen
  id: string; // student id
  name: string;
  class: string;
  finalScore: number | null;
  // Skor komponen akan ditambahkan di sini secara dinamis, misal: [componentId: string]: number | null;
}

// Tipe untuk opsi filter faceted
export interface FilterOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

// Tipe untuk meta tabel (digunakan di columns dan data-table)
export interface GradeTableMeta {
    editingRowId: string | null;
    isEditingAll: boolean;
    grades: GradesState;
    handleGradeChange: (studentId: string, componentId: string, value: string) => void;
    isSavingRow: string | null;
    isSavingAll: boolean;
    handleEditRowTrigger: (rowId: string) => void;
    handleCancelRow: (rowId: string) => void;
    handleSaveRow: (rowId: string) => Promise<void>;
}