'use client';

import { useEffect, useMemo, useRef, useState, type ClipboardEvent, type ComponentType, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  ContactRound,
  Copy,
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Eye,
  ExternalLink,
  Globe,
  Home,
  Info,
  LayoutTemplate,
  ListChecks,
  Mail,
  MapPin,
  Pencil,
  PartyPopper,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Send,
  Store,
  Trash2,
  Upload,
  User,
  Users,
  MoreVertical,
  X,
  DollarSign,
  EyeOff,
  TrendingUp,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InvitationBuilder } from '@/components/invitation-builder';
import type { BuilderState } from '@/components/invitation-builder/types';
import { apiClient, Event, EventStats, EventType as ApiEventType, Expense, Gift, Guest, Template } from '@/lib/api-client';
import { EVENT_CATEGORY_BY_KEY, EVENT_CATEGORY_OPTIONS, EventFlowType } from '@/lib/event-categories';
import { getSavedMyTemplates, MyTemplateItem, removeMyTemplate, saveMyTemplate, syncMyTemplatesForEvent } from '@/lib/my-templates';
import { withProtectedRoute } from '@/lib/protected-route';

type TabId =
  | 'general'
  | 'guests'
  | 'gifts'
  | 'expenses'
  | 'edit'
  | 'schedule'
  | 'my-template'
  | 'template-shop'
  | 'qr';

type EditEventType = 'WEDDING' | 'CEREMONY' | 'BIRTHDAY' | 'HOUSEWARMING' | 'FUNERAL';

const EDIT_EVENT_TYPE_OPTIONS: Array<{ value: EditEventType; label: string }> = [
  { value: 'WEDDING', label: 'មង្គលការ' },
  { value: 'CEREMONY', label: 'បុណ្យទូទៅ' },
  { value: 'BIRTHDAY', label: 'ខួបកំណើត' },
  { value: 'HOUSEWARMING', label: 'ឡើងផ្ទះ' },
  { value: 'FUNERAL', label: 'បុណ្យសព' },
];

const GUEST_GROUP_OPTIONS = [
  { value: 'GROOM_SIDE', label: 'ខាងកូនកំលោះ' },
  { value: 'BRIDE_SIDE', label: 'ខាងកូនក្រមុំ' },
];

const GUEST_TAG_OPTIONS = [
  { value: 'HIGH_SCHOOL_FRIEND', label: 'មិត្តភក្តិវិទ្យាល័យ' },
  { value: 'COLLEGE_FRIEND', label: 'មិត្តភក្តិឧត្តមសិក្សា' },
  { value: 'FRIEND', label: 'មិត្តភក្តិ' },
  { value: 'TEAMWORK', label: 'ការងារក្រុម' },
  { value: 'RELATIVE', label: 'សាច់ញាតិ' },
  { value: 'OTHERS', label: 'ផ្សេងៗ' },
];

function RequiredStar() {
  return <span className="ml-1 text-red-500">*</span>;
}

type GiftRow = {
  id: string;
  guestId: string;
  guestName: string;
  phone?: string;
  eventId: string;
  paymentType: 'CASH' | 'KHQR';
  currencyType: 'USD' | 'KHR';
  amount: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

function EventDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const eventId = params.id as string;

  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [event, setEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [myTemplates, setMyTemplates] = useState<MyTemplateItem[]>([]);
  const [isTemplatesLoading, setIsTemplatesLoading] = useState(false);
  const [templateError, setTemplateError] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingGuest, setIsSubmittingGuest] = useState(false);
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);

  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestGroup, setGuestGroup] = useState('GROOM_SIDE');
  const [guestTag, setGuestTag] = useState('OTHERS');
  const [guestNote, setGuestNote] = useState('');
  const [guestSearch, setGuestSearch] = useState('');
  const [guestPage, setGuestPage] = useState(1);
  const [guestRowsPerPage, setGuestRowsPerPage] = useState(10);
  const [giftSearch, setGiftSearch] = useState('');
  const [giftRows, setGiftRows] = useState<GiftRow[]>([]);
  const [giftPage, setGiftPage] = useState(1);
  const [giftRowsPerPage, setGiftRowsPerPage] = useState(10);
  const [selectedGiftRowIds, setSelectedGiftRowIds] = useState<string[]>([]);
  const [editingGiftRowId, setEditingGiftRowId] = useState<string | null>(null);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [isGiftGuestMenuOpen, setIsGiftGuestMenuOpen] = useState(false);
  const [giftGuestSearch, setGiftGuestSearch] = useState('');
  const [giftGuestId, setGiftGuestId] = useState<string | null>(null);
  const [giftPaymentType, setGiftPaymentType] = useState<'CASH' | 'KHQR'>('CASH');
  const [giftCurrencyType, setGiftCurrencyType] = useState<'USD' | 'KHR'>('USD');
  const [giftAmount, setGiftAmount] = useState('0');
  const [giftNote, setGiftNote] = useState('');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseRows, setExpenseRows] = useState<
    Array<{
      id: string;
      name: string;
      budget: number;
      actual: number;
      note: string;
      createdAt: string;
      updatedAt: string;
      payments: Array<{
        id: string;
        title: string;
        date: string;
        isOpen: boolean;
        description: string;
        amount: string;
        note: string;
      }>;
    }>
  >([]);
  const [selectedExpenseRowIds, setSelectedExpenseRowIds] = useState<string[]>([]);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expenseSort, setExpenseSort] = useState<{ columnId: 'name' | 'budget' | 'actual' | 'note'; direction: 'asc' | 'desc' } | null>(null);
  const [hiddenExpenseColumns, setHiddenExpenseColumns] = useState<Set<'name' | 'budget' | 'actual' | 'note'>>(
    new Set(),
  );
  const [expenseName, setExpenseName] = useState('');
  const [expenseBudget, setExpenseBudget] = useState('');
  const [expenseNote, setExpenseNote] = useState('');
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expensePayments, setExpensePayments] = useState<
    Array<{
      id: string;
      title: string;
      date: string;
      isOpen: boolean;
      description: string;
      amount: string;
      note: string;
    }>
  >([]);
  const [isExpenseImportOpen, setIsExpenseImportOpen] = useState(false);
  const [expenseImportFileName, setExpenseImportFileName] = useState('');
  const [expenseImportPreview, setExpenseImportPreview] = useState<
    Array<{
      name: string;
      budget: number;
      note: string;
      payments: Array<{ title: string; date: string; amount: number; note: string }>;
    }>
  >([]);
  const [expenseImportError, setExpenseImportError] = useState('');
  const [isParsingExpenseFile, setIsParsingExpenseFile] = useState(false);
  const [isImportingExpenses, setIsImportingExpenses] = useState(false);
  const [expenseColumnMenu, setExpenseColumnMenu] = useState<{
    columnId: string;
    anchorRect: DOMRect;
  } | null>(null);
  const [guestGroupFilter, setGuestGroupFilter] = useState('ALL');
  const [guestTagFilter, setGuestTagFilter] = useState('ALL');
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([]);
  const [isGuestFormOpen, setIsGuestFormOpen] = useState(false);
  const [shareGuestId, setShareGuestId] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState('');
  const [shareGuestName, setShareGuestName] = useState('');
  const [shareNotice, setShareNotice] = useState('');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrLink, setQrLink] = useState('');
  const [qrGuestName, setQrGuestName] = useState('');
  const [actionMenuGuestId, setActionMenuGuestId] = useState<string | null>(null);
  const [isEditGuestModalOpen, setIsEditGuestModalOpen] = useState(false);
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);
  const [editGuestName, setEditGuestName] = useState('');
  const [editGuestPhone, setEditGuestPhone] = useState('');
  const [editGuestGroup, setEditGuestGroup] = useState('GROOM_SIDE');
  const [editGuestTag, setEditGuestTag] = useState('OTHERS');
  const [editGuestNote, setEditGuestNote] = useState('');
  const [guestUiOverrides, setGuestUiOverrides] = useState<Record<string, { group: string; tag: string; note: string }>>({});
  const actionMenuRef = useRef<HTMLDivElement | null>(null);
  const giftGuestMenuRef = useRef<HTMLDivElement | null>(null);
  const expenseMenuRef = useRef<HTMLDivElement | null>(null);
  const expenseImportInputRef = useRef<HTMLInputElement | null>(null);

  const [editGroomName, setEditGroomName] = useState('');
  const [editBrideName, setEditBrideName] = useState('');
  const [editEventType, setEditEventType] = useState<EditEventType>('WEDDING');
  const [editCategoryKey, setEditCategoryKey] = useState(EVENT_CATEGORY_OPTIONS[0]?.key || 'wedding');
  const [editHostName, setEditHostName] = useState('');
  const [editEventTitle, setEditEventTitle] = useState('');
  const [editCeremonyName, setEditCeremonyName] = useState('');
  const [editWatName, setEditWatName] = useState('');
  const [editMainCelebrant, setEditMainCelebrant] = useState('');
  const [editDeceasedName, setEditDeceasedName] = useState('');
  const [editDeceasedAge, setEditDeceasedAge] = useState('');
  const [editReligiousRites, setEditReligiousRites] = useState('');

  const [eventTypes, setEventTypes] = useState<ApiEventType[]>([]);
  const [selectedEventTypeId, setSelectedEventTypeId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [preventDuplicateGuestNames, setPreventDuplicateGuestNames] = useState(false);
  const [editGoogleMapLink, setEditGoogleMapLink] = useState('');
  const [filePreviews, setFilePreviews] = useState<Record<string, string>>({});
  const [fileNames, setFileNames] = useState<Record<string, string>>({});

  const [editDate, setEditDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [agendaSections, setAgendaSections] = useState<
    Array<{
      id: string;
      title: string;
      items: Array<{ id: string; title: string; time: string; date: string }>;
    }>
  >([
    {
      id: 'agenda-1',
      title: 'របៀបវារៈទី1',
      items: [{ id: 'agenda-1-item-1', title: '', time: '', date: '' }],
    },
  ]);
  const [isAgendaCollapsed, setIsAgendaCollapsed] = useState(false);
  const [isSavingAgenda, setIsSavingAgenda] = useState(false);
  const hasInitializedAgenda = useRef(false);

  const [origin, setOrigin] = useState('');
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [previewingTemplateId, setPreviewingTemplateId] = useState<string | null>(null);
  const isEditFormInitialized = useRef(false);
  const hasShownTemplateToast = useRef(false);

  const weddingPrefix = 'ពិធីរៀបមង្គលការ';

  const createAgendaId = () => `agenda-${Math.random().toString(36).slice(2, 9)}`;
  const createAgendaItemId = () => `agenda-item-${Math.random().toString(36).slice(2, 9)}`;
  const getNextAgendaTitle = (sections: typeof agendaSections) => {
    const titlePattern = /របៀបវារៈទី\s*(\d+)/;
    const maxNumber = sections.reduce((maxValue, section) => {
      const match = titlePattern.exec(section.title);
      const value = match ? Number(match[1]) : 0;
      return Number.isFinite(value) && value > maxValue ? value : maxValue;
    }, 0);
    const nextNumber = maxNumber > 0 ? maxNumber + 1 : sections.length + 1;
    return `របៀបវារៈទី${nextNumber}`;
  };
  const removeAgendaSection = (sectionId: string) => {
    setAgendaSections((prev) => prev.filter((section) => section.id !== sectionId));
  };
  const removeAgendaItem = (sectionId: string, itemId: string) => {
    setAgendaSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? { ...section, items: section.items.filter((item) => item.id !== itemId) }
          : section,
      ),
    );
  };

  const normalizeExpenseImportAmount = (value: unknown) => {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }

    const numeric = Number(String(value ?? '').replace(/,/g, '').trim());
    return Number.isFinite(numeric) ? numeric : 0;
  };

  const normalizeExpenseImportDate = (value: unknown, XLSX: typeof import('xlsx')) => {
    if (!value) {
      return '';
    }

    if (typeof value === 'number') {
      const parsed = XLSX.SSF.parse_date_code(value);
      if (parsed?.y && parsed?.m && parsed?.d) {
        const iso = new Date(parsed.y, parsed.m - 1, parsed.d);
        return iso.toISOString().slice(0, 10);
      }
    }

    const text = String(value).trim();
    if (!text) {
      return '';
    }

    const parsed = new Date(text);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }

    return text;
  };

  const resetExpenseImportState = () => {
    setExpenseImportFileName('');
    setExpenseImportPreview([]);
    setExpenseImportError('');
  };

  const parseExpenseImportFile = async (file: File) => {
    setIsParsingExpenseFile(true);
    setExpenseImportError('');

    try {
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];

      if (!sheetName) {
        setExpenseImportError('មិនមានទិន្នន័យក្នុងឯកសារ Excel ទេ');
        setExpenseImportPreview([]);
        return;
      }

      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

      const grouped = new Map<
        string,
        {
          name: string;
          budget: number;
          note: string;
          payments: Array<{ title: string; date: string; amount: number; note: string }>;
        }
      >();

      rows.forEach((row) => {
        const name = String(row['ឈ្មោះចំណាយ'] ?? '').trim();
        if (!name) {
          return;
        }

        const budget = normalizeExpenseImportAmount(row['គ្រោងចំណាយ']);
        const note = String(row['កំណត់ចំណាំ'] ?? '').trim();
        const paymentTitle = String(row['ឈ្មោះការបង់ប្រាក់'] ?? '').trim();
        const paymentDate = normalizeExpenseImportDate(row['កាលបរិច្ឆេទ'], XLSX);
        const paymentAmount = normalizeExpenseImportAmount(row['ចំនួនទឹកប្រាក់បង់']);
        const paymentNote = String(row['កំណត់ចំណាំការបង់ប្រាក់'] ?? '').trim();

        const existing = grouped.get(name) || {
          name,
          budget: 0,
          note: '',
          payments: [],
        };

        if (!existing.budget && budget) {
          existing.budget = budget;
        }

        if (!existing.note && note) {
          existing.note = note;
        }

        if (paymentTitle || paymentAmount || paymentNote || paymentDate) {
          existing.payments.push({
            title: paymentTitle || 'Payment',
            date: paymentDate,
            amount: paymentAmount,
            note: paymentNote,
          });
        }

        grouped.set(name, existing);
      });

      const preview = Array.from(grouped.values());
      if (preview.length === 0) {
        setExpenseImportError('មិនអាចស្វែងរកទិន្នន័យក្នុងឯកសារ Excel បានទេ');
      }
      setExpenseImportPreview(preview);
    } catch {
      setExpenseImportError('មិនអាចអានឯកសារ Excel បានទេ');
      setExpenseImportPreview([]);
    } finally {
      setIsParsingExpenseFile(false);
    }
  };

  const handleExpenseImportFile = (file: File) => {
    setExpenseImportFileName(file.name);
    parseExpenseImportFile(file);
  };

  const handleDownloadExpenseSample = async () => {
    try {
      const XLSX = await import('xlsx');
      const worksheet = XLSX.utils.json_to_sheet([
        {
          'ឈ្មោះចំណាយ': 'ឧ. តុបតែង',
          'គ្រោងចំណាយ': 500,
          'កំណត់ចំណាំ': 'សម្រាប់ការតុបតែង',
          'ឈ្មោះការបង់ប្រាក់': 'បង់លើកទី 1',
          'កាលបរិច្ឆេទ': '2026-03-27',
          'ចំនួនទឹកប្រាក់បង់': 200,
          'កំណត់ចំណាំការបង់ប្រាក់': 'បង់មុន',
        },
      ]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses');
      const stamp = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `Expense_Import_Sample_${stamp}.xlsx`);
    } catch {
      setError('មិនអាចទាញយក Template បានទេ');
      setSuccess('');
    }
  };

  const handleImportExpenses = async () => {
    if (expenseImportPreview.length === 0) {
      setExpenseImportError('មិនមានទិន្នន័យសម្រាប់នាំចូលទេ');
      return;
    }

    setIsImportingExpenses(true);
    setExpenseImportError('');

    try {
      await Promise.all(
        expenseImportPreview.map((expense) =>
          apiClient.createExpense(eventId, {
            name: expense.name,
            budget: expense.budget,
            note: expense.note || '-',
            payments: expense.payments
              .filter((payment) => payment.title.trim() || payment.amount || payment.note.trim())
              .map((payment) => ({
                description: payment.title.trim() || 'Payment',
                amount: payment.amount || 0,
                note: payment.note.trim() || undefined,
                paidAt: payment.date || new Date().toISOString().slice(0, 10),
              })),
          }),
        ),
      );

      const updatedExpenses = await apiClient.getEventExpenses(eventId);
      setExpenseRows(updatedExpenses.map(mapExpenseToRow));
      setSuccess('បាននាំចូលចំណាយរួចរាល់');
      setError('');
      resetExpenseImportState();
      setIsExpenseImportOpen(false);
    } catch (importError) {
      setExpenseImportError(extractApiErrorMessage(importError) || 'មិនអាចនាំចូលចំណាយបានទេ');
    } finally {
      setIsImportingExpenses(false);
    }
  };

  const sanitizeEnglishDigits = (value: string) => value.replace(/[^0-9]/g, '');

  const handleDigitsOnlyKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const allowedControlKeys = [
      'Backspace',
      'Delete',
      'Tab',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
      'Enter',
      'Escape',
    ];

    if (allowedControlKeys.includes(event.key)) {
      return;
    }

    if ((event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x', 'z', 'y'].includes(event.key.toLowerCase())) {
      return;
    }

    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  };

  const handleDigitsOnlyPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData('text');
    if (!/^[0-9]+$/.test(pasted)) {
      event.preventDefault();
    }
  };

  const mapGiftToRow = (gift: Gift): GiftRow => {
    return {
      id: gift.id,
      guestId: gift.guestId,
      guestName: gift.guest?.name || '-',
      phone: gift.guest?.phone || undefined,
      eventId: gift.eventId,
      paymentType: gift.paymentType,
      currencyType: gift.currencyType,
      amount: Number(gift.amount || 0),
      note: gift.note || '-',
      createdAt: gift.createdAt,
      updatedAt: gift.updatedAt,
    };
  };

  const mapExpenseToRow = (expense: Expense) => {
    const payments = Array.isArray(expense.payments) ? expense.payments : [];
    const actual = payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);

    return {
      id: expense.id,
      name: expense.name,
      budget: Number(expense.budget || 0),
      actual,
      note: expense.note || '-',
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
      payments: payments.map((payment, index) => ({
        id: payment.id,
        title: `Payment #${index + 1}`,
        date: payment.paidAt ? payment.paidAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
        isOpen: true,
        description: payment.description,
        amount: String(payment.amount ?? ''),
        note: payment.note || '',
      })),
    };
  };

  const extractApiErrorMessage = (error: unknown): string | null => {
    const maybeError = error as { response?: { data?: { message?: string | string[] } } };
    const message = maybeError?.response?.data?.message;

    if (Array.isArray(message)) {
      return message.join(', ');
    }

    if (typeof message === 'string' && message.trim()) {
      return message;
    }

    return null;
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
      setAccessToken(localStorage.getItem('auth_token') || '');
    }
  }, []);

  useEffect(() => {
    if (!expenseColumnMenu) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (!expenseMenuRef.current) {
        return;
      }
      if (!expenseMenuRef.current.contains(event.target as Node)) {
        setExpenseColumnMenu(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [expenseColumnMenu]);

  useEffect(() => {
    if (hasShownTemplateToast.current) {
      return;
    }

    const templateApplied = searchParams.get('templateApplied');
    const message = searchParams.get('message');

    if (templateApplied === '1') {
      setSuccess('បានជ្រើសរើសគំរូធៀបដោយជោគជ័យ!');
      setError('');
      hasShownTemplateToast.current = true;
      return;
    }

    if (templateApplied === '0') {
      setError(message || 'មិនអាចជ្រើសរើសគំរូធៀបបានទេ');
      setSuccess('');
      hasShownTemplateToast.current = true;
    }
  }, [searchParams]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    const pageParam = Number(searchParams.get('page') || '');
    const validTabs: TabId[] = [
      'general',
      'guests',
      'gifts',
      'expenses',
      'edit',
      'schedule',
      'my-template',
      'template-shop',
      'qr',
    ];

    if (tab && validTabs.includes(tab as TabId)) {
      setActiveTab(tab as TabId);
    }

    if (tab === 'guests' && Number.isFinite(pageParam) && pageParam > 0) {
      setGuestPage(Math.floor(pageParam));
    }
  }, [searchParams]);

  useEffect(() => {
    // Set currentTime only on the client to avoid hydration mismatch
    setCurrentTime(Date.now());
    const timerId = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  useEffect(() => {
    return () => {
      Object.values(filePreviews).forEach((previewUrl) => {
        URL.revokeObjectURL(previewUrl);
      });
    };
  }, [filePreviews]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!isGiftGuestMenuOpen) {
        return;
      }

      if (giftGuestMenuRef.current && !giftGuestMenuRef.current.contains(event.target as Node)) {
        setIsGiftGuestMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isGiftGuestMenuOpen]);

  useEffect(() => {
    const loadEventTypes = async () => {
      try {
        const data = await apiClient.getEventTypes();
        setEventTypes(data);
      } catch (loadError) {
        console.error('Failed to load event types', loadError);
      }
    };

    loadEventTypes();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [eventData, statsData, guestsData] = await Promise.all([
          apiClient.getEvent(eventId),
          apiClient.getEventStats(eventId),
          apiClient.getEventGuests(eventId),
        ]);

        setEvent(eventData);
        setStats(statsData);
        setGuests(guestsData);

        try {
          const giftsData = await apiClient.getEventGifts(eventId);
          setGiftRows(giftsData.map(mapGiftToRow));
        } catch (giftsLoadError) {
          console.error('Failed to load gifts:', giftsLoadError);
          setGiftRows([]);
          setSuccess('');
          setError(
            extractApiErrorMessage(giftsLoadError) ||
              'មិនអាចទាញយកទិន្នន័យចំណងដៃបានទេ (សូមពិនិត្យ backend/database)',
          );
        }

        try {
          const expenseData = await apiClient.getEventExpenses(eventId);
          setExpenseRows(expenseData.map(mapExpenseToRow));
        } catch (expenseLoadError) {
          console.error('Failed to load expenses:', expenseLoadError);
          setExpenseRows([]);
          setSuccess('');
          setError(
            extractApiErrorMessage(expenseLoadError) ||
              'មិនអាចទាញយកទិន្នន័យចំណាយបានទេ (សូមពិនិត្យ backend/database)',
          );
        }
      } catch (loadError) {
        console.error('Failed to load event:', loadError);
        setSuccess('');
        setError(
          extractApiErrorMessage(loadError) ||
            'មិនអាចទាញយកទិន្នន័យព្រឹត្តិការណ៍បានទេ',
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [eventId]);

  useEffect(() => {
    setMyTemplates(getSavedMyTemplates());

    const handleStorage = () => {
      setMyTemplates(getSavedMyTemplates());
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const token = window.localStorage.getItem('auth_token') || '';
    setAccessToken(token);
  }, []);

  useEffect(() => {
    if (!event) {
      return;
    }

    const eventTypeId = event.eventTypeId || event.eventType?.id || selectedEventTypeId;
    if (!eventTypeId) {
      return;
    }

    let isActive = true;
    setIsTemplatesLoading(true);
    setTemplateError('');

    apiClient
      .getTemplates(eventTypeId)
      .then((data) => {
        if (!isActive) return;
        setTemplates(data);
      })
      .catch(() => {
        if (!isActive) return;
        setTemplateError('មិនអាចទាញយកគំរូធៀបបានទេ');
      })
      .finally(() => {
        if (!isActive) return;
        setIsTemplatesLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [event, selectedEventTypeId]);

  useEffect(() => {
    if (hasInitializedAgenda.current) {
      return;
    }

    const agenda = (event?.metadata as { agenda?: typeof agendaSections })?.agenda;
    if (agenda && Array.isArray(agenda) && agenda.length > 0) {
      setAgendaSections(agenda);
    }

    if (event) {
      hasInitializedAgenda.current = true;
    }
  }, [event]);

  const handleSaveAgenda = async () => {
    if (!event) {
      return;
    }

    setIsSavingAgenda(true);
    setError('');
    setSuccess('');

    try {
      const sanitizedAgenda = agendaSections.map((section) => ({
        ...section,
        title: section.title.trim(),
        items: section.items.map((item) => ({
          ...item,
          title: item.title.trim(),
          time: item.time.trim(),
          date: item.date.trim(),
        })),
      }));
      const updatedEvent = await apiClient.updateEvent(eventId, {
        metadata: {
          ...(event.metadata || {}),
          agenda: sanitizedAgenda,
        },
      });

      setEvent(updatedEvent);
      setSuccess('រក្សាទុករបៀបវារៈបានជោគជ័យ!');
    } catch (saveError) {
      setSuccess('');
      setError(extractApiErrorMessage(saveError) || 'មិនអាចរក្សាទុករបៀបវារៈបានទេ');
    } finally {
      setIsSavingAgenda(false);
    }
  };

  useEffect(() => {
    if (!actionMenuGuestId) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setActionMenuGuestId(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [actionMenuGuestId]);

  const { groomName, brideName } = useMemo(() => {
    const normalizeName = (name: string) => {
      const trimmed = name.trim();
      const escapedPrefix = weddingPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return trimmed.replace(new RegExp(`^(?:${escapedPrefix}\\s*)+`, 'u'), '').trim();
    };

    if (!event?.title) {
      return { groomName: 'Groom Name', brideName: 'Bride Name' };
    }

    if (event.title.includes('&')) {
      const [groom, bride] = event.title.split('&').map((item) => item.trim());
      return {
        groomName: normalizeName(groom || 'Groom Name'),
        brideName: normalizeName(bride || 'Bride Name'),
      };
    }

    if (event.title.includes(' និង ')) {
      const [groom, bride] = event.title.split(' និង ').map((item) => item.trim());
      return {
        groomName: normalizeName(groom || 'Groom Name'),
        brideName: normalizeName(bride || 'Bride Name'),
      };
    }

    return { groomName: normalizeName(event.title), brideName: 'Bride Name' };
  }, [event?.title, weddingPrefix]);

  const inferEditType = (source: Event): EditEventType => {
    const slug = source.eventType?.slug?.toLowerCase();
    if (slug === 'wedding') return 'WEDDING';
    if (slug === 'birthday') return 'BIRTHDAY';
    if (slug === 'housewarming') return 'HOUSEWARMING';
    if (slug === 'memorial') return 'FUNERAL';

    const lowerTitle = source.title.toLowerCase();
    if (lowerTitle.includes('បុណ្យសព')) return 'FUNERAL';
    if (lowerTitle.includes('មង្គលការ')) return 'WEDDING';

    return 'CEREMONY';
  };

  const inferCategoryKey = (source: Event): string => {
    const metadata = source.metadata && typeof source.metadata === 'object'
      ? (source.metadata as Record<string, unknown>)
      : undefined;

    const categoryKeyFromMetadata = metadata?.categoryKey;
    if (
      typeof categoryKeyFromMetadata === 'string' &&
      EVENT_CATEGORY_BY_KEY[categoryKeyFromMetadata]
    ) {
      return categoryKeyFromMetadata;
    }

    const categoryLabelFromMetadata = metadata?.category;
    if (typeof categoryLabelFromMetadata === 'string' && categoryLabelFromMetadata.trim()) {
      const matched = EVENT_CATEGORY_OPTIONS.find(
        (item) => item.subtitle === categoryLabelFromMetadata.trim(),
      );
      if (matched) {
        return matched.key;
      }
    }

    const inferredType = inferEditType(source);
    const fallback = EVENT_CATEGORY_OPTIONS.find((item) => item.defaultEventType === inferredType);
    return fallback?.key || EVENT_CATEGORY_OPTIONS[0]?.key || 'wedding';
  };

  const eventTypeSlugMap: Record<EditEventType, string> = {
    WEDDING: 'wedding',
    CEREMONY: 'other',
    BIRTHDAY: 'birthday',
    HOUSEWARMING: 'housewarming',
    FUNERAL: 'memorial',
  };

  const resolveEventTypeIdFromType = (type: EditEventType) => {
    if (!eventTypes.length) {
      return '';
    }

    const matched = eventTypes.find((item) => item.slug === eventTypeSlugMap[type]);
    return matched?.id || eventTypes[0]?.id || '';
  };

  const handleEditEventTypeChange = (type: EditEventType) => {
    setEditEventType(type);
    const nextEventTypeId = resolveEventTypeIdFromType(type);
    setSelectedEventTypeId(nextEventTypeId);
  };

  const handleEditCategoryChange = (nextCategoryKey: string) => {
    setEditCategoryKey(nextCategoryKey);

    const selectedCategory = EVENT_CATEGORY_BY_KEY[nextCategoryKey];
    if (!selectedCategory) {
      return;
    }

    handleEditEventTypeChange(selectedCategory.defaultEventType as EventFlowType);
  };

  const getMetadataValue = (key: string) => {
    if (!event?.metadata || typeof event.metadata !== 'object') {
      return undefined;
    }

    return (event.metadata as Record<string, unknown>)[key];
  };

  const extractFileNameFromUrl = (url: string) => {
    const clean = url.split('?')[0] || '';
    const parts = clean.split('/');
    return parts[parts.length - 1] || 'uploaded-image';
  };

  const getStoredImageInfo = (key: 'backgroundImage' | 'khqrDollar' | 'khqrRiel') => {
    if (!event) {
      return null;
    }

    const directMap: Record<typeof key, string | undefined> = {
      backgroundImage: event.coverImage,
      khqrDollar: event.khqrDollar,
      khqrRiel: event.khqrRiel,
    };

    const fallbackMap: Record<typeof key, string | undefined> = {
      backgroundImage: typeof getMetadataValue('coverImage') === 'string' ? (getMetadataValue('coverImage') as string) : undefined,
      khqrDollar: typeof getMetadataValue('khqrDollar') === 'string' ? (getMetadataValue('khqrDollar') as string) : undefined,
      khqrRiel: typeof getMetadataValue('khqrRiel') === 'string' ? (getMetadataValue('khqrRiel') as string) : undefined,
    };

    const url = directMap[key] || fallbackMap[key];
    if (!url) {
      return null;
    }

    return {
      url,
      name: extractFileNameFromUrl(url),
    };
  };

  useEffect(() => {
    if (!event || isEditFormInitialized.current) {
      return;
    }

    const inferredType = inferEditType(event);
    const inferredCategoryKey = inferCategoryKey(event);
    setEditEventType(inferredType);
    setEditCategoryKey(inferredCategoryKey);
    setEditGroomName(groomName);
    setEditBrideName(brideName === 'Bride Name' ? '' : brideName);
    setEditHostName('');
    setEditEventTitle(event.title || '');
    setEditCeremonyName(event.title || '');
    setEditWatName(event.location || '');
    setEditMainCelebrant('');
    setEditDeceasedName(event.title.replace('បុណ្យសព', '').trim());
    setEditDeceasedAge('');
    setEditReligiousRites('');
    setEditDate(new Date(event.date).toISOString().slice(0, 16));
    setEditEndDate(
      typeof getMetadataValue('eventEndDate') === 'string' && (getMetadataValue('eventEndDate') as string).trim()
        ? (getMetadataValue('eventEndDate') as string)
        : new Date(event.date).toISOString().slice(0, 16),
    );
    setEditAddress(event.address || event.location || '');
    setEditSlug(event.slug || '');
    setEditGoogleMapLink(
      event.googleMapLink ||
        (typeof getMetadataValue('googleMapLink') === 'string'
          ? (getMetadataValue('googleMapLink') as string)
          : ''),
    );
    setSelectedEventTypeId(event.eventTypeId || '');
    setSelectedTemplateId(event.templateId || '');
    setVisibility((event.metadata?.visibility as 'PUBLIC' | 'PRIVATE') || 'PUBLIC');
    setPreventDuplicateGuestNames(Boolean(event.metadata?.preventDuplicateGuestNames));
    isEditFormInitialized.current = true;
  }, [event, groomName, brideName]);

  useEffect(() => {
    isEditFormInitialized.current = false;
  }, [eventId]);

  useEffect(() => {
    if (!eventTypes.length || !isEditFormInitialized.current) {
      return;
    }

    const nextEventTypeId = resolveEventTypeIdFromType(editEventType);

    if (nextEventTypeId !== selectedEventTypeId) {
      setSelectedEventTypeId(nextEventTypeId);
    }
  }, [eventTypes, editEventType, selectedEventTypeId]);

  const handleFileChange = (key: string, file: File | null) => {
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid image format. Please upload PNG, JPG, WEBP, or GIF.');
        return;
      }

      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        setError('Image is too large. Maximum size is 50MB.');
        return;
      }
    }

    setError('');

    setFilePreviews((previous) => {
      const next = { ...previous };

      if (next[key]) {
        URL.revokeObjectURL(next[key]);
        delete next[key];
      }

      if (file) {
        next[key] = URL.createObjectURL(file);
      }

      return next;
    });

    setFileNames((previous) => {
      const next = { ...previous };
      if (file) {
        next[key] = file.name;
      } else {
        delete next[key];
      }
      return next;
    });
  };

  const invitationUrl = useMemo(() => {
    if (!event || !origin) {
      return '';
    }

    if (event.slug) {
      return decodeURI(encodeURI(`${origin}/v/${event.slug}`));
    }

    return decodeURI(encodeURI(`${origin}/invitation/${event.id}`));
  }, [event, origin]);

  const activeMyTemplateForInvite = useMemo(() => {
    const eventScopedTemplates = myTemplates
      .filter((item) => item.eventId === eventId)
      .sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));

    if (!eventScopedTemplates.length) {
      return null;
    }

    if (event?.templateId) {
      const matched = eventScopedTemplates.find((item) => item.templateId === event.templateId);
      if (matched) {
        return matched;
      }
    }

    return eventScopedTemplates[0];
  }, [myTemplates, eventId, event?.templateId]);

  const eventMyTemplates = useMemo(
    () => myTemplates.filter((item) => item.eventId === eventId).sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1)),
    [myTemplates, eventId],
  );

  const externalPreviewPath = useMemo(() => {
    if (activeMyTemplateForInvite) {
      return `/events/${eventId}/my-template/${activeMyTemplateForInvite.id}`;
    }

    return `/invitation/${eventId}`;
  }, [activeMyTemplateForInvite, eventId]);

  const tabs: Array<{ id: TabId; label: string; icon: ComponentType<{ className?: string }> }> = [
    { id: 'general', label: 'ផ្ទាំងព័ត៌មានទូរទៅ', icon: Info },
    { id: 'guests', label: 'ភ្ញៀវកិត្តិយស', icon: Users },
    { id: 'gifts', label: 'ចំណងដៃ', icon: Mail },
    { id: 'expenses', label: 'ចំណាយ', icon: DollarSign },
    { id: 'edit', label: 'កែប្រែ', icon: Pencil },
    { id: 'schedule', label: 'របៀបវារៈកម្មវិធី', icon: Clock3 },
    { id: 'my-template', label: 'គំរូធៀបខ្ញុំ', icon: LayoutTemplate },
    { id: 'template-shop', label: 'ហាងគំរូធៀប', icon: Store },
    { id: 'qr', label: 'បង្កើត QR', icon: QrCode },
  ];

  const refreshGuestsAndStats = async () => {
    const [statsData, guestsData] = await Promise.all([
      apiClient.getEventStats(eventId),
      apiClient.getEventGuests(eventId),
    ]);

    setStats(statsData);
    setGuests(guestsData);
  };

  const localizeApiError = (rawMessage: unknown, fallback: string) => {
    const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : String(rawMessage || fallback);

    if (message.toLowerCase().includes('guest name already exists')) {
      return 'មានឈ្មោះភ្ញៀវនេះរួចហើយ សម្រាប់ព្រឹត្តិការណ៍នេះ';
    }

    return message;
  };

  const makeInvitationLink = (guestId: string, guestName: string, guestEventId?: string) => {
    if (typeof window === 'undefined') return '';

    const encodedGuestName = encodeURIComponent(guestName || 'ឈ្មោះភ្ញៀវកិត្តិយស');

    if (activeMyTemplateForInvite) {
      return decodeURI(
        encodeURI(
          `${window.location.origin}/events/${eventId}/my-template/${activeMyTemplateForInvite.id}?g=${encodedGuestName}&guestId=${guestId}`,
        ),
      );
    }

    const pathPart = event?.slug || guestEventId || eventId;
    return decodeURI(encodeURI(`${window.location.origin}/v/${pathPart}?guestId=${guestId}&g=${encodedGuestName}`));
  };

  const ensureActiveTemplateSnapshotSynced = async () => {
    if (!event || !activeMyTemplateForInvite?.builderState) {
      return;
    }

    const metadata = event.metadata && typeof event.metadata === 'object'
      ? (event.metadata as Record<string, unknown>)
      : {};

    const currentSnapshots =
      metadata.myTemplateSnapshots && typeof metadata.myTemplateSnapshots === 'object'
        ? (metadata.myTemplateSnapshots as Record<string, unknown>)
        : {};

    const updatedEvent = await apiClient.updateEvent(event.id, {
      metadata: {
        ...metadata,
        myTemplateSnapshots: {
          ...currentSnapshots,
          [activeMyTemplateForInvite.id]: {
            name: activeMyTemplateForInvite.name,
            templateId: activeMyTemplateForInvite.templateId,
            builderState: activeMyTemplateForInvite.builderState,
            updatedAt: new Date().toISOString(),
          },
        },
      },
    });

    setEvent(updatedEvent);
  };

  const openSharePopover = async (guest: Guest & { group?: string; tag?: string; greetingMessage?: string; note?: string }) => {
    setShareGuestId(guest.id);
    setShareGuestName(guest.name || 'ភ្ញៀវ');

    try {
      await ensureActiveTemplateSnapshotSynced();
    } catch {
      // Keep link generation working even if background sync fails.
    }

    setShareLink(makeInvitationLink(guest.id, guest.name || 'ឈ្មោះភ្ញៀវកិត្តិយស', guest.eventId));
    setShareNotice('');
  };

  const handleCopyInvitation = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setShareNotice('Copied to clipboard');
    } catch {
      setShareNotice('Copy failed');
    }
  };

  const handleDownloadInvitation = async () => {
    if (!shareLink || typeof window === 'undefined') return;

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=900x900&data=${encodeURIComponent(shareLink)}`;
    const guestName = shareGuestName || 'ភ្ញៀវ';

    try {
      const qrImage = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = qrUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 1400;
      const context = canvas.getContext('2d');
      if (!context) return;

      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.fillStyle = '#111827';
      context.font = '700 64px Kantumruy Pro, sans-serif';
      context.textAlign = 'center';
      context.fillText('តំណអញ្ជើញ', 600, 110);

      context.fillStyle = '#C52133';
      context.font = '600 44px Kantumruy Pro, sans-serif';
      context.fillText(guestName, 600, 180);

      context.fillStyle = '#f3f4f6';
      context.fillRect(150, 230, 900, 900);
      context.drawImage(qrImage, 180, 260, 840, 840);

      context.fillStyle = '#6b7280';
      context.font = '400 22px Kantumruy Pro, sans-serif';
      context.fillText('Scan to view invitation', 600, 1230);

      const pngUrl = canvas.toDataURL('image/png');
      const anchor = document.createElement('a');
      anchor.href = pngUrl;
      anchor.download = `invitation-qr-${guestName.replace(/\s+/g, '-')}.png`;
      anchor.click();
      setShareNotice('QR Code downloaded');
    } catch {
      setShareNotice('Download failed');
    }
  };

  const handleRefreshInvitationLink = async () => {
    if (!shareGuestId) return;

    try {
      await ensureActiveTemplateSnapshotSynced();
    } catch {
      // Keep link generation working even if background sync fails.
    }

    setShareLink(makeInvitationLink(shareGuestId, shareGuestName || 'ឈ្មោះភ្ញៀវកិត្តិយស', eventId));
    setShareNotice('Link refreshed');
  };

  const openQrModal = async (guest: Guest & { group?: string; tag?: string; greetingMessage?: string; note?: string }) => {
    setQrGuestName(guest.name || 'ភ្ញៀវ');

    try {
      await ensureActiveTemplateSnapshotSynced();
    } catch {
      // Keep link generation working even if background sync fails.
    }

    setQrLink(makeInvitationLink(guest.id, guest.name || 'ឈ្មោះភ្ញៀវកិត្តិយស', guest.eventId));
    setIsQrModalOpen(true);
  };

  const handleDownloadQrCode = async () => {
    if (!qrLink || typeof window === 'undefined') return;

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=700x700&data=${encodeURIComponent(qrLink)}`;

    try {
      const qrImage = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = qrUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = 900;
      canvas.height = 1060;
      const context = canvas.getContext('2d');
      if (!context) return;

      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.fillStyle = '#111827';
      context.font = '700 46px Kantumruy Pro, sans-serif';
      context.textAlign = 'center';
      context.fillText('QR Code', 450, 80);

      context.fillStyle = '#ffffff';
      context.strokeStyle = '#f1f5f9';
      context.lineWidth = 2;
      context.fillRect(130, 120, 640, 640);
      context.strokeRect(130, 120, 640, 640);
      context.drawImage(qrImage, 145, 135, 610, 610);

      context.fillStyle = '#374151';
      context.font = '500 28px Kantumruy Pro, sans-serif';
      context.fillText(qrGuestName || 'ភ្ញៀវ', 450, 840);

      context.fillStyle = '#6b7280';
      context.font = '400 20px Kantumruy Pro, sans-serif';
      context.fillText('ស្កេនដើម្បីមើលធៀបអញ្ជើញ', 450, 890);

      const dataUrl = canvas.toDataURL('image/png');
      const anchor = document.createElement('a');
      anchor.href = dataUrl;
      anchor.download = `guest-qr-${(qrGuestName || 'guest').replace(/\s+/g, '-')}.png`;
      anchor.click();
    } catch {
      setError('មិនអាចទាញយក QR កូដបានទេ');
    }
  };

  const openActionMenu = (guestId: string) => {
    setActionMenuGuestId((prev) => (prev === guestId ? null : guestId));
  };

  const openEditGuestModal = (guest: Guest & { group?: string; tag?: string; greetingMessage?: string; note?: string }) => {
    setEditingGuestId(guest.id);
    setEditGuestName(guest.name || '');
    setEditGuestPhone(guest.phone || '');
    setEditGuestGroup(guest.group || 'GROOM_SIDE');
    setEditGuestTag(guest.tag || 'OTHERS');
    setEditGuestNote(guest.note && guest.note !== '-' ? guest.note : '');
    setIsEditGuestModalOpen(true);
    setActionMenuGuestId(null);
  };

  const handleSaveEditedGuest = async () => {
    if (!editingGuestId) return;

    const name = editGuestName.trim();
    if (!name) {
      setError('សូមបញ្ចូលឈ្មោះភ្ញៀវ');
      return;
    }

    try {
      await apiClient.updateGuest(editingGuestId, {
        name,
        phone: editGuestPhone.trim() || undefined,
        group: editGuestGroup,
        tag: editGuestTag,
        note: editGuestNote.trim() || '-',
      });
      setGuestUiOverrides((prev) => ({
        ...prev,
        [editingGuestId]: {
          group: editGuestGroup,
          tag: editGuestTag,
          note: editGuestNote.trim() || '-',
        },
      }));
      await refreshGuestsAndStats();
      setIsEditGuestModalOpen(false);
      setEditingGuestId(null);
    } catch {
      setError('កែសម្រួលភ្ញៀវមិនជោគជ័យ');
    }
  };

  const handleDeleteOneGuest = async (guestId: string) => {
    const confirmed = window.confirm('តើអ្នកចង់លុបភ្ញៀវនេះមែនទេ?');
    if (!confirmed) return;

    try {
      await apiClient.deleteGuest(guestId);
      await refreshGuestsAndStats();
      setSelectedGuestIds((prev) => prev.filter((id) => id !== guestId));
      setActionMenuGuestId(null);
    } catch {
      setError('លុបទិន្នន័យមិនជោគជ័យ');
    }
  };

  const handleAddGuest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const confirmed = window.confirm('តើអ្នកចង់បង្កើតភ្ញៀវថ្មីមែនទេ?');
    if (!confirmed) return;

    setError('');
    setSuccess('');
    setIsSubmittingGuest(true);

    try {
      await apiClient.createGuest(eventId, guestName, guestEmail || undefined, guestPhone || undefined, {
        group: guestGroup,
        tag: guestTag,
        note: guestNote.trim() || '-',
      });
      await refreshGuestsAndStats();

      setGuestName('');
      setGuestEmail('');
      setGuestPhone('');
      setGuestGroup('GROOM_SIDE');
      setGuestTag('OTHERS');
      setGuestNote('');
      setIsGuestFormOpen(false);
      setSuccess('បានបន្ថែមភ្ញៀវថ្មីរួចរាល់');
    } catch (submitError: any) {
      const message = submitError?.response?.data?.message;
      setError(localizeApiError(message, 'បន្ថែមភ្ញៀវមិនជោគជ័យ'));
    } finally {
      setIsSubmittingGuest(false);
    }
  };

  const handleSaveEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!event) {
      return;
    }

    setError('');
    setSuccess('');
    setIsSavingEvent(true);
    const formData = new FormData(e.currentTarget);

    const backgroundImageFile = formData.get('backgroundImage') as File | null;
    const khqrDollarFile = formData.get('khqrDollar') as File | null;
    const khqrRielFile = formData.get('khqrRiel') as File | null;

    const hasFile = (file: File | null) => !!file && file.size > 0;

    try {
      let title = event.title;
      const previousTemplateId = event.templateId;

      if (editEventType === 'WEDDING') {
        if (!editGroomName.trim() || !editBrideName.trim()) {
          throw new Error('សូមបំពេញឈ្មោះកូនប្រុស និង កូនស្រី');
        }
        title = `ពិធីរៀបមង្គលការ ${editGroomName.trim()} និង ${editBrideName.trim()}`;
      } else if (editEventType === 'CEREMONY') {
        if (!editCeremonyName.trim() || !editWatName.trim() || !editMainCelebrant.trim()) {
          throw new Error('សូមបំពេញ Ceremony Name, Wat Name និង Main Celebrant');
        }
        title = editCeremonyName.trim();
      } else if (editEventType === 'FUNERAL') {
        if (!editDeceasedName.trim() || !editDeceasedAge.trim() || !editReligiousRites.trim()) {
          throw new Error('សូមបំពេញ Deceased Name, Age និង Religious Rites');
        }
        title = `បុណ្យសព ${editDeceasedName.trim()}`;
      } else {
        if (!editHostName.trim() || !editEventTitle.trim()) {
          throw new Error('សូមបំពេញ Host Name និង Event Title');
        }
        title = editEventTitle.trim();
      }

      let coverImage: string | undefined = event.coverImage;
      let khqrDollar: string | undefined = event.khqrDollar;
      let khqrRiel: string | undefined = event.khqrRiel;

      if (hasFile(backgroundImageFile)) {
        coverImage = await apiClient.uploadFile(backgroundImageFile as File);
      }

      if (hasFile(khqrDollarFile)) {
        khqrDollar = await apiClient.uploadFile(khqrDollarFile as File);
      }

      if (hasFile(khqrRielFile)) {
        khqrRiel = await apiClient.uploadFile(khqrRielFile as File);
      }

      const updated = await apiClient.updateEvent(event.id, {
        title,
        slug: editSlug.trim() || undefined,
        date: editDate,
        location: editAddress,
        address: editAddress,
        googleMapLink: editGoogleMapLink || undefined,
        coverImage,
        khqrDollar,
        khqrRiel,
        metadata: {
          ...(event.metadata || {}),
          category: EVENT_CATEGORY_BY_KEY[editCategoryKey]?.subtitle || 'ព្រឹត្តិការណ៍',
          categoryKey: editCategoryKey,
          visibility,
          preventDuplicateGuestNames,
          eventEndDate: editEndDate || editDate,
        },
        eventTypeId: selectedEventTypeId || undefined,
        templateId: selectedTemplateId || undefined,
      });

      syncMyTemplatesForEvent(event.id, [previousTemplateId, updated.templateId], {
        eventTitle: title,
        eventDate: editDate,
        eventEndDate: editEndDate || editDate,
        eventLocation: editAddress,
        mapUrl: editGoogleMapLink || '',
        coverImageUrl: coverImage || '',
        khqrUsdUrl: khqrDollar || '',
        khqrKhrUrl: khqrRiel || '',
      });

      setEvent(updated);
      setMyTemplates(getSavedMyTemplates());
      setSuccess('បានកែប្រែព្រឹត្តិការណ៍ដោយជោគជ័យ');
    } catch (saveError: any) {
      const message = saveError?.response?.data?.message;
      setError(Array.isArray(message) ? message.join(', ') : message || 'កែប្រែមិនជោគជ័យ');
    } finally {
      setIsSavingEvent(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!event) {
      return;
    }

    const confirmed = window.confirm('តើអ្នកប្រាកដថាចង់លុបព្រឹត្តិការណ៍នេះមែនទេ?');
    if (!confirmed) {
      return;
    }

    setError('');
    setSuccess('');
    setIsDeletingEvent(true);

    try {
      await apiClient.deleteEvent(event.id);
      router.push('/dashboard');
    } catch (deleteError: any) {
      const message = deleteError?.response?.data?.message;
      setError(Array.isArray(message) ? message.join(', ') : message || 'លុបព្រឹត្តិការណ៍មិនជោគជ័យ');
    } finally {
      setIsDeletingEvent(false);
    }
  };

  const renderGeneralTab = () => {
    const formatAmount = (value: number) => new Intl.NumberFormat('en-US').format(value || 0);
    const formatUsd = (value: number) =>
      new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(value || 0);
    const totalGuests = stats?.totalGuests ?? 0;
    const acceptedGuests = stats?.accepted ?? stats?.confirmed ?? 0;
    const pendingGuests = stats?.pending ?? 0;
    const declinedGuests = stats?.declined ?? 0;
    const acceptRate = totalGuests > 0 ? Math.round((acceptedGuests / totalGuests) * 100) : 0;
    const pendingRate = totalGuests > 0 ? Math.round((pendingGuests / totalGuests) * 100) : 0;
    const declineRate = totalGuests > 0 ? Math.round((declinedGuests / totalGuests) * 100) : 0;
    const exchangeRate = 4000;
    const totalGiftUsd = giftRows
      .filter((row) => row.currencyType === 'USD')
      .reduce((sum, row) => sum + (row.amount || 0), 0);
    const totalGiftKhr = giftRows
      .filter((row) => row.currencyType === 'KHR')
      .reduce((sum, row) => sum + (row.amount || 0), 0);
    const totalGiftAsUsd = totalGiftUsd + totalGiftKhr / exchangeRate;
    const totalExpenseActualUsd = expenseRows.reduce((sum, row) => sum + (row.actual || 0), 0);
    const totalExpenseBudgetUsd = expenseRows.reduce((sum, row) => sum + (row.budget || 0), 0);
    const profitLossUsd = totalGiftAsUsd - totalExpenseActualUsd;
    const expensePercent = totalGiftAsUsd > 0 ? Math.round((totalExpenseActualUsd / totalGiftAsUsd) * 100) : 0;

    return (
      <div className="space-y-6 font-khmer-body">

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
          <div className="rounded-3xl border border-sky-100 bg-sky-50/70 p-6 shadow-sm">
            <p className="font-khmer-heading text-sm text-sky-700">ភ្ញៀវដែលបានអញ្ជើញ</p>
            <p className="mt-2 text-3xl font-semibold text-sky-900">{totalGuests}</p>
          </div>
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-6 shadow-sm">
            <p className="font-khmer-heading text-sm text-emerald-700">ចំនួនបញ្ជាក់ចូលរួមសរុប</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-900">{acceptedGuests}</p>
          </div>
          <div className="rounded-3xl border border-violet-100 bg-violet-50/70 p-6 shadow-sm">
            <p className="font-khmer-heading text-sm text-violet-700">ជាប្រាក់រៀល</p>
            <p className="mt-2 text-3xl font-semibold text-violet-900">៛{formatAmount(totalGiftKhr)}</p>
            <p className="mt-2 text-xs text-violet-700">អត្រា​ប្តូរប្រាក់: 1 USD = 4000 KHR</p>
          </div>
          <div className="rounded-3xl border border-rose-100 bg-rose-50/70 p-6 shadow-sm">
            <p className="font-khmer-heading text-sm text-rose-700">ការចំណាយ</p>
            <p className="mt-2 text-3xl font-semibold text-rose-900">${formatUsd(totalExpenseActualUsd)}</p>
            <div className="mt-3">
              <p className="text-xs text-rose-700">{expensePercent}%</p>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-rose-100">
                <div className="h-full rounded-full bg-rose-400" style={{ width: `${Math.min(100, expensePercent)}%` }} />
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-teal-100 bg-teal-50/70 p-6 shadow-sm">
            <p className="font-khmer-heading text-sm text-teal-700">ចំណេញ/ខាត</p>
            <p className="mt-2 text-3xl font-semibold text-teal-900">${formatUsd(profitLossUsd)}</p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-khmer-heading text-lg text-slate-900">ក្រាបទិន្នន័យអ្នកចូលរួម</h3>
              <CheckCircle2 className="h-5 w-5 text-slate-400" />
            </div>
            <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-center">
              <div
                className="h-36 w-36 rounded-full"
                style={{
                  background: `conic-gradient(#10b981 0% ${acceptRate}%, #f59e0b ${acceptRate}% ${acceptRate + pendingRate}%, #f43f5e ${acceptRate + pendingRate}% 100%)`,
                }}
              />
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />បានបញ្ជាក់
                  </span>
                  <span>{acceptRate}%</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />មិនទាន់ឆ្លើយតប
                  </span>
                  <span>{pendingRate}%</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />បដិសេធ
                  </span>
                  <span>{declineRate}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-khmer-heading text-lg text-slate-900">ក្រាបទិន្នន័យហិរញ្ញវត្ថុ</h3>
              <DollarSign className="h-5 w-5 text-slate-400" />
            </div>
            <div className="mt-6 space-y-4">
              {[
                { label: 'ចំណងដៃ', value: totalGiftAsUsd, color: 'bg-emerald-400' },
                { label: 'ចំណាយប៉ាន់ស្មាន', value: totalExpenseBudgetUsd, color: 'bg-amber-400' },
                { label: 'ចំណាយពិត', value: totalExpenseActualUsd, color: 'bg-sky-400' },
                { label: 'ចំណេញ/ខាត', value: profitLossUsd, color: 'bg-rose-400' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                    <span>{item.label}</span>
                    <span>${formatUsd(item.value)}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${Math.min(100, (item.value / (totalGiftAsUsd || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-khmer-heading text-lg text-slate-900">ទិដ្ឋភាពទូទៅហិរញ្ញវត្ថុ</h3>
            <DollarSign className="h-5 w-5 text-slate-400" />
          </div>
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-2">
              <span>ចំណងដៃ</span>
              <span>${formatUsd(totalGiftAsUsd)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-2">
              <span>ចំណាយសរុប (ចំណាយជាក់ស្តែង)</span>
              <span>${formatUsd(totalExpenseActualUsd)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>ចំនេញ/ខាត</span>
              <span>${formatUsd(profitLossUsd)}</span>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-khmer-heading text-lg text-slate-900">ស្ថិតិភ្ញៀវ</h3>
            <Users className="h-5 w-5 text-slate-400" />
          </div>
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-2">
              <span>បានបញ្ជាក់</span>
              <span>{acceptedGuests}</span>
            </div>
            <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-2">
              <span>មិនទាន់ឆ្លើយតប</span>
              <span>{pendingGuests}</span>
            </div>
            <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-2">
              <span>បានបដិសេធ</span>
              <span>{declinedGuests}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>បានចងដៃ</span>
              <span>{giftRows.length}</span>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-rose-50 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-khmer-heading text-lg text-amber-900">ចំណងដៃថ្មីៗ</h3>
                <p className="mt-1 text-sm text-amber-700">ការចូលចិត្ត និងចំណងដៃចុងក្រោយ</p>
              </div>
              <Mail className="h-5 w-5 text-amber-700" />
            </div>
            <p className="mt-4 text-sm text-amber-700">បានទទួលចំណងដៃសរុបចំនួន</p>
            <p className="mt-2 text-2xl font-semibold text-amber-900">{giftRows.length} នាក់</p>
          </div>

          {(() => {
            // Prevent hydration mismatch: only render countdown after currentTime is set on client
            if (currentTime === null) {
              return (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-khmer-heading text-lg text-slate-900">កំណត់ពេលកម្មវិធី</h3>
                      <p className="mt-1 text-sm text-slate-500">សម័យរាប់ថយក្រោយ</p>
                    </div>
                    <Clock3 className="h-5 w-5 text-slate-400" />
                  </div>
                  <div className="mt-4 text-center text-gray-400">Loading...</div>
                </div>
              );
            }
            const eventTime = new Date(event!.date).getTime();
            const diff = eventTime - currentTime;
            const isPast = diff <= 0;
            const abs = Math.abs(diff);
            const totalSeconds = Math.floor(abs / 1000);
            const days = Math.floor(totalSeconds / 86400);
            const hours = Math.floor((totalSeconds % 86400) / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;

            return (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-khmer-heading text-lg text-slate-900">កំណត់ពេលកម្មវិធី</h3>
                    <p className="mt-1 text-sm text-slate-500">សម័យរាប់ថយក្រោយ</p>
                  </div>
                  <Clock3 className="h-5 w-5 text-slate-400" />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: 'ថ្ងៃ', value: days },
                    { label: 'ម៉ោង', value: String(hours).padStart(2, '0') },
                    { label: 'នាទី', value: String(minutes).padStart(2, '0') },
                    { label: 'វិនាទី', value: String(seconds).padStart(2, '0') },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-center">
                      <p className="text-xl font-semibold text-slate-900 sm:text-2xl">{item.value}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.label}</p>
                    </div>
                  ))}
                </div>

                {isPast && (
                  <p className="mt-3 text-sm font-medium text-rose-600">កម្មវិធីបានចាប់ផ្ដើមរួចហើយ</p>
                )}
              </div>
            );
          })()}
        </section>
      </div>
    );
  };

  const renderGuestsTab = () => {
    const normalizedGuests = guests.map((guest) => {
      const override = guestUiOverrides[guest.id];

      return {
        ...guest,
        group: override?.group || guest.group || 'GROOM_SIDE',
        tag: override?.tag || guest.tag || 'OTHERS',
        greetingMessage: guest.greetingMessage || '-',
        note: override?.note || guest.note || '-',
      };
    });

    const filteredGuests = normalizedGuests.filter((guest) => {
      const query = guestSearch.trim().toLowerCase();
      const searchable = [guest.name, guest.email || '', guest.phone || ''].join(' ').toLowerCase();
      const matchedSearch = !query || searchable.includes(query);
      const matchedGroup = guestGroupFilter === 'ALL' || guest.group === guestGroupFilter;
      const matchedTag = guestTagFilter === 'ALL' || guest.tag === guestTagFilter;

      return matchedSearch && matchedGroup && matchedTag;
    });

    const totalRecords = filteredGuests.length;
    const totalPages = totalRecords === 0 ? 0 : Math.ceil(totalRecords / guestRowsPerPage);
    const safePage = totalPages === 0 ? 1 : Math.min(guestPage, totalPages);
    const startIndex = totalRecords === 0 ? 0 : (safePage - 1) * guestRowsPerPage;
    const pageGuests = filteredGuests.slice(startIndex, startIndex + guestRowsPerPage);
    const allOnPageSelected = pageGuests.length > 0 && pageGuests.every((guest) => selectedGuestIds.includes(guest.id));

    const getStatusMeta = (status: string | undefined) => {
      if (status === 'CONFIRMED' || status === 'ACCEPTED') {
        return { label: 'Confirmed', classes: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' };
      }

      if (status === 'PENDING') {
        return { label: 'Pending', classes: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' };
      }

      return { label: 'មិនបានចូលរួម', classes: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200' };
    };

    const getGroupLabel = (value: string) => GUEST_GROUP_OPTIONS.find((item) => item.value === value)?.label || '-';
    const getTagLabel = (value: string) => GUEST_TAG_OPTIONS.find((item) => item.value === value)?.label || '-';
    const getGroupBadgeClass = (value: string) =>
      value === 'BRIDE_SIDE'
        ? 'bg-pink-50 text-pink-600 ring-1 ring-pink-200'
        : 'bg-blue-50 text-blue-600 ring-1 ring-blue-200';
    const getTagBadgeClass = (value: string) => {
      if (value === 'HIGH_SCHOOL_FRIEND' || value === 'COLLEGE_FRIEND') {
        return 'bg-purple-50 text-purple-600 ring-1 ring-purple-200';
      }

      if (value === 'RELATIVE') {
        return 'bg-orange-50 text-orange-600 ring-1 ring-orange-200';
      }

      if (value === 'TEAMWORK') {
        return 'bg-teal-50 text-teal-600 ring-1 ring-teal-200';
      }

      return 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200';
    };

    const handleExportGuestRows = async () => {
      const rowsToExport = filteredGuests;

      if (rowsToExport.length === 0) {
        setError('មិនមានទិន្នន័យសម្រាប់ទាញយកទេ');
        setSuccess('');
        return;
      }

      setError('');
      setSuccess('កំពុងរៀបចំឯកសារ Excel...');

      const exportRows = rowsToExport.map((guest) => {
        const statusLabel = getStatusMeta(guest.rsvpStatus || guest.status).label;

        return {
          Name: guest.name,
          Phone: guest.phone || '',
          Group: getGroupLabel(guest.group || 'GROOM_SIDE'),
          Tag: getTagLabel(guest.tag || 'OTHERS'),
          Status: statusLabel,
          Greeting: guest.greetingMessage || '',
          Note: guest.note || '',
        };
      });

      try {
        const XLSX = await import('xlsx');
        const worksheet = XLSX.utils.json_to_sheet(exportRows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Guests');
        const stamp = new Date().toISOString().slice(0, 10);
        const safeEventName = (event?.title || 'event').replace(/[\\/:*?"<>|]/g, '-');
        XLSX.writeFile(workbook, `${safeEventName}_GuestList_${stamp}.xlsx`);

        setSuccess('ទាញយកបានជោគជ័យ!');
      } catch {
        setSuccess('');
        setError('មិនអាចទាញយកឯកសារ Excel បានទេ');
      }
    };

    const handleCopySelected = async () => {
      if (typeof window === 'undefined') {
        return;
      }

      const selectedRows = filteredGuests.filter((item) => selectedGuestIds.includes(item.id));
      const selectedIdsParam = selectedRows.length > 0 ? `&guestIds=${selectedRows.map((item) => item.id).join(',')}` : '';
      const guestListUrl = decodeURI(
        encodeURI(`${window.location.origin}/guest-list?event=${eventId}&page=1${selectedIdsParam}`),
      );

      try {
        await navigator.clipboard.writeText(guestListUrl);
        setError('');
        setSuccess('បានចម្លងតំណភ្ជាប់បញ្ជីភ្ញៀវរួចរាល់!');
      } catch {
        setError('មិនអាចចម្លងទិន្នន័យបានទេ');
        setSuccess('');
      }
    };

    const handleDeleteSelected = async () => {
      const selectedRows = filteredGuests.filter((item) => selectedGuestIds.includes(item.id));
      if (selectedRows.length === 0) {
        const confirmedAll = window.confirm('មិនបានជ្រើសភ្ញៀវ។ តើអ្នកចង់លុបទាំងអស់មែនទេ?');
        if (!confirmedAll) return;

        try {
          await Promise.all(filteredGuests.map((item) => apiClient.deleteGuest(item.id)));
          await refreshGuestsAndStats();
          setSelectedGuestIds([]);
        } catch {
          setError('លុបទិន្នន័យមិនជោគជ័យ');
        }
        return;
      }

      const confirmed = window.confirm(`តើអ្នកចង់លុបភ្ញៀវចំនួន ${selectedRows.length} នាក់មែនទេ?`);
      if (!confirmed) return;

      try {
        await Promise.all(selectedRows.map((item) => apiClient.deleteGuest(item.id)));
        await refreshGuestsAndStats();
        setSelectedGuestIds([]);
      } catch {
        setError('លុបទិន្នន័យមិនជោគជ័យ');
      }
    };

    return (
      <section className="space-y-4 font-khmer-body">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-5 font-khmer-heading text-2xl text-gray-900">ការគ្រប់គ្រងភ្ញៀវ</h2>

          <div className="mb-4 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(220px,1.2fr)_220px_220px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={guestSearch ?? ''}
                onChange={(e) => {
                  setGuestSearch(e.target.value ?? '');
                  setGuestPage(1);
                }}
                placeholder="ស្វែងរក..."
                className="h-10 rounded-lg pl-10"
              />
            </div>

            <select
              value={guestGroupFilter}
              onChange={(e) => {
                setGuestGroupFilter(e.target.value);
                setGuestPage(1);
              }}
              className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm"
            >
              <option value="ALL">ក្រុម</option>
              {GUEST_GROUP_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={guestTagFilter}
              onChange={(e) => {
                setGuestTagFilter(e.target.value);
                setGuestPage(1);
              }}
              className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm"
            >
              <option value="ALL">ស្លាក</option>
              {GUEST_TAG_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCopySelected}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                title="Copy"
              >
                <Copy className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={handleExportGuestRows}
                className="inline-flex h-10 items-center rounded-full border border-gray-200 bg-white px-4 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Download className="mr-2 h-4 w-4" />
                ទាញយក
              </button>

              <Button
                type="button"
                className="h-10 bg-[#C52133] px-4 text-white hover:bg-[#aa1b2a]"
                onClick={() => setIsGuestFormOpen(true)}
              >
                <Plus className="mr-1 h-4 w-4" />
                បន្ថែមថ្មី
              </Button>

              <button
                type="button"
                onClick={handleDeleteSelected}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {isGuestFormOpen && (
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsGuestFormOpen(false)}
              >
                <motion.div
                  className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl"
                  initial={{ opacity: 0, scale: 0.96, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 8 }}
                  transition={{ duration: 0.2 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900">បន្ថែមភ្ញៀវថ្មី</h3>
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"
                      onClick={() => setIsGuestFormOpen(false)}
                    >
                      ×
                    </button>
                  </div>
                  <p className="mb-4 text-sm text-gray-500">បំពេញព័ត៌មានលម្អិតរបស់ភ្ញៀវនៅខាងក្រោម</p>

                  <form onSubmit={handleAddGuest} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-sm text-gray-600">* ឈ្មោះ</label>
                        <Input
                          value={guestName ?? ''}
                          onChange={(e) => setGuestName(e.target.value ?? '')}
                          placeholder="បញ្ចូលឈ្មោះ"
                          required
                          disabled={isSubmittingGuest}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm text-gray-600">ទូរស័ព្ទ (មិនចាំបាច់)</label>
                        <Input
                          value={guestPhone ?? ''}
                          onChange={(e) => setGuestPhone(sanitizeEnglishDigits(e.target.value ?? ''))}
                          onKeyDown={handleDigitsOnlyKeyDown}
                          onPaste={handleDigitsOnlyPaste}
                          placeholder="បញ្ចូលលេខទូរស័ព្ទ។"
                          disabled={isSubmittingGuest}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={12}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm text-gray-600">ក្រុម (មិនចាំបាច់)</label>
                        <select
                          value={guestGroup}
                          onChange={(e) => setGuestGroup(e.target.value)}
                          className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm"
                          disabled={isSubmittingGuest}
                        >
                          {GUEST_GROUP_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm text-gray-600">ស្លាក (មិនចាំបាច់)</label>
                        <select
                          value={guestTag}
                          onChange={(e) => setGuestTag(e.target.value)}
                          className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm"
                          disabled={isSubmittingGuest}
                        >
                          {GUEST_TAG_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-sm text-gray-600">កំណត់ចំណាំ (មិនចាំបាច់)</label>
                        <textarea
                          value={guestNote}
                          onChange={(e) => setGuestNote(e.target.value)}
                          rows={3}
                          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-red-400"
                          placeholder="បញ្ចូលកំណត់ចំណាំ"
                          disabled={isSubmittingGuest}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => setIsGuestFormOpen(false)}
                        disabled={isSubmittingGuest}
                      >
                        ✕ បោះបង់
                      </Button>
                      <Button
                        type="submit"
                        className="bg-[#C52133] text-white hover:bg-[#aa1b2a]"
                        disabled={isSubmittingGuest}
                      >
                        {isSubmittingGuest ? 'កំពុងបង្កើត...' : 'បង្កើតថ្មី'}
                      </Button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="overflow-x-auto w-full max-w-full rounded-lg border border-gray-100">
            <table className="min-w-[600px] table-auto text-sm whitespace-nowrap">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-12 px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      onChange={(e) => {
                        const ids = pageGuests.map((item) => item.id);
                        if (e.target.checked) {
                          setSelectedGuestIds((prev) => Array.from(new Set([...prev, ...ids])));
                        } else {
                          setSelectedGuestIds((prev) => prev.filter((id) => !ids.includes(id)));
                        }
                      }}
                    />
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">ឈ្មោះ</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">លេខទូរស័ព្ទ</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">ក្រុម</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">ស្លាក</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">ស្ថានភាព</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">សារជូនពរ</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">កំណត់ចំណាំ</th>
                  <th className="px-6 py-4 text-right font-semibold text-gray-700">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageGuests.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500 whitespace-nowrap">
                      មិនមានទិន្នន័យ។
                    </td>
                  </tr>
                ) : (
                  pageGuests.map((guest) => {
                    const statusMeta = getStatusMeta(guest.rsvpStatus || guest.status);

                    return (
                      <tr key={guest.id} className="transition-colors hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedGuestIds.includes(guest.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedGuestIds((prev) => Array.from(new Set([...prev, guest.id])));
                              } else {
                                setSelectedGuestIds((prev) => prev.filter((id) => id !== guest.id));
                              }
                            }}
                          />
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap">{guest.name}</td>
                        <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{guest.phone || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs ${getGroupBadgeClass(guest.group || 'GROOM_SIDE')} whitespace-nowrap`}>
                            {getGroupLabel(guest.group)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs ${getTagBadgeClass(guest.tag || 'OTHERS')} whitespace-nowrap`}>
                            {getTagLabel(guest.tag)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs ${statusMeta.classes} whitespace-nowrap`}>
                            {statusMeta.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{guest.greetingMessage}</td>
                        <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{guest.note}</td>
                        <td className="relative px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200"
                              title="Share"
                              onClick={() => openSharePopover(guest)}
                            >
                              <Send className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200"
                              title="QR"
                              onClick={() => openQrModal(guest)}
                            >
                              <QrCode className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200"
                              title="Menu"
                              onClick={() => openActionMenu(guest.id)}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </div>

                          <AnimatePresence>
                            {actionMenuGuestId === guest.id && (
                              <motion.div
                                ref={actionMenuRef}
                                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                transition={{
                                  duration: 0.2,
                                  type: "spring",
                                  stiffness: 300,
                                  damping: 25
                                }}
                                className={`absolute right-6 z-100 w-56 rounded-lg bg-white font-khmer-body overflow-visible ${
                                  guest === pageGuests[pageGuests.length - 1]
                                    ? 'bottom-full mb-2'
                                    : 'top-full mt-2'
                                } shadow-xl border border-gray-100`}
                                style={{
                                  filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.1))'
                                }}
                              >
                                {/* Arrow pointing to button */}
                                <div
                                  className={`absolute right-6 w-3 h-3 bg-white border border-gray-100 rotate-45 ${
                                    guest === pageGuests[pageGuests.length - 1]
                                      ? '-bottom-1.5'
                                      : '-top-1.5'
                                  }`}
                                  style={{
                                    borderRight: 'none',
                                    borderBottom: guest === pageGuests[pageGuests.length - 1] ? 'none' : '1px solid #f3f4f6'
                                  }}
                                />

                                <button
                                  type="button"
                                  onClick={() => openEditGuestModal(guest)}
                                  className="flex w-full items-center gap-2 rounded-t-lg px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-amber-50"
                                >
                                  <Pencil className="h-4 w-4 text-amber-600" />
                                  កែសម្រួលភ្ញៀវ
                                </button>

                                <div className="border-t border-gray-100" />

                                <button
                                  type="button"
                                  onClick={() => handleDeleteOneGuest(guest.id)}
                                  className="flex w-full items-center gap-2 rounded-b-lg px-3 py-2 text-left text-sm text-red-500 transition-colors hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  លុបភ្ញៀវនេះ?
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-col gap-3 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
            <p>សរុប: {totalRecords} កំណត់ត្រា</p>

            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={guestRowsPerPage}
                onChange={(e) => {
                  setGuestRowsPerPage(Number(e.target.value));
                  setGuestPage(1);
                }}
                className="h-8 rounded-md border border-gray-200 bg-white px-2"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>

              <span className="ml-2">Page {totalPages === 0 ? 1 : safePage} of {totalPages}</span>

              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white disabled:opacity-40"
                disabled={totalPages === 0 || safePage <= 1}
                onClick={() => setGuestPage((prev) => Math.max(1, prev - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white disabled:opacity-40"
                disabled={totalPages === 0 || safePage >= totalPages}
                onClick={() => setGuestPage((prev) => prev + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isEditGuestModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
              onClick={() => setIsEditGuestModalOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl font-khmer-body"
              >
                <h3 className="font-khmer-heading text-2xl text-black">កែសម្រួលភ្ញៀវ</h3>
                <p className="mt-2 text-sm text-gray-500">បំពេញព័ត៌មានលម្អិតរបស់ភ្ញៀវនៅខាងក្រោម</p>

                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-gray-700">* ឈ្មោះ</label>
                    <Input
                      value={editGuestName ?? ''}
                      onChange={(e) => setEditGuestName(e.target.value ?? '')}
                      placeholder="បញ្ចូលឈ្មោះ"
                      className="border-gray-200 bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-gray-700">ទូរស័ព្ទ (មិនចាំបាច់)</label>
                    <Input
                      value={editGuestPhone ?? ''}
                      onChange={(e) => setEditGuestPhone(sanitizeEnglishDigits(e.target.value ?? ''))}
                      onKeyDown={handleDigitsOnlyKeyDown}
                      onPaste={handleDigitsOnlyPaste}
                      placeholder="បញ្ចូលលេខទូរស័ព្ទ។"
                      className="border-gray-200 bg-gray-50"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={12}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-700">ក្រុម (មិនចាំបាច់)</label>
                    <select
                      value={editGuestGroup}
                      onChange={(e) => setEditGuestGroup(e.target.value)}
                      className="h-10 w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-sm"
                    >
                      <option value="GROOM_SIDE">ខាងកូនកំលោះ</option>
                      <option value="BRIDE_SIDE">ខាងកូនក្រមុំ</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-700">ស្លាក (មិនចាំបាច់)</label>
                    <select
                      value={editGuestTag}
                      onChange={(e) => setEditGuestTag(e.target.value)}
                      className="h-10 w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-sm"
                    >
                      <option value="HIGH_SCHOOL_FRIEND">មិត្តភក្តិវិទ្យាល័យ</option>
                      <option value="COLLEGE_FRIEND">មិត្តភក្តិឧត្តមសិក្សា</option>
                      <option value="FRIEND">មិត្តភក្តិ</option>
                      <option value="TEAMWORK">ការងារក្រុម</option>
                      <option value="RELATIVE">សាច់ញាតិ</option>
                      <option value="OTHERS">ផ្សេងៗ</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm text-gray-700">កំណត់ចំណាំ (មិនចាំបាច់)</label>
                    <textarea
                      value={editGuestNote}
                      onChange={(e) => setEditGuestNote(e.target.value)}
                      className="min-h-24 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-gray-300"
                      placeholder="បញ្ចូលកំណត់ចំណាំ"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditGuestModalOpen(false)}
                    className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
                  >
                    ✕ បោះបង់
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEditedGuest}
                    className="rounded-md bg-[#C52133] px-4 py-2 text-sm text-white hover:bg-[#aa1b2a]"
                  >
                    រក្សាទុក
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {shareGuestId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] flex items-center justify-center bg-black/20 p-4"
              onClick={() => setShareGuestId(null)}
            >
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-xl rounded-3xl bg-white p-5 shadow-xl"
              >
                <h3 className="font-khmer-body text-xl font-semibold text-gray-900">តំណអញ្ជើញ</h3>
                {shareNotice && <p className="mt-1 text-sm text-emerald-600">{shareNotice}</p>}

                <div className="mt-4 flex items-start gap-4">
                  <div className="flex-1 rounded-2xl bg-gray-100 p-4 text-sm leading-relaxed text-gray-700 break-all">
                    {shareLink}
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleCopyInvitation}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#b91c2f] bg-[#C52133] text-white transition-colors hover:bg-[#ad1d2c]"
                      title="Copy"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadInvitation}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-rose-200 bg-rose-100 text-[#C52133] transition-colors hover:bg-rose-200"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleRefreshInvitationLink}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-gray-900 transition-colors hover:bg-gray-200"
                      title="Refresh"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isQrModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
              onClick={() => setIsQrModalOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-khmer-body text-xl font-semibold text-gray-900">QR Code</h3>
                  <button
                    type="button"
                    onClick={() => setIsQrModalOpen(false)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=700x700&data=${encodeURIComponent(qrLink)}`}
                    alt="Guest QR Code"
                    className="mx-auto h-64 w-64 rounded-xl bg-white object-contain"
                  />
                </div>

                <p className="mt-3 text-center text-sm text-gray-700">{qrGuestName}</p>
                <p className="mt-1 text-center text-xs text-gray-500">ស្កេនដើម្បីមើលធៀបអញ្ជើញ</p>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleDownloadQrCode}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#C52133] bg-white px-8 py-3 font-khmer-body text-sm font-semibold text-[#C52133] transition-colors hover:bg-rose-50"
                  >
                    <Download className="h-4 w-4" />
                    ទាញយក QR កូដ
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    );
  };

  const renderGiftsTab = () => {
    const filteredGiftRows = giftRows.filter((item) => {
      const query = giftSearch.trim().toLowerCase();
      const searchable = [
        item.guestName,
        item.phone || '',
        item.note || '',
        item.paymentType,
        item.currencyType,
      ].join(' ').toLowerCase();
      return !query || searchable.includes(query);
    });

    const totalGiftRecords = filteredGiftRows.length;
    const totalGiftPages = totalGiftRecords === 0 ? 1 : Math.ceil(totalGiftRecords / giftRowsPerPage);
    const safeGiftPage = Math.min(giftPage, totalGiftPages);
    const giftStartIndex = (safeGiftPage - 1) * giftRowsPerPage;
    const pagedGiftRows = filteredGiftRows.slice(giftStartIndex, giftStartIndex + giftRowsPerPage);

    const filteredGuestsForGift = guests.filter((guest) => {
      const query = giftGuestSearch.trim().toLowerCase();
      const searchable = [guest.name, guest.phone || ''].join(' ').toLowerCase();
      return !query || searchable.includes(query);
    });

    const selectedGiftGuest = guests.find((guest) => guest.id === giftGuestId);
    const selectedGiftGuestGroup = GUEST_GROUP_OPTIONS.find((item) => item.value === (selectedGiftGuest?.group || 'GROOM_SIDE'))?.label || 'ខាងកូនកំលោះ';
    const selectedGiftGuestTag = GUEST_TAG_OPTIONS.find((item) => item.value === (selectedGiftGuest?.tag || 'OTHERS'))?.label || 'ផ្សេងៗ';
    const selectedGuestGiftRows = selectedGiftGuest
      ? giftRows.filter((row) => row.guestId === selectedGiftGuest.id)
      : [];
    const isDuplicateGuestOnCreate = !editingGiftRowId && selectedGuestGiftRows.length > 0;

    const sanitizeMoneyInput = (value: string) => {
      const normalized = value.replace(/,/g, '');
      const cleaned = normalized.replace(/[^0-9.]/g, '');
      const [integerPart, ...decimalParts] = cleaned.split('.');

      if (decimalParts.length === 0) {
        return integerPart;
      }

      return `${integerPart}.${decimalParts.join('')}`;
    };

    const handleGiftAmountChange = (value: string) => {
      setGiftAmount(sanitizeMoneyInput(value));
    };

    const handleGiftAmountKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      const allowedControlKeys = [
        'Backspace',
        'Delete',
        'Tab',
        'ArrowLeft',
        'ArrowRight',
        'Home',
        'End',
        'Enter',
        'Escape',
      ];

      if (allowedControlKeys.includes(event.key)) {
        return;
      }

      if ((event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x', 'z', 'y'].includes(event.key.toLowerCase())) {
        return;
      }

      if (/^[0-9]$/.test(event.key)) {
        return;
      }

      if (event.key === '.') {
        if (event.currentTarget.value.includes('.')) {
          event.preventDefault();
        }
        return;
      }

      event.preventDefault();
    };

    const handleGiftAmountPaste = (event: ClipboardEvent<HTMLInputElement>) => {
      const pasted = event.clipboardData?.getData('text') || '';
      const sanitized = sanitizeMoneyInput(pasted);

      if (!sanitized) {
        event.preventDefault();
      }
    };
    const getGuestInitials = (name: string) => {
      const clean = name.trim();
      if (!clean) return 'GU';

      const parts = clean.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
      }

      return clean.slice(0, 2).toUpperCase();
    };

    const getAvatarColorClass = (name: string) => {
      const seed = Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0);
      return seed % 2 === 0
        ? 'bg-emerald-100 text-emerald-700'
        : 'bg-amber-100 text-amber-700';
    };

    const resetGiftModal = () => {
      setEditingGiftRowId(null);
      setGiftGuestId(null);
      setGiftGuestSearch('');
      setIsGiftGuestMenuOpen(false);
      setGiftPaymentType('CASH');
      setGiftCurrencyType('USD');
      setGiftAmount('0');
      setGiftNote('');
    };

    const handleOpenGiftModal = () => {
      resetGiftModal();
      setIsGiftModalOpen(true);
    };

    const handleOpenEditGiftModal = (row: GiftRow) => {
      setEditingGiftRowId(row.id);
      setGiftGuestId(row.guestId);
      setGiftGuestSearch('');
      setIsGiftGuestMenuOpen(false);
      setGiftPaymentType(row.paymentType);
      setGiftCurrencyType(row.currencyType);
      setGiftAmount(String(row.amount || 0));
      setGiftNote(row.note || '');
      setIsGiftModalOpen(true);
    };

    const handleCloseGiftModal = () => {
      setIsGiftModalOpen(false);
      setIsGiftGuestMenuOpen(false);
    };

    const handleCreateGift = async () => {
      if (!selectedGiftGuest) {
        setError('សូមជ្រើសរើសភ្ញៀវជាមុនសិន');
        setSuccess('');
        return;
      }

      if (!editingGiftRowId && selectedGuestGiftRows.length > 0) {
        setError('ភ្ញៀវនេះបានចងដៃរួចហើយ មិនអាចបង្កើតថ្មីម្ដងទៀតបានទេ');
        setSuccess('');
        return;
      }

      const parsedAmount = Number(String(giftAmount || '0').replace(/,/g, ''));
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        setError('សូមបញ្ចូលចំនួនទឹកប្រាក់ឲ្យត្រឹមត្រូវ');
        setSuccess('');
        return;
      }

      try {
        if (!editingGiftRowId) {
          const confirmed = window.confirm('តើអ្នកចង់បង្កើតចំណងដៃថ្មីមែនទេ?');
          if (!confirmed) return;
        }

        if (editingGiftRowId) {
          const updated = await apiClient.updateGift(editingGiftRowId, {
            guestId: selectedGiftGuest.id,
            paymentType: giftPaymentType,
            currencyType: giftCurrencyType,
            amount: parsedAmount,
            note: giftNote.trim() || '-',
          });

          const updatedRow = mapGiftToRow(updated);
          setGiftRows((prev) => prev.map((row) => (row.id === editingGiftRowId ? updatedRow : row)));
          setSuccess('បានកែប្រែចំណងដៃរួចរាល់');
        } else {
          const created = await apiClient.createGift(eventId, {
            guestId: selectedGiftGuest.id,
            paymentType: giftPaymentType,
            currencyType: giftCurrencyType,
            amount: parsedAmount,
            note: giftNote.trim() || '-',
          });

          setGiftRows((prev) => [mapGiftToRow(created), ...prev]);
          setSuccess('បានបន្ថែមចំណងដៃថ្មីរួចរាល់');
        }

        setError('');
        handleCloseGiftModal();
      } catch (createError: any) {
        setSuccess('');
        const message = createError?.response?.data?.message;
        if (Array.isArray(message)) {
          setError(message.join(', '));
        } else {
          setError(message || 'មិនអាចរក្សាទុកចំណងដៃបានទេ');
        }
      }
    };

    const handleDeleteGiftRow = async (id: string) => {
      const confirmed = window.confirm('តើអ្នកចង់លុបចំណងដៃនេះមែនទេ?');
      if (!confirmed) return;

      try {
        await apiClient.deleteGift(id);
        setGiftRows((prev) => prev.filter((row) => row.id !== id));
        setSelectedGiftRowIds((prev) => prev.filter((item) => item !== id));
        setError('');
      } catch {
        setSuccess('');
        setError('មិនអាចលុបទិន្នន័យចំណងដៃបានទេ');
      }
    };

    const handleDeleteSelectedGiftRows = async () => {
      const targetIds = selectedGiftRowIds.length > 0 ? selectedGiftRowIds : giftRows.map((row) => row.id);
      if (targetIds.length === 0) {
        setError('មិនមានទិន្នន័យសម្រាប់លុបទេ');
        setSuccess('');
        return;
      }

      const confirmed =
        selectedGiftRowIds.length > 0
          ? window.confirm(`តើអ្នកចង់លុបចំណងដៃចំនួន ${targetIds.length} មែនទេ?`)
          : window.confirm('មិនបានជ្រើសចំណងដៃ។ តើអ្នកចង់លុបទាំងអស់មែនទេ?');
      if (!confirmed) return;

      try {
        const results = await Promise.allSettled(targetIds.map((id) => apiClient.deleteGift(id)));
        const deletedIds = targetIds.filter((_, index) => results[index]?.status === 'fulfilled');
        const failedCount = targetIds.length - deletedIds.length;

        if (deletedIds.length > 0) {
          setGiftRows((prev) => prev.filter((row) => !deletedIds.includes(row.id)));
          setSelectedGiftRowIds((prev) => prev.filter((id) => !deletedIds.includes(id)));
          setSuccess('បានលុបទិន្នន័យចំណងដៃរួចរាល់');
          setError('');
        }

        if (failedCount > 0) {
          setSuccess('');
          setError('មិនអាចលុបទិន្នន័យចំណងដៃមួយចំនួនបានទេ');
        }
      } catch {
        setSuccess('');
        setError('មិនអាចលុបទិន្នន័យចំណងដៃមួយចំនួនបានទេ');
      }
    };

    const handleExportGiftRows = async () => {
      const rowsToExport =
        selectedGiftRowIds.length > 0
          ? giftRows.filter((row) => selectedGiftRowIds.includes(row.id))
          : giftRows;

      if (rowsToExport.length === 0) {
        setError('មិនមានទិន្នន័យសម្រាប់ទាញយកទេ');
        setSuccess('');
        return;
      }

      setError('');
      setSuccess('កំពុងរៀបចំឯកសារ Excel...');

      const exchangeRateForExport = 4000;
      const exportRows = rowsToExport.map((row, index) => {
        const amountUsd = row.currencyType === 'USD' ? row.amount : row.amount / exchangeRateForExport;
        const amountKhr = row.currencyType === 'KHR' ? row.amount : row.amount * exchangeRateForExport;

        return {
          No: index + 1,
          'Gift ID': row.id,
          'Guest Name': row.guestName,
          'Guest Phone': row.phone || '',
          'Even ID': row.eventId,
          'Payment type': paymentLabel(row.paymentType),
          'Currency Type': currencyLabel(row.currencyType),
          'Amount (USD)': Number(amountUsd.toFixed(2)),
          'Amount(KHR)': Number(amountKhr.toFixed(2)),
          Note: row.note || '',
          'Created Date': row.createdAt,
          'Updated Date': row.updatedAt,
        };
      });

      try {
        const XLSX = await import('xlsx');
        const worksheet = XLSX.utils.json_to_sheet(exportRows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Gifts');
        const stamp = new Date().toISOString().slice(0, 10);
        const safeEventName = (event?.title || 'event').replace(/[\\/:*?"<>|]/g, '-');
        XLSX.writeFile(workbook, `${safeEventName}_GiftList_${stamp}.xlsx`);

        setSuccess('ទាញយកបានជោគជ័យ!');
      } catch {
        setSuccess('');
        setError('មិនអាចទាញយកឯកសារ Excel បានទេ');
      }
    };

    const allGiftRowsSelected =
      pagedGiftRows.length > 0 && pagedGiftRows.every((row) => selectedGiftRowIds.includes(row.id));

    const exchangeRate = 4000;
    const receivedGiftCount = giftRows.length;
    const totalUsd = giftRows
      .filter((row) => row.currencyType === 'USD')
      .reduce((sum, row) => sum + (row.amount || 0), 0);
    const totalKhr = giftRows
      .filter((row) => row.currencyType === 'KHR')
      .reduce((sum, row) => sum + (row.amount || 0), 0);
    const totalAsUsd = totalUsd + totalKhr / exchangeRate;

    const formatAmount = (value: number) => {
      return new Intl.NumberFormat('en-US').format(value || 0);
    };

    const formatUsd = (value: number) => {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(value || 0);
    };

    const currencyLabel = (value: 'USD' | 'KHR') => (value === 'USD' ? 'ប្រាក់ដុល្លារ ($)' : 'ប្រាក់រៀល (៛)');
    const paymentLabel = (value: 'CASH' | 'KHQR') => (value === 'CASH' ? 'Cash' : 'KHQR');

    return (
      <section className="space-y-4 rounded-2xl bg-gray-50 p-4 font-khmer-body">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="flex h-32 items-center justify-between rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Users className="h-5 w-5" />
              </span>
              <p className="text-sm text-gray-600">ចំណងដៃដែលបានទទួល</p>
            </div>
            <p className="font-khmer-heading text-3xl text-gray-900">{formatAmount(receivedGiftCount)}</p>
          </div>

          <div className="flex h-32 items-center justify-between rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <DollarSign className="h-5 w-5" />
              </span>
              <p className="text-sm text-gray-600">សរុប ដុល្លារ ($)</p>
            </div>
            <p className="font-khmer-heading text-3xl text-gray-900">{formatUsd(totalUsd)}</p>
          </div>

          <div className="flex h-32 items-center justify-between rounded-2xl border border-violet-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-violet-50 text-violet-600 font-semibold">
                ៛
              </span>
              <p className="text-sm text-gray-600">សរុប រៀល (៛)</p>
            </div>
            <p className="font-khmer-heading text-3xl text-gray-900">{formatAmount(totalKhr)}</p>
          </div>

          <div className="flex h-32 flex-col justify-between rounded-2xl border border-rose-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                  <TrendingUp className="h-5 w-5" />
                </span>
                <p className="text-sm text-gray-600">សរុបជាដុល្លារ</p>
              </div>
              <p className="font-khmer-heading text-3xl text-gray-900">{formatUsd(totalAsUsd)}</p>
            </div>
            <p className="text-xs text-gray-500">1 USD = 4000 KHR</p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-khmer-heading text-2xl text-gray-900">បញ្ជីចំណងដៃ</h2>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleOpenGiftModal}
                className="inline-flex h-10 items-center rounded-lg bg-[#7A1F2B] px-4 text-sm font-medium text-white hover:bg-[#651925]"
              >
                <Plus className="mr-1 h-4 w-4" />
                បន្ថែមថ្មី
              </button>

              <button
                type="button"
                onClick={handleExportGiftRows}
                className="inline-flex h-10 items-center rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Download className="mr-1 h-4 w-4" />
                ទាញយក
              </button>

              <button
                type="button"
                onClick={handleDeleteSelectedGiftRows}
                className="inline-flex h-10 items-center rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Trash2 className="mr-1 h-4 w-4" />
                លុប
              </button>
            </div>
          </div>

          <div className="mb-4">
            <div className="relative max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={giftSearch}
                onChange={(e) => {
                  setGiftSearch(e.target.value);
                  setGiftPage(1);
                }}
                placeholder="ស្វែងរក ..."
                className="h-11 rounded-full border-gray-200 pl-10"
              />
            </div>
          </div>

          <div className="overflow-x-auto whitespace-nowrap max-w-full rounded-xl border border-gray-100 bg-white scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <table className="min-w-full table-auto text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-12 px-5 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={allGiftRowsSelected}
                      onChange={(e) => {
                        const ids = pagedGiftRows.map((row) => row.id);
                        if (e.target.checked) {
                          setSelectedGiftRowIds((prev) => Array.from(new Set([...prev, ...ids])));
                        } else {
                          setSelectedGiftRowIds((prev) => prev.filter((id) => !ids.includes(id)));
                        }
                      }}
                    />
                  </th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-700 sticky left-0 z-10 bg-white">ឈ្មោះភ្ញៀវ</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-700">លេខទូរស័ព្ទ</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-700">ប្រភេទការទូទាត់</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-700">ប្រភេទរូបិយប័ណ្ណ</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-700">ចំនួនទឹកប្រាក់</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-700">កំណត់ចំណាំ</th>
                  <th className="px-5 py-3 text-right font-semibold text-gray-700">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {pagedGiftRows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-14 text-center text-gray-500">
                      មិនមានទិន្នន័យ។
                    </td>
                  </tr>
                )}

                {pagedGiftRows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <input
                        type="checkbox"
                        checked={selectedGiftRowIds.includes(row.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedGiftRowIds((prev) => Array.from(new Set([...prev, row.id])));
                          } else {
                            setSelectedGiftRowIds((prev) => prev.filter((id) => id !== row.id));
                          }
                        }}
                      />
                    </td>
                    <td className="px-5 py-3 text-gray-900 sticky left-0 z-10 bg-white">
                      <div className="inline-flex items-center gap-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-50 text-[#C52133]">
                          <User className="h-4 w-4" />
                        </span>
                        <span>{row.guestName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-700">{row.phone || '-'}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                          row.paymentType === 'CASH'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-sky-100 text-sky-700'
                        }`}
                      >
                        {paymentLabel(row.paymentType)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                          row.currencyType === 'USD'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-violet-100 text-violet-700'
                        }`}
                      >
                        {currencyLabel(row.currencyType)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center rounded-lg px-2.5 py-1 text-sm font-semibold ${
                          row.currencyType === 'USD'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-violet-50 text-violet-700'
                        }`}
                      >
                        {row.currencyType === 'USD' ? '$' : '៛'} {formatAmount(row.amount)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-700">{row.note || '-'}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditGiftModal(row)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteGiftRow(row.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-[#C52133] hover:bg-rose-100"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-col gap-3 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
            <p>សរុប: {totalGiftRecords} កំណត់ត្រា</p>

            <div className="flex flex-wrap items-center gap-2">
              <span>ទិន្នន័យក្នុងមួយទំព័រ</span>
              <select
                value={giftRowsPerPage}
                onChange={(e) => {
                  setGiftRowsPerPage(Number(e.target.value));
                  setGiftPage(1);
                }}
                className="h-8 rounded-md border border-gray-200 bg-white px-2"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>

              <span className="ml-2">ទំព័រ {safeGiftPage} នៃ {totalGiftPages}</span>

              <button
                type="button"
                onClick={() => setGiftPage(1)}
                disabled={safeGiftPage <= 1}
                className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ទៅទំព័រដំបូង
              </button>

              <button
                type="button"
                onClick={() => setGiftPage((prev) => Math.max(1, prev - 1))}
                disabled={safeGiftPage <= 1}
                className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ទៅទំព័រមុន
              </button>

              <button
                type="button"
                onClick={() => setGiftPage((prev) => Math.min(totalGiftPages, prev + 1))}
                disabled={safeGiftPage >= totalGiftPages}
                className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ទៅទំព័របន្ទាប់
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isGiftModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[95] flex items-center justify-center bg-black/35 p-2 sm:p-4 backdrop-blur-[1px]"
              onClick={handleCloseGiftModal}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                onClick={(event) => event.stopPropagation()}
                className="flex w-full max-w-6xl flex-col rounded-3xl bg-white p-2 sm:p-6 shadow-2xl max-h-[98svh] sm:max-h-[86vh] overflow-y-auto"
              >
                <h3 className="font-khmer-heading text-xl sm:text-2xl text-gray-900">បន្ថែមចំណងដៃថ្មី</h3>

                <div className="mt-3 flex flex-col gap-4 sm:mt-5 sm:grid sm:min-h-0 sm:flex-1 sm:grid-cols-1 sm:gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
                  <div className="min-h-0 rounded-3xl border border-gray-100 bg-gray-50 p-3 sm:p-4">
                    <label className="mb-2 block text-sm text-gray-700">ភ្ញៀវ</label>
                    <div ref={giftGuestMenuRef} className="relative">
                      <button
                        type="button"
                        onClick={() => setIsGiftGuestMenuOpen((prev) => !prev)}
                        className="flex h-11 w-full items-center justify-between rounded-full border border-gray-200 bg-white px-4 text-left text-sm text-gray-700"
                      >
                        <span className="truncate">
                          {selectedGiftGuest
                            ? `${selectedGiftGuest.name} • ${selectedGiftGuestGroup} • ${selectedGiftGuestTag}`
                            : 'ជ្រើសរើសភ្ញៀវ'}
                        </span>
                        <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${isGiftGuestMenuOpen ? 'rotate-90' : ''}`} />
                      </button>

                      {isGiftGuestMenuOpen && (
                        <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
                          <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                              value={giftGuestSearch}
                              onChange={(e) => setGiftGuestSearch(e.target.value)}
                              placeholder="ស្វែងរកភ្ញៀវ..."
                              className="h-10 rounded-full pl-9"
                            />
                          </div>

                          <div className="mt-3 max-h-[44vh] space-y-2 overflow-auto pr-1">
                            {filteredGuestsForGift.length === 0 ? (
                              <p className="rounded-2xl bg-gray-50 px-3 py-4 text-sm text-gray-500">មិនមានភ្ញៀវ</p>
                            ) : (
                              filteredGuestsForGift.map((guest) => {
                                const isActive = giftGuestId === guest.id;
                                const groupLabel =
                                  GUEST_GROUP_OPTIONS.find((item) => item.value === (guest.group || 'GROOM_SIDE'))?.label ||
                                  'ខាងកូនកំលោះ';
                                const tagLabel =
                                  GUEST_TAG_OPTIONS.find((item) => item.value === (guest.tag || 'OTHERS'))?.label || 'ផ្សេងៗ';

                                return (
                                  <button
                                    key={guest.id}
                                    type="button"
                                    onClick={() => {
                                      setGiftGuestId(guest.id);
                                      setIsGiftGuestMenuOpen(false);
                                    }}
                                    className={`w-full rounded-2xl bg-white p-3 text-left shadow-sm transition ${isActive ? 'border-2 border-[#C52133]' : 'border border-gray-100 hover:border-gray-200'}`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <span
                                        className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${getAvatarColorClass(guest.name)}`}
                                      >
                                        {getGuestInitials(guest.name)}
                                      </span>

                                      <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-gray-900">{guest.name}</p>
                                        <div className="mt-1 flex flex-wrap gap-1.5">
                                          <span className="inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-[11px] text-rose-700">
                                            {groupLabel}
                                          </span>
                                          <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
                                            {tagLabel}
                                          </span>
                                        </div>
                                      </div>

                                      <span
                                        className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${isActive ? 'border-[#C52133] bg-[#C52133] text-white' : 'border-gray-300 bg-white text-transparent'}`}
                                      >
                                        <Check className="h-3.5 w-3.5" />
                                      </span>
                                    </div>
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {selectedGiftGuest && (
                      <div className="mt-3 rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50/70 to-white p-4">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-rose-700">ព័ត៌មានភ្ញៀវដែលបានជ្រើសរើស</p>
                          <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[11px] text-rose-700">
                            បានជ្រើសរើស
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="rounded-xl border border-sky-100 bg-sky-50/70 px-3 py-2">
                            <p className="text-xs text-sky-700">ឈ្មោះ</p>
                            <p className="text-sm font-medium text-sky-900">{selectedGiftGuest.name}</p>
                          </div>
                          <div className="rounded-xl border border-amber-100 bg-amber-50/70 px-3 py-2">
                            <p className="text-xs text-amber-700">លេខទូរស័ព្ទ</p>
                            <p className="text-sm font-medium text-amber-900">{selectedGiftGuest.phone || '-'}</p>
                          </div>
                          <div className="rounded-xl border border-rose-100 bg-white px-3 py-2">
                            <p className="text-xs text-gray-500">ក្រុម</p>
                            <span className="mt-1 inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-xs text-rose-700">
                              {selectedGiftGuestGroup}
                            </span>
                          </div>
                          <div className="rounded-xl border border-gray-200 bg-white px-3 py-2">
                            <p className="text-xs text-gray-500">ស្លាក</p>
                            <span className="mt-1 inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                              {selectedGiftGuestTag}
                            </span>
                          </div>
                        </div>

                        {selectedGuestGiftRows.length > 0 && (
                          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                            <p className="text-sm font-medium text-amber-800">ភ្ញៀវនេះបានចងដៃរួចហើយ</p>
                            <div className="mt-1 space-y-1">
                              {selectedGuestGiftRows.map((row) => (
                                <p key={row.id} className="text-xs text-amber-700">
                                  {paymentLabel(row.paymentType)}: {row.currencyType === 'USD' ? '$' : '៛'}{formatAmount(row.amount)}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="min-h-0 overflow-auto rounded-3xl border border-gray-100 bg-white p-4">
                    <div>
                      <label className="mb-2 block text-sm text-gray-700">ប្រភេទការទូទាត់</label>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setGiftPaymentType('CASH')}
                        className={`flex h-16 items-center gap-3 rounded-2xl border-2 px-4 text-left transition-colors ${
                          giftPaymentType === 'CASH' ? 'border-[#C52133] bg-rose-50/30' : 'border-gray-200 bg-white'
                        }`}
                      >
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                          <DollarSign className="h-5 w-5" />
                        </span>
                        <span className="text-sm font-medium text-gray-800">Cash</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setGiftPaymentType('KHQR')}
                        className={`flex h-16 items-center gap-3 rounded-2xl border-2 px-4 text-left transition-colors ${
                          giftPaymentType === 'KHQR' ? 'border-[#C52133] bg-rose-50/30' : 'border-gray-200 bg-white'
                        }`}
                      >
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 text-sky-600">
                          <QrCode className="h-5 w-5" />
                        </span>
                        <span className="text-sm font-medium text-gray-800">KHQR</span>
                      </button>
                      </div>
                    </div>

                  <div className="mt-4">
                    <label className="mb-2 block text-sm text-gray-700">ប្រភេទរូបិយប័ណ្ណ</label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setGiftCurrencyType('USD')}
                        className="flex h-12 items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700"
                      >
                        <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${giftCurrencyType === 'USD' ? 'border-[#C52133] bg-[#C52133] text-white' : 'border-gray-300 bg-white text-transparent'}`}>
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        ប្រាក់ដុល្លារ ($)
                      </button>

                      <button
                        type="button"
                        onClick={() => setGiftCurrencyType('KHR')}
                        className="flex h-12 items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700"
                      >
                        <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${giftCurrencyType === 'KHR' ? 'border-[#C52133] bg-[#C52133] text-white' : 'border-gray-300 bg-white text-transparent'}`}>
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        ប្រាក់រៀល (៛)
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="mb-2 block text-sm text-gray-700">ចំនួនទឹកប្រាក់</label>
                    <div className="flex h-14 sm:h-16 items-center rounded-2xl border border-gray-200 bg-white px-3 sm:px-4">
                      <span className="mr-2 sm:mr-3 text-2xl sm:text-3xl font-semibold text-blue-500">{giftCurrencyType === 'USD' ? '$' : '៛'}</span>
                      <input
                        value={giftAmount}
                        onChange={(e) => handleGiftAmountChange(e.target.value)}
                        onKeyDown={handleGiftAmountKeyDown}
                        onPaste={handleGiftAmountPaste}
                        className="w-full border-0 bg-transparent text-2xl sm:text-4xl font-semibold text-gray-900 outline-none"
                        inputMode="decimal"
                        pattern="[0-9.]*"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="mb-2 block text-sm text-gray-700">កំណត់ចំណាំ</label>
                    <Input
                      value={giftNote}
                      onChange={(e) => setGiftNote(e.target.value)}
                      placeholder="បញ្ចូលកំណត់ចំណាំ"
                      className="h-10 sm:h-11"
                    />
                  </div>
                </div>
              </div>

                <div className="mt-6 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCloseGiftModal}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-gray-100 px-5 text-sm text-gray-700 hover:bg-gray-200"
                  >
                    <X className="h-4 w-4" />
                    បោះបង់
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateGift}
                    disabled={isDuplicateGuestOnCreate}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#C52133] px-5 text-sm text-white hover:bg-[#aa1b2a] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:hover:bg-gray-300"
                  >
                    <Check className="h-4 w-4" />
                    {editingGiftRowId ? 'រក្សាទុក' : 'បង្កើតថ្មី'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    );
  };

  const renderEditTab = () => (
    <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <p className="mb-3 text-sm text-gray-500">កែប្រែព័ត៌មានព្រឹត្តិការណ៍</p>
      <form onSubmit={handleSaveEvent} className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {(() => {
          const editLabelClassName = 'mb-2 block text-sm font-medium text-gray-700 font-khmer-body';
          const editInputClassName =
            'h-11 rounded-xl border-gray-300 bg-white/90 shadow-sm transition focus-visible:border-red-500 focus-visible:ring-2 focus-visible:ring-red-100';
          const editSelectClassName =
            'h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100';

          return (
            <>
        {editEventType === 'WEDDING' && (
          <>
            <div>
              <label className={editLabelClassName}>ឈ្មោះកូនកំលោះ<RequiredStar /></label>
              <Input
                value={editGroomName}
                onChange={(e) => setEditGroomName(e.target.value)}
                disabled={isSavingEvent}
                className={editInputClassName}
              />
            </div>
            <div>
              <label className={editLabelClassName}>ឈ្មោះកូនក្រមុំ<RequiredStar /></label>
              <Input
                value={editBrideName}
                onChange={(e) => setEditBrideName(e.target.value)}
                disabled={isSavingEvent}
                className={editInputClassName}
              />
            </div>
          </>
        )}

        <div>
          <label className={editLabelClassName}>Event Type Catalog<RequiredStar /></label>
          <select
            value={selectedEventTypeId}
            onChange={(e) => setSelectedEventTypeId(e.target.value)}
            className={`${editSelectClassName} disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400`}
            disabled
          >
            {eventTypes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={editLabelClassName}>Template</label>
          <select
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            className={editSelectClassName}
            disabled={isSavingEvent || templates.length === 0}
          >
            {templates.length === 0 ? (
              <option value="">No template available</option>
            ) : (
              templates.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))
            )}
          </select>
        </div>

        {editEventType === 'CEREMONY' && (
          <>
            <div>
              <label className={editLabelClassName}>Ceremony Name<RequiredStar /></label>
              <Input
                placeholder="Ceremony Name"
                value={editCeremonyName}
                onChange={(e) => setEditCeremonyName(e.target.value)}
                disabled={isSavingEvent}
                className={editInputClassName}
              />
            </div>
            <div>
              <label className={editLabelClassName}>Wat Name<RequiredStar /></label>
              <Input
                placeholder="Wat Name"
                value={editWatName}
                onChange={(e) => setEditWatName(e.target.value)}
                disabled={isSavingEvent}
                className={editInputClassName}
              />
            </div>
            <div className="md:col-span-2">
              <label className={editLabelClassName}>Main Celebrant<RequiredStar /></label>
              <Input
                placeholder="Main Celebrant"
                value={editMainCelebrant}
                onChange={(e) => setEditMainCelebrant(e.target.value)}
                disabled={isSavingEvent}
                className={editInputClassName}
              />
            </div>
          </>
        )}

        {editEventType === 'FUNERAL' && (
          <>
            <div>
              <label className={editLabelClassName}>Deceased Name<RequiredStar /></label>
              <Input
                placeholder="Deceased Name"
                value={editDeceasedName}
                onChange={(e) => setEditDeceasedName(e.target.value)}
                disabled={isSavingEvent}
                className={editInputClassName}
              />
            </div>
            <div>
              <label className={editLabelClassName}>Age<RequiredStar /></label>
              <Input
                placeholder="Age"
                value={editDeceasedAge}
                onChange={(e) => setEditDeceasedAge(e.target.value)}
                disabled={isSavingEvent}
                className={editInputClassName}
              />
            </div>
            <div className="md:col-span-2">
              <label className={editLabelClassName}>Religious Rites<RequiredStar /></label>
              <Input
                placeholder="Religious Rites"
                value={editReligiousRites}
                onChange={(e) => setEditReligiousRites(e.target.value)}
                disabled={isSavingEvent}
                className={editInputClassName}
              />
            </div>
          </>
        )}

        {(editEventType === 'HOUSEWARMING' || editEventType === 'BIRTHDAY') && (
          <>
            <div>
              <label className={editLabelClassName}>Host Name<RequiredStar /></label>
              <div className="relative">
              <Home className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Host Name"
                value={editHostName}
                onChange={(e) => setEditHostName(e.target.value)}
                disabled={isSavingEvent}
                className={`${editInputClassName} pl-10`}
              />
            </div>
            </div>
            <div>
              <label className={editLabelClassName}>Event Title<RequiredStar /></label>
              <div className="relative">
              <PartyPopper className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Event Title"
                value={editEventTitle}
                onChange={(e) => setEditEventTitle(e.target.value)}
                disabled={isSavingEvent}
                className={`${editInputClassName} pl-10`}
              />
            </div>
            </div>
          </>
        )}

        <div>
          <label className={editLabelClassName}>ថ្ងៃចាប់ផ្តើម<RequiredStar /></label>
          <Input
            type="datetime-local"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
            required
            disabled={isSavingEvent}
            className={editInputClassName}
          />
        </div>

        <div>
          <label className={editLabelClassName}>ថ្ងៃបញ្ចប់កម្មវិធី</label>
          <Input
            type="datetime-local"
            value={editEndDate}
            onChange={(e) => setEditEndDate(e.target.value)}
            disabled={isSavingEvent}
            className={editInputClassName}
          />
        </div>

        <div>
          <label className={editLabelClassName}>Slug</label>
          <Input
            value={editSlug}
            onChange={(e) => setEditSlug(e.target.value)}
            placeholder="wedding-20260324190956-1731"
            disabled={isSavingEvent}
            className={editInputClassName}
          />
        </div>

        <div>
          <label className={editLabelClassName}>ប្រភេទកម្មវិធី<RequiredStar /></label>
          <div className="relative">
            <ListChecks className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <select
              value={editCategoryKey}
              onChange={(e) => handleEditCategoryChange(e.target.value)}
              className={`${editSelectClassName} pl-10`}
              disabled={isSavingEvent}
            >
              {EVENT_CATEGORY_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.subtitle}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={editLabelClassName}>ប្រភេទ<RequiredStar /></label>
          <div className="relative">
            <ListChecks className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <select
              value={editEventType}
              onChange={(e) => handleEditEventTypeChange(e.target.value as EditEventType)}
              className={`${editSelectClassName} pl-10 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400`}
              disabled
            >
              {EDIT_EVENT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={editLabelClassName}>អាសយដ្ឋាន<RequiredStar /></label>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              required
              disabled={isSavingEvent}
              className={`${editInputClassName} pl-10`}
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className={editLabelClassName}>Google Map</label>
          <div className="relative">
            <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              type="url"
              value={editGoogleMapLink}
              onChange={(e) => setEditGoogleMapLink(e.target.value)}
              disabled={isSavingEvent}
              className={`${editInputClassName} pl-10`}
            />
          </div>
        </div>

        <div className="md:col-span-2 rounded-lg border border-gray-200 p-4">
          <p className="mb-3 text-sm font-medium text-gray-700">អ្នកណាអាចចូលមើលបាន?</p>
          <div className="space-y-2 text-sm text-gray-700">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="visibility"
                value="PUBLIC"
                checked={visibility === 'PUBLIC'}
                onChange={() => setVisibility('PUBLIC')}
                disabled={isSavingEvent}
              />
              គ្រប់គ្នា
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="visibility"
                value="PRIVATE"
                checked={visibility === 'PRIVATE'}
                onChange={() => setVisibility('PRIVATE')}
                disabled={isSavingEvent}
              />
              សម្រាប់តែខ្ញុំ
            </label>
          </div>
        </div>

        <div className="md:col-span-2 rounded-lg border border-gray-200 p-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={preventDuplicateGuestNames}
              onChange={(e) => setPreventDuplicateGuestNames(e.target.checked)}
              disabled={isSavingEvent}
            />
            មិនអនុញ្ញាតឱ្យមានភ្ញៀវឈ្មោះដូចគ្នា
          </label>
        </div>

        <div className="md:col-span-2 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { key: 'backgroundImage', label: 'រូបភាព Cover', isKhqr: false },
            { key: 'khqrDollar', label: 'KHQR ប្រាក់ដុល្លារ', isKhqr: true },
            { key: 'khqrRiel', label: 'KHQR ប្រាក់រៀល', isKhqr: true },
          ].map((section) => (
            <div key={section.key}>
              <p className="mb-2 text-sm font-medium text-gray-700 font-khmer-body">{section.label}</p>
              <label
                htmlFor={`edit-${section.key}`}
                className={`flex h-40 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-3 text-center text-sm transition-all ${
                  filePreviews[section.key] || getStoredImageInfo(section.key as 'backgroundImage' | 'khqrDollar' | 'khqrRiel')
                    ? 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-100 shadow-sm'
                    : section.isKhqr
                      ? 'border-rose-300 bg-rose-50/70 text-rose-700 hover:border-rose-400'
                      : 'border-gray-300 bg-gray-50 text-gray-500 hover:border-red-300'
                }`}
              >
                {(() => {
                  const selectedPreviewUrl = filePreviews[section.key];
                  const storedInfo = getStoredImageInfo(
                    section.key as 'backgroundImage' | 'khqrDollar' | 'khqrRiel',
                  );

                  const previewUrl = selectedPreviewUrl || storedInfo?.url;
                  const previewName =
                    fileNames[section.key] ||
                    (selectedPreviewUrl
                      ? fileNames[section.key]
                      : storedInfo?.name);

                  if (!previewUrl) {
                    return (
                      <>
                        <Upload className="mb-2 h-5 w-5" />
                        <p>Click to upload or drag and drop</p>
                        <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF up to 50MB</p>
                      </>
                    );
                  }

                  return (
                    <>
                      <img
                        src={previewUrl}
                        alt={section.label}
                        className="mb-2 h-18 w-full rounded-md object-cover"
                      />
                      {selectedPreviewUrl && (
                        <p className="mb-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Success
                        </p>
                      )}
                      <p className="line-clamp-2 break-all text-xs text-gray-600">{previewName}</p>
                    </>
                  );
                })()}
                <input
                  id={`edit-${section.key}`}
                  name={section.key}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => handleFileChange(section.key, event.target.files?.[0] || null)}
                />
              </label>
            </div>
          ))}
        </div>

        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={isSavingEvent || isDeletingEvent}
            onClick={handleDeleteEvent}
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            {isDeletingEvent ? 'កំពុងលុប...' : 'លុបព្រឹត្តិការណ៍'}
          </Button>
          <Button type="submit" disabled={isSavingEvent || isDeletingEvent} className="bg-red-600 hover:bg-red-700">
            {isSavingEvent ? 'កំពុងរក្សាទុក...' : 'កែប្រែ'}
          </Button>
        </div>
            </>
          );
        })()}
      </form>
    </section>
  );

  const renderScheduleTab = () => (
    <section className="space-y-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-[#C52133]">
            <CalendarDays className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-moul text-2xl text-gray-900">របៀបវារៈកម្មវិធី</h2>
            <span className="mt-1 inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
              {agendaSections.length} របៀបវារៈ
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAgendaCollapsed((prev) => !prev)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
        >
          {isAgendaCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
        </button>
      </div>

      {!isAgendaCollapsed && (
        <div className="space-y-6 font-khmer-body">
          {agendaSections.map((section, sectionIndex) => (
            <div key={section.id} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    ឈ្មោះរបៀបវារៈ
                    <span className="ml-1 text-[#C52133]">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => removeAgendaSection(section.id)}
                    className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-[#C52133] hover:bg-rose-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    លុបរបៀបវារៈ
                  </button>
                </div>
                <Input
                  value={section.title}
                  onChange={(event) => {
                    const value = event.target.value;
                    setAgendaSections((prev) =>
                      prev.map((item) => (item.id === section.id ? { ...item, title: value } : item)),
                    );
                  }}
                  placeholder="ឧ. កម្មវិធីថ្ងៃទី ១..."
                  className="h-11 rounded-xl bg-gray-50"
                />
              </div>

              <div className="relative pl-6">
                <div className="absolute left-2 top-2 h-[calc(100%-16px)] border-l-2 border-dashed border-gray-200" />

                <div className="space-y-3">
                  {section.items.map((item) => (
                    <div key={item.id} className="relative rounded-2xl bg-gray-50 p-4">
                      <span className="absolute -left-6 top-5 h-3 w-3 rounded-full border-2 border-white bg-[#C52133]" />
                      <button
                        type="button"
                        onClick={() => removeAgendaItem(section.id, item.id)}
                        className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-[#C52133] hover:bg-rose-100"
                        title="លុបកម្មវិធី"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <div className="grid gap-3 md:grid-cols-[1.2fr_0.6fr_0.6fr]">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-600">ឈ្មោះកម្មវិធី</label>
                          <Input
                            value={item.title}
                            onChange={(event) => {
                              const value = event.target.value;
                              setAgendaSections((prev) =>
                                prev.map((agenda) =>
                                  agenda.id === section.id
                                    ? {
                                        ...agenda,
                                        items: agenda.items.map((agendaItem) =>
                                          agendaItem.id === item.id ? { ...agendaItem, title: value } : agendaItem,
                                        ),
                                      }
                                    : agenda,
                                ),
                              );
                            }}
                            placeholder="ឈ្មោះកម្មវិធី"
                            className="h-10 rounded-xl bg-white"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-600">កាលបរិច្ឆេទ</label>
                          <div className="relative">
                            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                              type="date"
                              value={item.date ?? ''}
                              onChange={(event) => {
                                const value = event.target.value;
                                setAgendaSections((prev) =>
                                  prev.map((agenda) =>
                                    agenda.id === section.id
                                      ? {
                                          ...agenda,
                                          items: agenda.items.map((agendaItem) =>
                                            agendaItem.id === item.id ? { ...agendaItem, date: value } : agendaItem,
                                          ),
                                        }
                                      : agenda,
                                  ),
                                );
                              }}
                              className="h-10 rounded-xl bg-white pl-9"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-600">ម៉ោង</label>
                          <div className="relative">
                            <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                              type="time"
                              value={item.time}
                              onChange={(event) => {
                                const value = event.target.value;
                                setAgendaSections((prev) =>
                                  prev.map((agenda) =>
                                    agenda.id === section.id
                                      ? {
                                          ...agenda,
                                          items: agenda.items.map((agendaItem) =>
                                            agendaItem.id === item.id ? { ...agendaItem, time: value } : agendaItem,
                                          ),
                                        }
                                      : agenda,
                                  ),
                                );
                              }}
                              className="h-10 rounded-xl bg-white pl-9"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="mt-4 inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  onClick={() =>
                    setAgendaSections((prev) =>
                      prev.map((agenda) =>
                        agenda.id === section.id
                          ? {
                              ...agenda,
                              items: [...agenda.items, { id: createAgendaItemId(), title: '', time: '', date: '' }],
                            }
                          : agenda,
                      ),
                    )
                  }
                >
                  + បន្ថែមកម្មវិធី
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            className="inline-flex w-full items-center justify-center rounded-full border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            onClick={() =>
              setAgendaSections((prev) => [
                ...prev,
                {
                  id: createAgendaId(),
                  title: getNextAgendaTitle(prev),
                  items: [{ id: createAgendaItemId(), title: '', time: '', date: '' }],
                },
              ])
            }
          >
            + បន្ថែមរបៀបវារៈ
          </button>

          <div className="flex justify-end">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-[#C52133] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#aa1b2a]"
              onClick={handleSaveAgenda}
              disabled={isSavingAgenda}
            >
              <Save className="h-4 w-4" />
              {isSavingAgenda ? 'កំពុងរក្សាទុក...' : 'រក្សាទុករបៀបវារៈ'}
            </button>
          </div>
        </div>
      )}
    </section>
  );

  const handleRemoveMyTemplate = (id: string) => {
    removeMyTemplate(id);
    setMyTemplates(getSavedMyTemplates());
  };

  const handlePreviewMyTemplate = async (templateId: string) => {
    setPreviewingTemplateId(templateId);
    setError('');

    try {
      const updatedEvent = await apiClient.updateEvent(eventId, { templateId });
      setEvent(updatedEvent);
    } catch (previewError) {
      console.error('Failed to apply template before preview:', previewError);
    } finally {
      setPreviewingTemplateId(null);
      router.push(`/invitation/${eventId}`);
    }
  };

  const formatBuilderEventDate = (rawDate?: string) => {
    if (!rawDate) {
      return 'ថ្ងៃរៀបអាពាហ៍ពិពាហ៍';
    }

    const parsed = new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) {
      return rawDate;
    }

    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();
    const minute = String(parsed.getMinutes()).padStart(2, '0');

    const hour24 = parsed.getHours();
    const amPm = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
    const hour = String(hour12).padStart(2, '0');

    return `${day}/${month}/${year}, ${hour}:${minute} ${amPm}`;
  };

  const formatBuilderDateOnly = (rawDate?: string) => {
    if (!rawDate) {
      return '';
    }

    const parsed = new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) {
      return '';
    }

    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const createBuilderStateSnapshot = (sourceEvent: Event): BuilderState => {
    const dateOnly = formatBuilderDateOnly(sourceEvent.date);
    const metadata = sourceEvent.metadata && typeof sourceEvent.metadata === 'object'
      ? (sourceEvent.metadata as { agenda?: unknown; eventEndDate?: unknown })
      : undefined;

    const agenda = Array.isArray(metadata?.agenda) && metadata?.agenda.length > 0
      ? metadata.agenda
      : [
          {
            id: `agenda-${Date.now()}`,
            title: 'របៀបវារៈទី1',
            items: [{ id: `agenda-item-${Date.now()}`, title: '', date: dateOnly, time: '' }],
          },
        ];

    return {
      language: 'km',
      musicEnabled: true,
      musicId: 'classic',
      musicUrl: sourceEvent.musicUrl || '/audio/wedding.mp3',
      textColor: '#e6c628',
      headingColor: '#142e7b',
      coverImageUrl: sourceEvent.coverImage || '',
      backgroundUrl: '/GlfpFt.jpg',
      eventTitle: sourceEvent.title || 'សិរីមង្គលអាពាហ៍ពិពាហ៍',
      eventSubtitle: '',
      eventDate: formatBuilderEventDate(sourceEvent.date),
      eventEndDate:
        typeof metadata?.eventEndDate === 'string' && metadata.eventEndDate.trim()
          ? metadata.eventEndDate
          : formatBuilderEventDate(sourceEvent.date),
      eventLocation: sourceEvent.location || 'ទីតាំងកម្មវិធី',
      greetingTitle: 'យើងខ្ញុំមានកិត្តិយសសូមគោរពអញ្ជើញ',
      greetingMessage:
        'សម្តេច ទ្រង់ ឯកឧត្តម លោកជំទាវ លោកអ្នកឧកញ៉ា អ្នកឧកញ៉ា ឧកញ៉ា លោក លោកស្រី អ្នកនាង កញ្ញា ព្រមទាំងប្រិយមិត្តអញ្ជើញចូលរួមជាអធិបតី និងជាភ្ញៀវកិត្តិយស ដើម្បីប្រសិទ្ធិពរជ័យសិរីសួស្តី ជ័យមង្គល ក្នុងពិធីអាពាហ៍ពិពាហ៍ កូនប្រុសស្រី របស់យើងខ្ញុំទាំងពីរ។',
      agendaSections: agenda as BuilderState['agendaSections'],
      mapUrl: sourceEvent.googleMapLink || '',
      mapImageUrl: '/map.png',
      galleryImages: [],
      thankYouTitle: 'សូមអរគុណ និងសូមអភ័យទោស',
      thankYouMessage:
        'យើងខ្ញុំទាំងពីរ សូមថ្លែងអំណរគុណ យ៉ាងជ្រាលជ្រៅ ចំពោះវត្តមាន ដ៏ឧត្តុង្គឧត្តមរបស់ សម្តេច ឯកឧត្តម លោកជំទាវ លោកអ្នកឧកញ៉ា អ្នកឧកញ៉ា ឧកញ៉ា លោក លោកស្រី អ្នកនាង កញ្ញា ដែលបាន អញ្ជើញចូលរួមជាកិត្តិយស ក្នុងពិធីសិរីសួស្តីអាពាហ៍ពិពាហ៍ របស់យើងខ្ញុំ នាពេលខាងមុខនេះ។ យើងខ្ញុំសូមការខន្តីអភ័យទោស ដែលពុំបានជូនលិខិតអញ្ជើញ ដោយផ្ទាល់ ។ ដោយការវកិច្ចដ៏ខ្ពង់ខ្ពស់ពីយើងខ្ញុំ។',
      khqrUsdUrl: sourceEvent.khqrDollar || '',
      khqrKhrUrl: sourceEvent.khqrRiel || '',
    };
  };

  const handleUseTemplateAndSave = async (template: Template) => {
    setPreviewingTemplateId(template.id);
    setError('');
    setSuccess('');

    try {
      const updatedEvent = await apiClient.updateEvent(eventId, { templateId: template.id });
      const snapshot = createBuilderStateSnapshot(updatedEvent);

      const saved = saveMyTemplate({
        templateId: template.id,
        eventId: updatedEvent.id,
        name: template.name,
        thumbnail: snapshot.coverImageUrl || template.thumbnail || template.previewUrl || updatedEvent.coverImage,
        previewUrl: snapshot.coverImageUrl || template.previewUrl || template.thumbnail || updatedEvent.coverImage,
        eventTypeId: updatedEvent.eventTypeId,
        eventTypeName: updatedEvent.eventType?.name || template.eventType?.name,
        builderState: snapshot,
      });

      const updatedMetadata =
        updatedEvent.metadata && typeof updatedEvent.metadata === 'object'
          ? (updatedEvent.metadata as Record<string, unknown>)
          : {};

      const currentSnapshots =
        updatedMetadata.myTemplateSnapshots && typeof updatedMetadata.myTemplateSnapshots === 'object'
          ? (updatedMetadata.myTemplateSnapshots as Record<string, unknown>)
          : {};

      const syncedEvent = await apiClient.updateEvent(updatedEvent.id, {
        metadata: {
          ...updatedMetadata,
          myTemplateSnapshots: {
            ...currentSnapshots,
            [saved.id]: {
              name: saved.name,
              builderState: saved.builderState,
              updatedAt: new Date().toISOString(),
            },
          },
        },
      });

      setEvent(syncedEvent);
      setMyTemplates(getSavedMyTemplates());
      setSuccess('បានយកមកប្រើ និងរក្សាទុកក្នុង គំរូធៀបខ្ញុំ រួចរាល់');
    } catch (previewError) {
      console.error('Failed to apply template and save:', previewError);
      setError('មិនអាចយកគំរូនេះមកប្រើបានទេ');
    } finally {
      setPreviewingTemplateId(null);
    }
  };

  const renderMyTemplateTab = () => (
    <section className="space-y-5 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">គំរូធៀបខ្ញុំ</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setMyTemplates(getSavedMyTemplates())}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          ផ្ទុកឡើងវិញ
        </Button>
      </div>

      {eventMyTemplates.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-600">
          មិនទាន់មានគំរូសម្រាប់ព្រឹត្តិការណ៍នេះទេ។
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {eventMyTemplates.map((template) => {
            const previewImage = template.thumbnail || template.previewUrl || event?.coverImage || '/map.png';

            return (
              <div key={template.id} className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                <div className="relative h-64 bg-gray-50 p-4">
                  <img
                    src={previewImage}
                    alt={template.name}
                    className="h-full w-full rounded-2xl object-cover shadow-sm"
                  />
                  <div className="absolute left-6 top-6 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-[#C52133] shadow-sm backdrop-blur">
                    {template.eventTypeName || 'Template'}
                  </div>
                </div>

                <div className="space-y-4 p-5 pt-2">
                  <div>
                    <h3 className="font-khmer-heading text-lg text-gray-900">{template.name}</h3>
                    <p className="mt-1 text-xs text-gray-500">
                      រក្សាទុកនៅ {new Date(template.savedAt).toLocaleString('km-KH')}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/events/${eventId}/my-template/${template.id}`} className="flex-1">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full border-gray-200 text-gray-700 hover:bg-gray-50"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        មើល
                      </Button>
                    </Link>

                    <Link href={`/events/${eventId}/builder?myTemplateId=${template.id}`} className="flex-1">
                      <Button type="button" className="w-full bg-[#C52133] text-white hover:bg-[#aa1b2a]">
                        <Pencil className="mr-2 h-4 w-4" />
                        កែប្រែវិញ
                      </Button>
                    </Link>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    onClick={() => handleRemoveMyTemplate(template.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    លុបចេញពីគំរូធៀបខ្ញុំ
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );

  const renderTemplateShopTab = () => (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-khmer-heading text-2xl text-gray-900">ហាងគំរូធៀប</h2>
          <p className="mt-1 text-sm text-gray-500">ជ្រើសរើសគំរូហើយចុច “រៀបចំធៀប” ដើម្បីកែតម្រូវ។</p>
        </div>
        {event?.template && (
          <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
            បានជ្រើសរើស: {event.template.name}
          </div>
        )}
      </div>

      {templateError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {templateError}
        </div>
      )}

      {isTemplatesLoading ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          កំពុងទាញយកគំរូធៀប...
        </div>
      ) : templates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          មិនមានគំរូធៀបទេ។
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => {
            const previewImage = template.thumbnail || template.previewUrl;
            const description =
              typeof template.config?.description === 'string' && template.config.description.trim()
                ? template.config.description.trim()
                : '';
            const eventTypeLabel = template.eventType?.name || 'Wedding';
            const subtitle = description || `គំរូសម្រាប់កម្មវិធី ${eventTypeLabel}`;
            
            const eventTitle = event?.title || 'កម្មវិធីរបស់យើង';
            const eventDate = event?.date ? new Date(event.date).toLocaleDateString('km-KH') : '';
            const location = event?.location || '';
            const eventCoverImage = event?.coverImage;

            const fallbackPreview = eventCoverImage || `data:image/svg+xml;utf8,${encodeURIComponent(
              `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200" viewBox="0 0 800 1200">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fff0f2" />
      <stop offset="100%" stop-color="#ffe4e8" />
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="10" stdDeviation="15" flood-opacity="0.1"/>
    </filter>
  </defs>
  <rect width="800" height="1200" fill="url(#bg)" />
  <rect x="50" y="50" width="700" height="1100" fill="#ffffff" rx="20" filter="url(#shadow)" />
  <rect x="70" y="70" width="660" height="1060" fill="none" stroke="#d4af37" stroke-width="2" rx="10" />
  
  <text x="400" y="200" text-anchor="middle" fill="#9f1239" font-family="'Segoe UI', Arial, sans-serif" font-size="28" letter-spacing="4">សូមគោរពអញ្ជើញ</text>
  <text x="400" y="450" text-anchor="middle" fill="#500724" font-family="'Segoe UI', Arial, sans-serif" font-size="54" font-weight="bold">${eventTitle}</text>
  <text x="400" y="550" text-anchor="middle" fill="#9f1239" font-family="'Segoe UI', Arial, sans-serif" font-size="24">(${template.name})</text>
  <rect x="300" y="650" width="200" height="2" fill="#d4af37" />
  <text x="400" y="750" text-anchor="middle" fill="#500724" font-family="'Segoe UI', Arial, sans-serif" font-size="32">${eventDate}</text>
  <text x="400" y="850" text-anchor="middle" fill="#881337" font-family="'Segoe UI', Arial, sans-serif" font-size="28">${location}</text>
</svg>`,
            )}`;

            const linkedMyTemplate = myTemplates.find(
              (item) => item.eventId === eventId && item.templateId === template.id,
            );

            return (
              <div key={template.id} className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                <div className="relative h-64 bg-gray-50 p-4">
                  <img
                    src={previewImage || fallbackPreview}
                    alt={eventTitle}
                    className="h-full w-full rounded-2xl object-cover shadow-sm"
                  />
                  <div className="absolute left-6 top-6 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-[#C52133] shadow-sm backdrop-blur">
                    {eventTypeLabel}
                  </div>
                </div>
                <div className="space-y-4 p-5 pt-2">
                  <div>
                    <h3 className="font-khmer-heading text-lg text-gray-900">{eventTitle}</h3>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">គំរូធៀប៖ {template.name}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {linkedMyTemplate ? (
                      <>
                        <Link href={`/events/${eventId}/my-template/${linkedMyTemplate.id}`} className="flex-1">
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full border-gray-200 text-gray-700 hover:bg-gray-50"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            មើល
                          </Button>
                        </Link>
                        <Link href={`/events/${eventId}/builder?myTemplateId=${linkedMyTemplate.id}`} className="flex-1">
                          <Button type="button" className="w-full bg-[#C52133] text-white hover:bg-[#aa1b2a]">
                            <Pencil className="mr-2 h-4 w-4" />
                            កែប្រែវិញ
                          </Button>
                        </Link>
                      </>
                    ) : (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full flex-1 border-gray-200 text-gray-700 hover:bg-gray-50"
                          onClick={() => handleUseTemplateAndSave(template)}
                          disabled={previewingTemplateId === template.id}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          {previewingTemplateId === template.id ? 'កំពុងយកមកប្រើ...' : 'យកមកប្រើ'}
                        </Button>
                        <Link
                          href={`/events/${eventId}/builder?templateId=${template.id}`}
                          className="flex-1"
                        >
                          <Button type="button" className="w-full bg-[#C52133] text-white hover:bg-[#aa1b2a]">
                            <Pencil className="mr-2 h-4 w-4" />
                            រៀបចំធៀប
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );

  const renderQrTab = () => (
    <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-khmer-heading text-2xl text-gray-900">បង្កើត QR</h2>
          <p className="mt-1 text-sm text-gray-500">ទាញយក QR សម្រាប់ចែករំលែកការអញ្ជើញ</p>
        </div>
      </div>

      {invitationUrl ? (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Invitation Link</p>
            <div className="mt-3 rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-700 break-all">
              {invitationUrl}
            </div>
            <p className="mt-3 text-xs text-gray-500">ប្រើតំណនេះសម្រាប់បញ្ជូនទៅភ្ញៀវ។</p>
          </div>

          <div className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-5">
            <div className="flex h-56 w-56 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(invitationUrl)}`}
                alt="Invitation QR"
                className="h-48 w-48"
              />
            </div>
            <a
              href={`https://api.qrserver.com/v1/create-qr-code/?size=1024x1024&data=${encodeURIComponent(invitationUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex h-11 items-center rounded-full bg-[#C52133] px-5 text-sm font-semibold text-white hover:bg-[#aa1b2a]"
            >
              ទាញយក QR
            </a>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-600">កំពុងបង្កើតតំណភ្ជាប់...</p>
      )}
    </section>
  );

  const renderExpensesTab = () => {
    const totalRecords = expenseRows.length;
    const totalPages = totalRecords === 0 ? 0 : Math.ceil(totalRecords / 10);
    const isMenuOpen = !!expenseColumnMenu;
    const isExpenseFormReady = expenseName.trim().length > 0 && expenseBudget.trim().length > 0;

    const formatCurrency = (value: number) =>
      new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0);

    const visibleColumns = {
      name: !hiddenExpenseColumns.has('name'),
      budget: !hiddenExpenseColumns.has('budget'),
      actual: !hiddenExpenseColumns.has('actual'),
      note: !hiddenExpenseColumns.has('note'),
    };

    const sortedExpenseRows = [...expenseRows].sort((a, b) => {
      if (!expenseSort) {
        return 0;
      }

      const direction = expenseSort.direction === 'asc' ? 1 : -1;
      const getValue = (row: typeof expenseRows[number]) => {
        switch (expenseSort.columnId) {
          case 'name':
            return row.name.toLowerCase();
          case 'budget':
            return row.budget;
          case 'actual':
            return row.actual;
          case 'note':
            return row.note.toLowerCase();
          default:
            return '';
        }
      };

      const valueA = getValue(a);
      const valueB = getValue(b);

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return (valueA - valueB) * direction;
      }

      return String(valueA).localeCompare(String(valueB)) * direction;
    });

    const paymentTotal = expensePayments.reduce((sum, payment) => {
      const numeric = Number(payment.amount.replace(/,/g, ''));
      return sum + (Number.isFinite(numeric) ? numeric : 0);
    }, 0);

    const formatPaymentTotal = (value: number) =>
      new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0);

    const allExpenseRowsSelected =
      sortedExpenseRows.length > 0 && sortedExpenseRows.every((row) => selectedExpenseRowIds.includes(row.id));

    const sanitizeExpenseBudget = (value: string) => {
      const normalized = value.replace(/,/g, '');
      const cleaned = normalized.replace(/[^0-9.]/g, '');
      const [integerPart, ...decimalParts] = cleaned.split('.');

      if (decimalParts.length === 0) {
        return integerPart;
      }

      return `${integerPart}.${decimalParts.join('')}`;
    };

    const handleExpenseBudgetChange = (value: string) => {
      setExpenseBudget(sanitizeExpenseBudget(value));
    };

    const handleExpenseBudgetKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      const allowedControlKeys = [
        'Backspace',
        'Delete',
        'Tab',
        'ArrowLeft',
        'ArrowRight',
        'Home',
        'End',
        'Enter',
        'Escape',
      ];

      if (allowedControlKeys.includes(event.key)) {
        return;
      }

      if ((event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x', 'z', 'y'].includes(event.key.toLowerCase())) {
        return;
      }

      if (/^[0-9]$/.test(event.key)) {
        return;
      }

      if (event.key === '.') {
        if (event.currentTarget.value.includes('.')) {
          event.preventDefault();
        }
        return;
      }

      event.preventDefault();
    };

    const handleExpenseBudgetPaste = (event: ClipboardEvent<HTMLInputElement>) => {
      const pasted = event.clipboardData?.getData('text') || '';
      const sanitized = sanitizeExpenseBudget(pasted);

      if (!sanitized) {
        event.preventDefault();
      }
    };

    const addExpensePayment = () => {
      const nextIndex = expensePayments.length + 1;
      const today = new Date().toISOString().slice(0, 10);

      setExpensePayments((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          title: `Payment #${nextIndex}`,
          date: today,
          isOpen: true,
          description: '',
          amount: '',
          note: '',
        },
      ]);
    };

    const updateExpensePayment = (id: string, updates: Partial<(typeof expensePayments)[number]>) => {
      setExpensePayments((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
    };

    const removeExpensePayment = (id: string) => {
      setExpensePayments((prev) => prev.filter((item) => item.id !== id));
    };

    const buildExpensePaymentsPayload = () =>
      expensePayments
        .filter((payment) => payment.description.trim() || payment.amount.trim())
        .map((payment) => ({
          description: payment.description.trim(),
          amount: Number(payment.amount.replace(/,/g, '')) || 0,
          note: payment.note.trim() || undefined,
          paidAt: payment.date,
        }));

    const handleSortExpenseColumn = (direction: 'asc' | 'desc') => {
      if (!expenseColumnMenu) {
        return;
      }

      setExpenseSort({
        columnId: expenseColumnMenu.columnId as 'name' | 'budget' | 'actual' | 'note',
        direction,
      });
      setExpenseColumnMenu(null);
    };

    const handleHideExpenseColumn = () => {
      if (!expenseColumnMenu) {
        return;
      }

      setHiddenExpenseColumns((prev) => {
        const next = new Set(prev);
        next.add(expenseColumnMenu.columnId as 'name' | 'budget' | 'actual' | 'note');
        return next;
      });
      setExpenseColumnMenu(null);
    };

    const handleEditExpenseRow = (row: typeof expenseRows[number]) => {
      setEditingExpenseId(row.id);
      setExpenseName(row.name);
      setExpenseBudget(String(row.budget || ''));
      setExpenseNote(row.note === '-' ? '' : row.note);
      setExpensePayments(row.payments || []);
      setIsExpenseModalOpen(true);
    };

    const handleDeleteExpenseRow = async (id: string) => {
      const confirmed = window.confirm('តើអ្នកចង់លុបចំណាយនេះមែនទេ?');
      if (!confirmed) return;

      try {
        await apiClient.deleteExpense(id);
        setExpenseRows((prev) => prev.filter((row) => row.id !== id));
        setSelectedExpenseRowIds((prev) => prev.filter((rowId) => rowId !== id));
        setError('');
      } catch (deleteError) {
        setSuccess('');
        setError(extractApiErrorMessage(deleteError) || 'មិនអាចលុបចំណាយបានទេ');
      }
    };

    const handleDeleteSelectedExpenseRows = async () => {
      const targetIds = selectedExpenseRowIds.length > 0 ? selectedExpenseRowIds : expenseRows.map((row) => row.id);
      if (targetIds.length === 0) {
        setError('មិនមានទិន្នន័យសម្រាប់លុបទេ');
        setSuccess('');
        return;
      }

      const confirmed =
        selectedExpenseRowIds.length > 0
          ? window.confirm(`តើអ្នកចង់លុបចំណាយចំនួន ${targetIds.length} មែនទេ?`)
          : window.confirm('មិនបានជ្រើសចំណាយ។ តើអ្នកចង់លុបទាំងអស់មែនទេ?');
      if (!confirmed) return;

      try {
        const results = await Promise.allSettled(targetIds.map((id) => apiClient.deleteExpense(id)));
        const deletedIds = targetIds.filter((_, index) => results[index]?.status === 'fulfilled');
        const failedCount = targetIds.length - deletedIds.length;

        if (deletedIds.length > 0) {
          setExpenseRows((prev) => prev.filter((row) => !deletedIds.includes(row.id)));
          setSelectedExpenseRowIds((prev) => prev.filter((id) => !deletedIds.includes(id)));
          setSuccess('បានលុបទិន្នន័យចំណាយរួចរាល់');
          setError('');
        }

        if (failedCount > 0) {
          setSuccess('');
          setError('មិនអាចលុបទិន្នន័យចំណាយមួយចំនួនបានទេ');
        }
      } catch {
        setSuccess('');
        setError('មិនអាចលុបទិន្នន័យចំណាយមួយចំនួនបានទេ');
      }
    };

    const openMenu = (columnId: string, target: HTMLElement) => {
      const rect = target.getBoundingClientRect();
      setExpenseColumnMenu({ columnId, anchorRect: rect });
    };

    const handleExportExpenseRows = async () => {
      if (expenseRows.length === 0) {
        setError('មិនមានទិន្នន័យសម្រាប់ទាញយកទេ');
        setSuccess('');
        return;
      }

      setError('');
      setSuccess('កំពុងរៀបចំឯកសារ Excel...');

      let rowIndex = 1;
      const exportRows = expenseRows.flatMap((expense) => {
        const payments = expense.payments?.length
          ? expense.payments
          : [{ title: '', date: '', amount: '', note: '', description: '' }];

        return payments.map((payment) => ({
          'No.': rowIndex++,
          'Expense ID': expense.id,
          'Expense Name': expense.name,
          Description: expense.note || '',
          'Budget Amount': expense.budget,
          'Actual Amount': expense.actual,
          'Payment Name': payment.title || payment.description || '',
          'Payment Amount': payment.amount || '',
          'Paid At': payment.date || '',
          'Payment Note': payment.note || '',
          'Created Date': expense.createdAt || '',
          'Updated Date': expense.updatedAt || '',
        }));
      });

      try {
        const XLSX = await import('xlsx');
        const worksheet = XLSX.utils.json_to_sheet(exportRows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses');
        const stamp = new Date().toISOString().slice(0, 10);
        const safeEventName = (event?.title || 'event').replace(/[\\/:*?"<>|]/g, '-');
        XLSX.writeFile(workbook, `${safeEventName}_Expenses_${stamp}.xlsx`);

        setSuccess('ទាញយកបានជោគជ័យ!');
      } catch {
        setSuccess('');
        setError('មិនអាចទាញយកឯកសារ Excel បានទេ');
      }
    };

    return (
      <section className="space-y-4 rounded-2xl bg-gray-50 p-4 font-khmer-body">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-khmer-heading text-2xl text-gray-900">ការគ្រប់គ្រងការចំណាយ</h2>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                className="h-10 bg-[#C52133] px-4 text-white hover:bg-[#aa1b2a]"
                onClick={() => setIsExpenseModalOpen(true)}
              >
                <Plus className="mr-1 h-4 w-4" />
                បន្ថែមថ្មី
              </Button>
              <button
                type="button"
                className="inline-flex h-10 items-center rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  resetExpenseImportState();
                  setIsExpenseImportOpen(true);
                }}
              >
                <Upload className="mr-1 h-4 w-4" />
                បញ្ចូល Excel
              </button>
              <button
                type="button"
                className="inline-flex h-10 items-center rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 hover:bg-gray-50"
                onClick={handleExportExpenseRows}
              >
                <Download className="mr-1 h-4 w-4" />
                ទាញយក
              </button>
              <button
                type="button"
                className="inline-flex h-10 items-center rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 hover:bg-gray-50"
                onClick={handleDeleteSelectedExpenseRows}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                លុប
              </button>
            </div>
          </div>

          <div className="mb-4">
            <div className="relative max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={expenseSearch}
                onChange={(event) => setExpenseSearch(event.target.value)}
                placeholder="ស្វែងរក ..."
                className="h-11 rounded-full border-gray-200 pl-10"
              />
            </div>
          </div>

          <div className="overflow-x-auto w-full max-w-full px-2 rounded-xl border border-gray-100 bg-white">
            <table className="min-w-full table-auto text-sm whitespace-nowrap">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-12 px-5 py-3 text-left whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={allExpenseRowsSelected}
                      onChange={(event) => {
                        if (event.target.checked) {
                          setSelectedExpenseRowIds(sortedExpenseRows.map((row) => row.id));
                        } else {
                          setSelectedExpenseRowIds([]);
                        }
                      }}
                    />
                  </th>
                  {visibleColumns.name && (
                    <th className="px-5 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(event) => openMenu('name', event.currentTarget)}
                        className="inline-flex items-center gap-2"
                      >
                        ឈ្មោះ
                        <ArrowUpDown className="h-4 w-4 text-gray-500" />
                      </button>
                    </th>
                  )}
                  {visibleColumns.budget && (
                    <th className="px-5 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(event) => openMenu('budget', event.currentTarget)}
                        className="inline-flex items-center gap-2"
                      >
                        គ្រោងចំណាយ
                        <ArrowUpDown className="h-4 w-4 text-gray-500" />
                      </button>
                    </th>
                  )}
                  {visibleColumns.actual && (
                    <th className="px-5 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(event) => openMenu('actual', event.currentTarget)}
                        className="inline-flex items-center gap-2"
                      >
                        ចំណាយជាក់ស្តែង
                        <ArrowUpDown className="h-4 w-4 text-gray-500" />
                      </button>
                    </th>
                  )}
                  {visibleColumns.note && (
                    <th className="px-5 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(event) => openMenu('note', event.currentTarget)}
                        className="inline-flex items-center gap-2"
                      >
                        ការពិពណ៌នា
                        <ArrowUpDown className="h-4 w-4 text-gray-500" />
                      </button>
                    </th>
                  )}
                  <th className="px-5 py-3 text-right font-semibold text-gray-700 whitespace-nowrap">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {sortedExpenseRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={
                        2 +
                        (visibleColumns.name ? 1 : 0) +
                        (visibleColumns.budget ? 1 : 0) +
                        (visibleColumns.actual ? 1 : 0) +
                        (visibleColumns.note ? 1 : 0)
                      }
                      className="px-5 py-14 text-center text-gray-500 whitespace-nowrap"
                    >
                      មិនមានទិន្នន័យ។
                    </td>
                  </tr>
                ) : (
                  sortedExpenseRows.map((row) => {
                    const budgetValue = Number(row.budget || 0);
                    const actualValue = Number(row.actual || 0);
                    const rawPercent = budgetValue > 0 ? (actualValue / budgetValue) * 100 : 0;
                    const percent = Math.min(100, Math.max(0, Math.round(rawPercent)));

                    return (
                      <tr key={row.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedExpenseRowIds.includes(row.id)}
                            onChange={(event) => {
                              if (event.target.checked) {
                                setSelectedExpenseRowIds((prev) => Array.from(new Set([...prev, row.id])));
                              } else {
                                setSelectedExpenseRowIds((prev) => prev.filter((id) => id !== row.id));
                              }
                            }}
                          />
                        </td>
                        {visibleColumns.name && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm text-[#7A1F2B] whitespace-nowrap">
                              {row.name}
                            </div>
                          </td>
                        )}
                        {visibleColumns.budget && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                              ${formatCurrency(budgetValue)}
                            </div>
                          </td>
                        )}
                        {visibleColumns.actual && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                              <div className="flex items-center justify-between text-xs text-gray-500 whitespace-nowrap">
                                <span>${formatCurrency(actualValue)}</span>
                                <span>${formatCurrency(budgetValue)}</span>
                              </div>
                              <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
                                <div
                                  className="h-2 rounded-full bg-[#C52133]"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                              <div className="mt-2 flex justify-end text-xs text-gray-500 whitespace-nowrap">{percent}%</div>
                            </div>
                          </td>
                        )}
                        {visibleColumns.note && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                              {row.note}
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditExpenseRow(row)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteExpenseRow(row.id)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-[#C52133] hover:bg-rose-100"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-col gap-3 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
            <p>សរុប: {totalRecords} កំណត់ត្រា</p>
            <div className="flex flex-wrap items-center gap-2">
              <span>ទិន្នន័យក្នុងមួយទំព័រ</span>
              <select className="h-8 rounded-md border border-gray-200 bg-white px-2">
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="ml-2">ទំព័រ 1 នៃ {totalPages}</span>
              <button
                type="button"
                className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                disabled
              >
                ទៅទំព័រដំបូង
              </button>
              <button
                type="button"
                className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                disabled
              >
                ទៅទំព័រមុន
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen && expenseColumnMenu &&
          createPortal(
            <div
              ref={expenseMenuRef}
              className="fixed z-[120] w-56 rounded-2xl border border-gray-100 bg-white shadow-sm"
              style={{
                top: expenseColumnMenu.anchorRect.bottom + 8,
                left: expenseColumnMenu.anchorRect.left,
              }}
            >
              <button
                type="button"
                onClick={() => handleSortExpenseColumn('asc')}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50"
              >
                <ArrowUp className="h-4 w-4 text-gray-500" />
                តូចទៅធំ
              </button>
              <button
                type="button"
                onClick={() => handleSortExpenseColumn('desc')}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50"
              >
                <ArrowDown className="h-4 w-4 text-gray-500" />
                ធំទៅតូច
              </button>
              <div className="mx-4 border-t border-gray-200" />
              <button
                type="button"
                onClick={handleHideExpenseColumn}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50"
              >
                <EyeOff className="h-4 w-4 text-gray-500" />
                លាក់
              </button>
            </div>,
            document.body,
          )}

        <AnimatePresence>
          {isExpenseImportOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
              onClick={() => setIsExpenseImportOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.2 }}
                onClick={(event) => event.stopPropagation()}
                className="flex w-full max-w-3xl max-h-[85vh] flex-col rounded-[32px] bg-white p-7 shadow-2xl font-khmer-body"
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-moul text-2xl text-gray-900">បញ្ចូលបញ្ជី</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      ផ្ទុកឡើងឯកសារ Excel ដើម្បីនាំចូលចំណាយ។ ទាញយកគំរូសម្រាប់ទម្រង់ត្រឹមត្រូវ។
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsExpenseImportOpen(false)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="rounded-2xl bg-blue-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-blue-600">
                        <FileText className="h-5 w-5" />
                      </span>
                      <p className="text-sm font-semibold text-gray-700">ត្រូវការគំរូ Excel?</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadExpenseSample}
                      className="inline-flex items-center gap-2 rounded-full border border-[#E38E98] bg-white px-4 py-2 text-sm font-semibold text-[#C52133] hover:bg-rose-50"
                    >
                      <Download className="h-4 w-4" />
                      ទាញយក
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => expenseImportInputRef.current?.click()}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const file = event.dataTransfer.files?.[0];
                    if (file) {
                      handleExpenseImportFile(file);
                    }
                  }}
                  className="mt-5 flex w-full flex-col items-center justify-center gap-3 rounded-[32px] border border-dashed border-gray-200 bg-white px-6 py-10 text-center"
                >
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-[#C52133]">
                    <Upload className="h-7 w-7" />
                  </span>
                  <p className="text-base font-semibold text-gray-900">ទម្លាក់ឯកសារ Excel របស់អ្នកនៅទីនេះ</p>
                  <p className="text-sm text-gray-500">ឬចុចដើម្បីរុករកមើល (.xlsx, .xls)</p>
                  {expenseImportFileName && (
                    <p className="text-sm font-medium text-gray-600">{expenseImportFileName}</p>
                  )}
                </button>

                <input
                  ref={expenseImportInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) {
                      return;
                    }

                    handleExpenseImportFile(file);
                  }}
                />

                {expenseImportError && (
                  <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {expenseImportError}
                  </div>
                )}

                <div className="mt-5 flex-1 overflow-y-auto rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  {isParsingExpenseFile ? (
                    <p className="text-sm text-gray-500">កំពុងអានឯកសារ...</p>
                  ) : expenseImportPreview.length === 0 ? (
                    <p className="text-sm text-gray-500">មិនទាន់មានទិន្នន័យសម្រាប់ពិនិត្យ។</p>
                  ) : (
                    <div className="space-y-4">
                      {expenseImportPreview.map((expense) => (
                        <div key={expense.name} className="rounded-2xl border border-gray-100 bg-white p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{expense.name}</p>
                              <p className="text-xs text-gray-500">គ្រោងចំណាយ: ${expense.budget.toFixed(2)}</p>
                            </div>
                            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                              {expense.payments.length} ការបង់ប្រាក់
                            </span>
                          </div>
                          {expense.note && <p className="mt-2 text-xs text-gray-500">{expense.note}</p>}
                          <div className="mt-3 space-y-2">
                            {expense.payments.map((payment, index) => (
                              <div key={`${expense.name}-${index}`} className="rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-600">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="font-semibold text-gray-700">{payment.title}</span>
                                  <span>{payment.date || '-'}</span>
                                </div>
                                <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                                  <span>${payment.amount.toFixed(2)}</span>
                                  <span>{payment.note || '-'}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsExpenseImportOpen(false)}
                    className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-100 px-5 py-2 text-sm text-gray-700 hover:bg-gray-200"
                  >
                    <X className="h-4 w-4" />
                    បោះបង់
                  </button>
                  <button
                    type="button"
                    onClick={handleImportExpenses}
                    disabled={isImportingExpenses || expenseImportPreview.length === 0 || isParsingExpenseFile}
                    className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm text-white transition-colors ${
                      !isImportingExpenses && expenseImportPreview.length > 0 && !isParsingExpenseFile
                        ? 'bg-[#E38E98] hover:bg-[#d87984]'
                        : 'cursor-not-allowed bg-gray-300 text-gray-500'
                    }`}
                  >
                    <ArrowUp className="h-4 w-4" />
                    {isImportingExpenses ? 'កំពុងនាំចូល...' : 'បញ្ចូល'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isExpenseModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
              onClick={() => setIsExpenseModalOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.2 }}
                onClick={(event) => event.stopPropagation()}
                className="flex w-full max-w-2xl max-h-[85vh] flex-col rounded-[32px] bg-white p-7 shadow-2xl font-khmer-body"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h3 className="font-khmer-heading text-2xl text-gray-900">
                      {editingExpenseId ? 'កែសម្រួលចំណាយ' : 'បន្ថែមចំណាយថ្មី'}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">បំពេញព័ត៌មានចំណាយខាងក្រោម</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsExpenseModalOpen(false)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form
                  onSubmit={async (event) => {
                    event.preventDefault();
                    if (!isExpenseFormReady) {
                      return;
                    }
                    const budgetValue = Number(expenseBudget.replace(/,/g, '')) || 0;
                    const paymentsPayload = buildExpensePaymentsPayload();

                    try {
                      if (editingExpenseId) {
                        const updated = await apiClient.updateExpense(editingExpenseId, {
                          name: expenseName.trim(),
                          budget: budgetValue,
                          note: expenseNote.trim() || '-',
                          payments: paymentsPayload,
                        });
                        const mapped = mapExpenseToRow(updated);
                        setExpenseRows((prev) => prev.map((row) => (row.id === editingExpenseId ? mapped : row)));
                        setSuccess('បានកែប្រែចំណាយរួចរាល់');
                      } else {
                        const confirmed = window.confirm('តើអ្នកចង់បង្កើតចំណាយថ្មីមែនទេ?');
                        if (!confirmed) return;

                        const created = await apiClient.createExpense(eventId, {
                          name: expenseName.trim(),
                          budget: budgetValue,
                          note: expenseNote.trim() || '-',
                          payments: paymentsPayload,
                        });
                        const mapped = mapExpenseToRow(created);
                        setExpenseRows((prev) => [mapped, ...prev]);
                        setSuccess('បានបន្ថែមចំណាយថ្មីរួចរាល់');
                      }

                      setError('');
                      setExpenseName('');
                      setExpenseBudget('');
                      setExpenseNote('');
                      setExpensePayments([]);
                      setEditingExpenseId(null);
                      setIsExpenseModalOpen(false);
                    } catch (saveError) {
                      setSuccess('');
                      setError(extractApiErrorMessage(saveError) || 'មិនអាចរក្សាទុកចំណាយបានទេ');
                    }
                  }}
                  className="flex-1 space-y-4 overflow-y-auto pr-1"
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-sm text-gray-700">
                        ឈ្មោះ<RequiredStar />
                      </label>
                      <Input
                        value={expenseName}
                        onChange={(event) => setExpenseName(event.target.value)}
                        placeholder="បញ្ចូលឈ្មោះ"
                        className="h-11 rounded-xl border-gray-200"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm text-gray-700">
                        គ្រោងចំណាយ <RequiredStar />
                      </label>
                      <div className="flex h-12 items-center rounded-xl border border-gray-200 bg-white px-3">
                        <span className="mr-2 text-lg font-semibold text-sky-500">$</span>
                        <input
                          value={expenseBudget}
                          onChange={(event) => handleExpenseBudgetChange(event.target.value)}
                          onKeyDown={handleExpenseBudgetKeyDown}
                          onPaste={handleExpenseBudgetPaste}
                          className="w-full border-0 bg-transparent text-lg text-sky-600 outline-none placeholder:text-sky-400"
                          inputMode="decimal"
                          placeholder="បញ្ចូលចំនួន"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-sm text-gray-500">កំណត់ចំណាំ (មិនចាំបាច់)</label>
                      <textarea
                        value={expenseNote}
                        onChange={(event) => setExpenseNote(event.target.value)}
                        rows={3}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-300"
                        placeholder="បញ្ចូលកំណត់ចំណាំ"
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-700">ការបង់ប្រាក់</p>
                      <button
                        type="button"
                        onClick={addExpensePayment}
                        className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        បន្ថែមការបង់ប្រាក់
                      </button>
                    </div>
                    {expensePayments.length === 0 ? (
                      <div className="mt-3 flex min-h-[120px] items-center justify-center rounded-2xl border border-gray-200 bg-white px-6 text-center text-sm text-gray-500">
                        មិនទាន់មានការបង់ប្រាក់។ ចុច 'បន្ថែមការបង់ប្រាក់' ដើម្បីចាប់ផ្តើម។
                      </div>
                    ) : (
                      <div className="mt-3 space-y-3">
                        {expensePayments.map((payment, index) => {
                          const isDescriptionEmpty = !payment.description.trim();
                          const isAmountEmpty = !payment.amount.trim();

                          return (
                            <div key={payment.id} className="rounded-2xl border border-gray-200 bg-white">
                              <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() => updateExpensePayment(payment.id, { isOpen: !payment.isOpen })}
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500"
                                  >
                                    {payment.isOpen ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )}
                                  </button>
                                  <div>
                                    <p className="text-sm font-semibold text-gray-800">
                                      {payment.description.trim() || `Payment #${index + 1}`}
                                    </p>
                                    <p className="text-xs text-gray-500">{payment.date}</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeExpensePayment(payment.id)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>

                              {payment.isOpen && (
                                <div className="space-y-4 px-4 py-4">
                                  <div className="space-y-1.5">
                                    <label className="text-sm text-gray-700">
                                      ការបង់ប្រាក់សម្រាប់<RequiredStar />
                                    </label>
                                    <Input
                                      value={payment.description}
                                      onChange={(event) =>
                                        updateExpensePayment(payment.id, { description: event.target.value })
                                      }
                                      placeholder="បញ្ចូលព័ត៌មានបរិយាយការបង់ប្រាក់"
                                      className={`h-11 rounded-xl ${
                                        isDescriptionEmpty ? 'border-red-400 focus-visible:border-red-500' : 'border-gray-200'
                                      }`}
                                    />
                                  </div>

                                  <div className="space-y-1.5">
                                    <label className="text-sm text-gray-700">
                                      ចំនួនប្រាក់<RequiredStar />
                                    </label>
                                    <div
                                      className={`flex h-12 items-center rounded-xl border px-3 ${
                                        isAmountEmpty ? 'border-red-400' : 'border-gray-200'
                                      }`}
                                    >
                                      <span className="mr-2 text-lg font-semibold text-sky-500">$</span>
                                      <input
                                        value={payment.amount}
                                        onChange={(event) =>
                                          updateExpensePayment(payment.id, {
                                            amount: sanitizeExpenseBudget(event.target.value),
                                          })
                                        }
                                        onKeyDown={handleExpenseBudgetKeyDown}
                                        onPaste={handleExpenseBudgetPaste}
                                        className="w-full border-0 bg-transparent text-lg text-sky-600 outline-none placeholder:text-sky-400"
                                        inputMode="decimal"
                                        placeholder="0"
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-1.5">
                                    <label className="text-sm text-gray-500">កំណត់ចំណាំ (មិនចាំបាច់)</label>
                                    <textarea
                                      value={payment.note}
                                      onChange={(event) => updateExpensePayment(payment.id, { note: event.target.value })}
                                      rows={3}
                                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-300"
                                      placeholder="កំណត់ចំណាំការបង់ប្រាក់ (ប្រសិនបើមាន)"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        <div className="flex justify-end text-sm font-medium text-gray-700">
                          ចំនួនការបង់ប្រាក់សរុប: ${formatPaymentTotal(paymentTotal)}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsExpenseModalOpen(false)}
                      className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-100 px-5 py-2 text-sm text-gray-700 hover:bg-gray-200"
                    >
                      <X className="h-4 w-4" />
                      បោះបង់
                    </button>
                    <button
                      type="submit"
                      disabled={!isExpenseFormReady}
                      className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm text-white transition-colors ${
                        isExpenseFormReady
                          ? 'bg-[#C52133] hover:bg-[#aa1b2a]'
                          : 'cursor-not-allowed bg-gray-300 text-gray-500'
                      }`}
                    >
                      <Check className="h-4 w-4" />
                      {editingExpenseId ? 'រក្សាទុកការផ្លាស់ប្ដូរ' : 'បង្កើតថ្មី'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralTab();
      case 'guests':
        return renderGuestsTab();
      case 'gifts':
        return renderGiftsTab();
      case 'expenses':
        return renderExpensesTab();
      case 'edit':
        return renderEditTab();
      case 'schedule':
        return renderScheduleTab();
      case 'my-template':
        return renderMyTemplateTab();
      case 'template-shop':
        return renderTemplateShopTab();
      case 'qr':
        return renderQrTab();
      default:
        return renderGeneralTab();
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center font-khmer-body">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-red-600" />
          <p className="mt-4 text-gray-600">កំពុងទាញយកទិន្នន័យ...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center font-khmer-body">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">រកមិនឃើញព្រឹត្តិការណ៍</h1>
          <Link href="/dashboard" className="mt-4 inline-block text-red-600">
            ត្រឡប់ទៅផ្ទាំងគ្រប់គ្រង
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-khmer-body">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <Link href="/dashboard">
            <Button variant="outline" className="mb-4 border-gray-200">
              <ArrowLeft className="mr-2 h-4 w-4" />
              ត្រឡប់
            </Button>
          </Link>

          <div className="flex items-start justify-between gap-4">
            <h1 className="font-khmer-heading text-2xl font-bold text-gray-900 sm:text-3xl">
              {event.title}
            </h1>
            <Link
              href={externalPreviewPath}
              target="_blank"
              className="rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
              aria-label="View public invitation"
            >
              <ExternalLink className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 overflow-x-auto">
          <nav className="flex min-w-max items-center gap-6 border-b border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setError('');
                    setSuccess('');
                    setActiveTab(tab.id);
                  }}
                  className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 pb-3 text-sm font-medium ${
                    isActive
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        {success && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{success}</div>
        )}

        {renderTabContent()}
      </main>
    </div>
  );
}

export default withProtectedRoute(EventDetailPage);
