# Memory Builder — Component Architecture

> Component tree, props, and interfaces for the Memory Builder feature.
> Reference document for [`MEMORY-BUILDER-PLAN.md`](./MEMORY-BUILDER-PLAN.md)

---

## Component Tree

```
App
└── MemoryBuilderProvider          # Context provider (wrap in page-client.tsx)
    └── PageClient
        ├── RackCard
        │   └── AddToMemoryButton  # +🧠 button (inline, uses context)
        ├── RackModal
        │   └── AddToMemoryButton
        ├── SlotPicker             # Enhanced with bank selection
        ├── Sidebar
        │   └── MemoryBuilderPanel # Main sidebar widget
        │       ├── MemoryBankCard # Individual bank display (×4)
        │       └── ExportButton
        ├── MemoryBuilderMobile    # Mobile bottom sheet (Sprint 5)
        │   └── MemoryBankCard
        └── MemoryBuilderExpanded  # Full-screen modal (Sprint 4)
            ├── MemoryBankCard
            ├── FxSlotEditor       # Per-slot editing modal
            ├── MemorySettingsPanel
            └── RackSearchInline   # Quick search within builder
```

---

## Context & State

### MemoryBuilderContext

**File:** `src/context/MemoryBuilderContext.tsx`

```tsx
import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import type { Rack } from '../types/rack';

// ─── Types ───────────────────────────────────────────────────────────────────

export type BankId = 'A' | 'B' | 'C' | 'D';

export interface MemoryBuilderBank {
  rackId: string | null;
  rackTitle: string | null;
}

export interface MemoryBuilderState {
  slotNumber: number;
  memoryName: string;
  banks: Record<BankId, MemoryBuilderBank>;
  collapsed: boolean;
  targetBank: BankId | null;
}

export type MemoryBuilderAction =
  | { type: 'ASSIGN_RACK'; bank: BankId; rack: Rack }
  | { type: 'ASSIGN_RACK_NEXT_EMPTY'; rack: Rack }
  | { type: 'REMOVE_RACK'; bank: BankId }
  | { type: 'CLEAR_ALL' }
  | { type: 'SET_SLOT_NUMBER'; slot: number }
  | { type: 'SET_MEMORY_NAME'; name: string }
  | { type: 'SET_TARGET_BANK'; bank: BankId | null }
  | { type: 'TOGGLE_COLLAPSED' }
  | { type: 'LOAD_STATE'; state: MemoryBuilderState };

export interface MemoryBuilderContextValue {
  state: MemoryBuilderState;
  
  // Actions
  assignRack: (bank: BankId, rack: Rack) => void;
  assignRackToNextEmpty: (rack: Rack) => BankId | null;  // Returns assigned bank or null if full
  removeRack: (bank: BankId) => void;
  clearAll: () => void;
  setSlotNumber: (slot: number) => void;
  setMemoryName: (name: string) => void;
  setTargetBank: (bank: BankId | null) => void;
  toggleCollapsed: () => void;
  
  // Derived
  filledBankCount: number;
  nextEmptyBank: BankId | null;
  canExport: boolean;
  
  // Helpers
  getRackData: (rackId: string) => Rack | null;
}

// ─── Initial State ───────────────────────────────────────────────────────────

const STORAGE_KEY = 'rc505_memory_builder';

const initialState: MemoryBuilderState = {
  slotNumber: 50,
  memoryName: '',
  banks: {
    A: { rackId: null, rackTitle: null },
    B: { rackId: null, rackTitle: null },
    C: { rackId: null, rackTitle: null },
    D: { rackId: null, rackTitle: null },
  },
  collapsed: false,
  targetBank: null,
};

// ─── Reducer ─────────────────────────────────────────────────────────────────

function reducer(state: MemoryBuilderState, action: MemoryBuilderAction): MemoryBuilderState {
  switch (action.type) {
    case 'ASSIGN_RACK': {
      const newBanks = { ...state.banks };
      newBanks[action.bank] = {
        rackId: action.rack.id,
        rackTitle: action.rack.title,
      };
      // Auto-set memory name from first rack if empty
      const memoryName = state.memoryName || action.rack.title.slice(0, 12);
      return { ...state, banks: newBanks, memoryName };
    }
    
    case 'ASSIGN_RACK_NEXT_EMPTY': {
      const order: BankId[] = ['A', 'B', 'C', 'D'];
      const emptyBank = order.find(b => state.banks[b].rackId === null);
      if (!emptyBank) return state;
      return reducer(state, { type: 'ASSIGN_RACK', bank: emptyBank, rack: action.rack });
    }
    
    case 'REMOVE_RACK': {
      const newBanks = { ...state.banks };
      newBanks[action.bank] = { rackId: null, rackTitle: null };
      return { ...state, banks: newBanks };
    }
    
    case 'CLEAR_ALL':
      return { ...initialState, collapsed: state.collapsed };
    
    case 'SET_SLOT_NUMBER':
      return { ...state, slotNumber: Math.max(1, Math.min(99, action.slot)) };
    
    case 'SET_MEMORY_NAME':
      return { ...state, memoryName: action.name.slice(0, 12) };
    
    case 'SET_TARGET_BANK':
      return { ...state, targetBank: action.bank };
    
    case 'TOGGLE_COLLAPSED':
      return { ...state, collapsed: !state.collapsed };
    
    case 'LOAD_STATE':
      return action.state;
    
    default:
      return state;
  }
}

// ─── Provider Component ──────────────────────────────────────────────────────

interface MemoryBuilderProviderProps {
  children: ReactNode;
  racks: Rack[];  // Pass racks.json data here
}

export function MemoryBuilderProvider({ children, racks }: MemoryBuilderProviderProps) {
  const [state, dispatch] = useReducer(reducer, initialState);
  
  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        dispatch({ type: 'LOAD_STATE', state: parsed });
      }
    } catch (e) {
      console.warn('Failed to load memory builder state:', e);
    }
  }, []);
  
  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save memory builder state:', e);
    }
  }, [state]);
  
  // Derived values
  const filledBankCount = (['A', 'B', 'C', 'D'] as BankId[])
    .filter(b => state.banks[b].rackId !== null).length;
  
  const nextEmptyBank = (['A', 'B', 'C', 'D'] as BankId[])
    .find(b => state.banks[b].rackId === null) ?? null;
  
  const canExport = filledBankCount > 0;
  
  // Helper to resolve rack data
  const getRackData = (rackId: string): Rack | null => {
    return racks.find(r => r.id === rackId) ?? null;
  };
  
  // Action creators
  const assignRack = (bank: BankId, rack: Rack) => {
    dispatch({ type: 'ASSIGN_RACK', bank, rack });
  };
  
  const assignRackToNextEmpty = (rack: Rack): BankId | null => {
    if (!nextEmptyBank) return null;
    dispatch({ type: 'ASSIGN_RACK_NEXT_EMPTY', rack });
    return nextEmptyBank;
  };
  
  const removeRack = (bank: BankId) => {
    dispatch({ type: 'REMOVE_RACK', bank });
  };
  
  const clearAll = () => {
    dispatch({ type: 'CLEAR_ALL' });
  };
  
  const setSlotNumber = (slot: number) => {
    dispatch({ type: 'SET_SLOT_NUMBER', slot });
  };
  
  const setMemoryName = (name: string) => {
    dispatch({ type: 'SET_MEMORY_NAME', name });
  };
  
  const setTargetBank = (bank: BankId | null) => {
    dispatch({ type: 'SET_TARGET_BANK', bank });
  };
  
  const toggleCollapsed = () => {
    dispatch({ type: 'TOGGLE_COLLAPSED' });
  };
  
  const value: MemoryBuilderContextValue = {
    state,
    assignRack,
    assignRackToNextEmpty,
    removeRack,
    clearAll,
    setSlotNumber,
    setMemoryName,
    setTargetBank,
    toggleCollapsed,
    filledBankCount,
    nextEmptyBank,
    canExport,
    getRackData,
  };
  
  return (
    <MemoryBuilderContext.Provider value={value}>
      {children}
    </MemoryBuilderContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

const MemoryBuilderContext = createContext<MemoryBuilderContextValue | null>(null);

export function useMemoryBuilder(): MemoryBuilderContextValue {
  const context = useContext(MemoryBuilderContext);
  if (!context) {
    throw new Error('useMemoryBuilder must be used within MemoryBuilderProvider');
  }
  return context;
}
```

---

## Component Props

### MemoryBuilderPanel

**File:** `src/components/MemoryBuilderPanel.tsx`

```tsx
interface MemoryBuilderPanelProps {
  // No props needed — uses context
}

// Internal state
interface PanelState {
  showTooltip: BankId | null;    // Which bank tooltip is visible
  highlightBank: BankId | null;  // Which bank to pulse (after add)
}
```

**Key behaviors:**
- Reads all state from `useMemoryBuilder()`
- Handles drag-and-drop for file import (Sprint 3)
- Manages local UI state (tooltips, animations)

### MemoryBankCard

**File:** `src/components/MemoryBankCard.tsx`

```tsx
interface MemoryBankCardProps {
  bank: BankId;
  data: MemoryBuilderBank;
  isTarget: boolean;          // Highlighted as next assignment target
  isHighlighted: boolean;     // Pulse animation after add
  onRemove: () => void;
  onClick: () => void;        // Select as target / expand
  
  // Optional: for expanded view
  showSlots?: boolean;        // Show individual FX slots
  rackData?: Rack | null;     // Full rack data for slot display
}

// Derived display data (compute in component)
interface BankDisplayData {
  inputFxCount: number;       // 0-4
  trackFxCount: number;       // 0-4
  genreColor: string;         // CSS color from GENRE_COLORS
  primaryGenre: string;       // First genre tag
}
```

**Slot indicators:**
```tsx
// Render 8 dots: 4 for Input FX, 4 for Track FX
function SlotIndicators({ inputCount, trackCount }: { inputCount: number; trackCount: number }) {
  return (
    <div className="memory-bank-slots">
      <span className="slot-group input">
        {[0,1,2,3].map(i => (
          <span key={i} className={i < inputCount ? 'filled' : 'empty'} />
        ))}
      </span>
      <span className="slot-label">In</span>
      <span className="slot-group track">
        {[0,1,2,3].map(i => (
          <span key={i} className={i < trackCount ? 'filled' : 'empty'} />
        ))}
      </span>
      <span className="slot-label">Tr</span>
    </div>
  );
}
```

### AddToMemoryButton

**File:** `src/components/AddToMemoryButton.tsx`

```tsx
interface AddToMemoryButtonProps {
  rack: Rack;
  className?: string;
}

// Internal state
interface ButtonState {
  status: 'idle' | 'success' | 'error';
  message: string | null;  // Toast message
}
```

**Implementation:**
```tsx
export function AddToMemoryButton({ rack, className }: AddToMemoryButtonProps) {
  const { assignRackToNextEmpty, nextEmptyBank, state } = useMemoryBuilder();
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const assignedBank = assignRackToNextEmpty(rack);
    if (assignedBank) {
      setStatus('success');
      setTimeout(() => setStatus('idle'), 1500);
    } else {
      setStatus('error');
      // Show "All banks full" toast
      setTimeout(() => setStatus('idle'), 2000);
    }
  };
  
  const isDisabled = nextEmptyBank === null;
  
  return (
    <button
      className={cn('rack-action-btn', className, status)}
      onClick={handleClick}
      disabled={isDisabled}
      title={isDisabled ? 'All banks full' : `Add to Bank ${nextEmptyBank}`}
      aria-label="Add to Memory Builder"
    >
      {status === 'success' ? '✓🧠' : '+🧠'}
    </button>
  );
}
```

### SlotPicker (Enhanced)

**File:** `src/components/SlotPicker.tsx`

```tsx
interface SlotPickerProps {
  rack: Rack;                              // Rack being downloaded
  onConfirm: (slot: number, bank: BankId) => void;
  onCancel: () => void;
  memoryBuilderState?: MemoryBuilderState; // Optional: show current bank status
}

interface SlotPickerState {
  slot: number;
  selectedBank: BankId;
}
```

### FxSlotEditor (Sprint 4)

**File:** `src/components/FxSlotEditor.tsx`

```tsx
interface FxSlotEditorProps {
  bank: BankId;
  slot: 'A' | 'B' | 'C' | 'D';
  section: 'input' | 'track';
  initialFx: MemoryFxSlot | null;
  onSave: (slot: MemoryFxSlot) => void;
  onCancel: () => void;
}

interface FxSlotEditorState {
  fxType: string;
  enabled: boolean;
  params: Record<string, string>;  // param name → value
  searchQuery: string;             // FX type search
}
```

### MemorySettingsPanel (Sprint 4)

**File:** `src/components/MemorySettingsPanel.tsx`

```tsx
interface MemorySettingsPanelProps {
  settings: {
    master?: MemoryMasterSettings;
    tracks?: MemoryTrackSettings[];
  };
  onChange: (settings: MemorySettingsPanelProps['settings']) => void;
}

interface TrackRowProps {
  track: MemoryTrackSettings;
  onChange: (track: MemoryTrackSettings) => void;
  expanded: boolean;
  onToggle: () => void;
}
```

### ImportPreviewModal (Sprint 3)

**File:** `src/components/ImportPreviewModal.tsx`

```tsx
interface ImportPreviewModalProps {
  config: MemoryConfig;
  warnings: string[];
  onConfirm: () => void;
  onCancel: () => void;
}
```

### MemoryBuilderExpanded (Sprint 4)

**File:** `src/components/MemoryBuilderExpanded.tsx`

```tsx
interface MemoryBuilderExpandedProps {
  onClose: () => void;
}

interface ExpandedState {
  selectedBank: BankId | null;     // Which bank is expanded
  editingSlot: {                   // Which slot is being edited
    bank: BankId;
    slot: 'A' | 'B' | 'C' | 'D';
    section: 'input' | 'track';
  } | null;
  searchQuery: string;
  settingsExpanded: boolean;
}
```

---

## Utility Functions

### Export Functions

**File:** `src/lib/rc0-download.ts` (extend)

```tsx
import type { MemoryBuilderState, BankId } from '../context/MemoryBuilderContext';
import type { Rack } from '../types/rack';
import type { MemoryConfig } from '../types/memory-config';

/**
 * Build a MemoryConfig from the builder state.
 * Merges multiple racks into a single memory configuration.
 */
export function builderStateToMemoryConfig(
  state: MemoryBuilderState,
  racks: Rack[],
): MemoryConfig {
  const getRack = (id: string) => racks.find(r => r.id === id);
  
  // Collect all banks
  const inputFxBanks: MemoryBank[] = [];
  const trackFxBanks: MemoryBank[] = [];
  
  for (const bankId of ['A', 'B', 'C', 'D'] as BankId[]) {
    const bankData = state.banks[bankId];
    if (!bankData.rackId) continue;
    
    const rack = getRack(bankData.rackId);
    if (!rack) continue;
    
    // Convert rack FX to MemoryBank format
    // ... (implementation uses existing fxSlotsToSection logic)
  }
  
  return {
    version: 1,
    slotNumber: state.slotNumber,
    name: state.memoryName || 'MEMORY',
    inputFx: { banks: inputFxBanks },
    trackFx: { banks: trackFxBanks },
    // ... other fields
  };
}

/**
 * Download a complete memory from builder state.
 */
export async function downloadMemoryFromBuilder(
  state: MemoryBuilderState,
  racks: Rack[],
): Promise<void> {
  const config = builderStateToMemoryConfig(state, racks);
  // ... existing download logic using memoryConfigToRc0Pair
}
```

### Import Functions (Sprint 3)

**File:** `src/lib/rc0-import.ts`

```tsx
import type { MemoryConfig } from '../types/memory-config';

interface ImportResult {
  config: MemoryConfig;
  warnings: string[];
  slotNumber: number | null;  // Parsed from filename
}

/**
 * Import a pair of RC0 files into a MemoryConfig.
 */
export async function importMemoryFiles(
  fileA: File,
  fileB: File,
): Promise<ImportResult> {
  // 1. Read file contents
  // 2. Parse slot number from filename
  // 3. Determine which file is "active" (higher count)
  // 4. Parse FX assignments using existing parseRC0PairActive
  // 5. Collect warnings for unknown FX types
  // 6. Return result
}

/**
 * Parse slot number from RC0 filename.
 * e.g., "MEMORY042A.RC0" → 42
 */
export function parseSlotFromFilename(filename: string): number | null {
  const match = filename.match(/MEMORY(\d{3})[AB]\.RC0/i);
  return match ? parseInt(match[1], 10) : null;
}
```

---

## CSS Classes

Add to `src/app/globals.css`:

```css
/* ─── MEMORY BUILDER ─────────────────────────────────────────────────────── */

.memory-builder {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.25s ease-out;
}

.memory-builder.collapsed {
  /* Only header visible */
}

.memory-builder-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
}

.memory-builder-header h4 {
  font-size: 0.9rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}

.memory-builder-collapse-btn {
  background: none;
  border: none;
  color: var(--text2);
  font-size: 0.8rem;
  cursor: pointer;
  padding: 4px;
  transition: transform 0.2s;
}

.memory-builder.collapsed .memory-builder-collapse-btn {
  transform: rotate(180deg);
}

/* Collapsed status bar */
.memory-builder-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px 12px;
  font-size: 0.75rem;
  color: var(--text2);
}

.memory-builder-dots {
  display: flex;
  gap: 3px;
}

.memory-builder-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--border);
}

.memory-builder-dots span.filled {
  background: var(--accent);
}

/* Input fields */
.memory-builder-fields {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-bottom: 1px solid var(--border);
}

.memory-builder-field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.memory-builder-field label {
  font-size: 0.75rem;
  color: var(--text2);
  width: 40px;
}

.memory-builder-field input[type="text"] {
  flex: 1;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-size: 0.85rem;
}

.memory-builder-slot-input {
  display: flex;
  align-items: center;
  gap: 4px;
}

.memory-builder-slot-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.memory-builder-slot-btn:hover:not(:disabled) {
  background: var(--accent2);
  border-color: var(--accent2);
  color: #fff;
}

.memory-builder-slot-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.memory-builder-slot-input input {
  width: 50px;
  text-align: center;
  padding: 4px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-size: 0.95rem;
  font-weight: 600;
}

/* Bank grid */
.memory-builder-banks {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 12px 16px;
}

/* Individual bank card */
.memory-bank {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.2s ease-out;
}

.memory-bank:hover {
  border-color: var(--text2);
  transform: translateY(-1px);
}

.memory-bank.empty {
  border-style: dashed;
  background: transparent;
}

.memory-bank.target {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(0, 212, 255, 0.15);
  animation: pulse-glow 1.5s ease-in-out infinite;
}

.memory-bank.highlighted {
  animation: scale-in 0.3s ease-out;
}

.memory-bank-letter {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 4px;
}

.memory-bank-letter.a { color: var(--accent); }
.memory-bank-letter.b { color: var(--accent2); }
.memory-bank-letter.c { color: var(--accent3); }
.memory-bank-letter.d { color: var(--accent5); }

.memory-bank-slots {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 0.6rem;
  color: var(--text2);
  margin-bottom: 6px;
}

.memory-bank-slots .slot-group {
  display: flex;
  gap: 2px;
}

.memory-bank-slots .slot-group span {
  width: 6px;
  height: 6px;
  border-radius: 1px;
  background: var(--border);
}

.memory-bank-slots .slot-group span.filled {
  background: currentColor;
}

.memory-bank-slots .slot-group.input span.filled {
  background: var(--accent);
}

.memory-bank-slots .slot-group.track span.filled {
  background: var(--accent3);
}

.memory-bank-slots .slot-label {
  margin: 0 4px;
  opacity: 0.6;
}

.memory-bank-title {
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.memory-bank.empty .memory-bank-title {
  color: var(--text2);
  font-weight: 400;
}

.memory-bank-genre {
  font-size: 0.65rem;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.memory-bank-add-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: var(--text2);
  opacity: 0.5;
  padding: 8px 0;
}

/* Actions */
.memory-builder-actions {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.memory-builder-export-btn {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, var(--accent2), var(--accent));
  color: #fff;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.memory-builder-export-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0, 212, 255, 0.25);
}

.memory-builder-export-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.memory-builder-clear-btn {
  background: none;
  border: none;
  color: var(--text2);
  font-size: 0.8rem;
  cursor: pointer;
  padding: 6px;
  text-align: center;
}

.memory-builder-clear-btn:hover {
  color: var(--accent3);
}

/* Drag-drop zone (Sprint 3) */
.memory-builder.drag-over {
  border-color: var(--accent);
  background: rgba(0, 212, 255, 0.05);
}

.memory-builder-drop-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 10, 15, 0.9);
  border-radius: 12px;
  z-index: 10;
}

.memory-builder-drop-overlay span {
  padding: 20px 32px;
  border: 2px dashed var(--accent);
  border-radius: 12px;
  color: var(--accent);
  font-weight: 600;
}

/* Add to Memory button states */
.rack-action-btn.add-to-memory.success {
  background: rgba(0, 255, 136, 0.15);
  border-color: var(--accent4);
  color: var(--accent4);
}

.rack-action-btn.add-to-memory.error {
  background: rgba(255, 92, 160, 0.15);
  border-color: var(--accent3);
}
```

---

## Integration Checklist

### page-client.tsx

```tsx
import { MemoryBuilderProvider } from '../context/MemoryBuilderContext';
import rackData from '../data/racks.json';

export default function PageClient() {
  // ... existing code
  
  return (
    <MemoryBuilderProvider racks={rackData.racks}>
      {/* ... existing JSX */}
    </MemoryBuilderProvider>
  );
}
```

### Sidebar.tsx

```tsx
import MemoryBuilderPanel from './MemoryBuilderPanel';

export default function Sidebar() {
  return (
    <aside className="sidebar desktop-only">
      <div className="sidebar-inner">
        {/* Memory Builder first */}
        <MemoryBuilderPanel />
        
        {/* ... existing widgets */}
      </div>
    </aside>
  );
}
```

### RackCard.tsx

```tsx
import { AddToMemoryButton } from './AddToMemoryButton';

// In the rack-actions div:
<div className="rack-actions">
  <button className="rack-action-btn" onClick={handleLike}>
    {isLiked ? '❤️' : '🤍'} <span className="action-count">{likeCount}</span>
  </button>
  <button className="rack-action-btn" onClick={handleShare}>
    📤 <span className="action-count">{shareCount}</span>
  </button>
  
  {/* NEW: Add to Memory */}
  <AddToMemoryButton rack={rack} />
  
  <button className="rack-action-btn" onClick={handleDownload}>
    💾
  </button>
  <button className="rack-action-btn expand-btn" onClick={() => setModalOpen(true)}>
    ⛶
  </button>
</div>
```
