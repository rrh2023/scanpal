import { create } from "zustand";

export type ScanMode = "solve" | "summarize" | "ocr";

export type Scan = {
  id: string;
  createdAt: string;
  mode: ScanMode;
  inputText: string;
  resultText: string;
};

type ScanState = {
  scans: Scan[];
  monthlyCount: number;
  addScan: (scan: Scan) => void;
  resetMonthly: () => void;
};

export const useScanStore = create<ScanState>((set) => ({
  scans: [],
  monthlyCount: 0,
  addScan: (scan) =>
    set((s) => ({ scans: [scan, ...s.scans], monthlyCount: s.monthlyCount + 1 })),
  resetMonthly: () => set({ monthlyCount: 0 }),
}));
