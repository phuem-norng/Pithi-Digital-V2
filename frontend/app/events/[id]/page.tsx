'use client';

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type ComponentType,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import { Assets, getSeededCoverImage, getSeededGalleryImages } from '@/lib/assets';
import { createPortal } from 'react-dom';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion';
import {
  AlertCircle,
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
  TrendingDown,
  TrendingUp,
  Upload,
  User,
  Users,
  MoreVertical,
  X,
  DollarSign,
  EyeOff,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCard } from '@/components/ui/message-card';
import { SupportContactFab } from '@/components/support-contact-fab';
import { InvitationBuilder } from '@/components/invitation-builder';
import ImageCover from '@/components/invitation-builder/sections/ImageCover';
import { DashboardLanguageThemeControls } from '@/components/dashboard-language-theme-controls';
import type { BuilderState } from '@/components/invitation-builder/types';
import { apiClient } from '@/lib/api-client';
import type { Event, EventStats, EventType as ApiEventType, Expense, Gift, Guest, Template } from '@/lib/api-client';
import { EVENT_CATEGORY_BY_KEY, EVENT_CATEGORY_OPTIONS, EventFlowType } from '@/lib/event-categories';
import { getSavedMyTemplates, MyTemplateItem, removeMyTemplate, saveMyTemplate, syncMyTemplatesForEvent } from '@/lib/my-templates';
import { withProtectedRoute } from '@/lib/protected-route';
import {
  getBuilderCoverFromMyTemplateSnapshots,
  getEventTemplateCatalogImage,
  getTemplateCatalogImage,
} from '@/lib/template-images';
import { getTemplateStyleDefaults } from '@/lib/template-style';
import { useLanguage } from '@/lib/language-context';
import {
  getEditEventTypeLabel,
  getEventDetailPageStrings,
  getGuestGroupLabel,
  getGuestTagLabel,
} from '@/lib/event-detail-page-i18n';
import { formatUsdCurrency, USD_KHR_EXCHANGE_RATE } from '@/lib/gift-exchange';

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

const WEDDING_PROGRAM_TYPE_OPTIONS = [
  { value: 'ភ្ជាប់ពាក្យ', km: 'ភ្ជាប់ពាក្យ', en: 'Engagement' },
  { value: 'មង្គលការ', km: 'មង្គលការ', en: 'Wedding ceremony' },
  { value: 'កាត់ចំណងដៃ', km: 'កាត់ចំណងដៃ', en: 'Gift-cutting ceremony' },
  { value: 'ពិសារស្លាដក់កន្សែង', km: 'ពិសារស្លាដក់កន្សែង', en: 'Traditional blessing meal' },
  { value: 'OTHERS', km: 'ផ្សេងៗ', en: 'Others' },
] as const;
type WeddingProgramType = (typeof WEDDING_PROGRAM_TYPE_OPTIONS)[number]['value'];

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

type ConfirmDialogState = {
  isOpen: boolean;
  message: string;
  resolve?: (value: boolean) => void;
};

function EventDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const eventId = params.id as string;

  const { language } = useLanguage();
  const isKhmer = language === 'km';
  const S = useMemo(() => getEventDetailPageStrings(isKhmer), [isKhmer]);

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
  const [editWeddingProgramType, setEditWeddingProgramType] = useState<WeddingProgramType>('មង្គលការ');
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
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    message: '',
  });
  const [accessToken, setAccessToken] = useState('');
  const [previewingTemplateId, setPreviewingTemplateId] = useState<string | null>(null);
  const [activatingMyTemplateId, setActivatingMyTemplateId] = useState<string | null>(null);
  const [guestGreetingPreview, setGuestGreetingPreview] = useState<string | null>(null);
  const [guestNotePreview, setGuestNotePreview] = useState<string | null>(null);
  const [expenseDescriptionPreview, setExpenseDescriptionPreview] = useState<string | null>(null);
  const feedbackRef = useRef<HTMLDivElement | null>(null);
  const [isTabNavHovered, setIsTabNavHovered] = useState(false);
  const isEditFormInitialized = useRef(false);
  const hasShownTemplateToast = useRef(false);
  const tabNavGlowX = useMotionValue(-140);
  const tabNavGlowY = useMotionValue(-120);
  const tabNavGlowSmoothX = useSpring(tabNavGlowX, { stiffness: 260, damping: 28, mass: 0.55 });
  const tabNavGlowSmoothY = useSpring(tabNavGlowY, { stiffness: 260, damping: 28, mass: 0.55 });

  useEffect(() => {
    if (!error && !success) {
      return;
    }
    feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [error, success]);

  const updateEventPageQuery = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    const query = params.toString();
    router.replace(query ? `?${query}` : '?', { scroll: false });
  };

  const weddingPrefix = 'ពិធីរៀបមង្គលការ';

  const createAgendaId = () => `agenda-${Math.random().toString(36).slice(2, 9)}`;
  const createAgendaItemId = () => `agenda-item-${Math.random().toString(36).slice(2, 9)}`;
  const handleTabNavMouseMove = (event: MouseEvent<HTMLElement>) => {
    const navRect = event.currentTarget.getBoundingClientRect();
    tabNavGlowX.set(event.clientX - navRect.left - 120);
    tabNavGlowY.set(event.clientY - navRect.top - 120);
  };

  const getNextAgendaTitle = (sections: typeof agendaSections) => {
    if (isKhmer) {
      const titlePattern = /របៀបវារៈទី\s*(\d+)/;
      const maxNumber = sections.reduce((maxValue, section) => {
        const match = titlePattern.exec(section.title);
        const value = match ? Number(match[1]) : 0;
        return Number.isFinite(value) && value > maxValue ? value : maxValue;
      }, 0);
      const nextNumber = maxNumber > 0 ? maxNumber + 1 : sections.length + 1;
      return `របៀបវារៈទី${nextNumber}`;
    }
    const titlePattern = /Agenda\s*(\d+)/i;
    const maxNumber = sections.reduce((maxValue, section) => {
      const match = titlePattern.exec(section.title);
      const value = match ? Number(match[1]) : 0;
      return Number.isFinite(value) && value > maxValue ? value : maxValue;
    }, 0);
    const nextNumber = maxNumber > 0 ? maxNumber + 1 : sections.length + 1;
    return `Agenda ${nextNumber}`;
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
        setExpenseImportError(S.notices.importNoData);
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
        setExpenseImportError(S.notices.importExcelNoRows);
      }
      setExpenseImportPreview(preview);
    } catch {
      setExpenseImportError(S.notices.importExcelReadFail);
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
      setError(S.notices.loadTemplateFail2);
      setSuccess('');
    }
  };

  const handleImportExpenses = async () => {
    if (expenseImportPreview.length === 0) {
      setExpenseImportError(S.notices.importEmptyPreview);
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
      setSuccess(S.notices.importOk);
      setError('');
      resetExpenseImportState();
      setIsExpenseImportOpen(false);
    } catch (importError) {
      setExpenseImportError(extractApiErrorMessage(importError) || S.notices.importFail);
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
    return () => {
      if (confirmDialog.resolve) {
        confirmDialog.resolve(false);
      }
    };
  }, [confirmDialog]);

  useEffect(() => {
    if (!expenseColumnMenu) {
      return;
    }

    const handleOutsideClick = (event: globalThis.MouseEvent) => {
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
      setSuccess(S.notices.templatePicked);
      setError('');
      hasShownTemplateToast.current = true;
      return;
    }

    if (templateApplied === '0') {
      setError(message || S.notices.templatePickFail);
      setSuccess('');
      hasShownTemplateToast.current = true;
    }
  }, [searchParams, isKhmer]);

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
    if (activeTab !== 'guests') {
      return;
    }
    const currentTab = searchParams.get('tab') || '';
    const currentPage = searchParams.get('page') || '';
    const nextPage = String(guestPage);
    if (currentTab === 'guests' && currentPage === nextPage) {
      return;
    }
    updateEventPageQuery({ tab: 'guests', page: nextPage });
  }, [activeTab, guestPage, searchParams]);

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
    const handleOutsideClick = (event: globalThis.MouseEvent) => {
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
            extractApiErrorMessage(giftsLoadError) || S.notices.loadGiftsFail,
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
            extractApiErrorMessage(expenseLoadError) || S.notices.loadExpensesFail,
          );
        }
      } catch (loadError) {
        console.error('Failed to load event:', loadError);
        setSuccess('');
        setError(
          extractApiErrorMessage(loadError) || S.notices.loadEventFail,
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
        setTemplateError(S.notices.loadTemplatesFail);
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
      setSuccess(S.notices.saveAgendaOk);
    } catch (saveError) {
      setSuccess('');
      setError(extractApiErrorMessage(saveError) || S.notices.saveAgendaFail);
    } finally {
      setIsSavingAgenda(false);
    }
  };

  useEffect(() => {
    if (!actionMenuGuestId) {
      return;
    }

    const handleOutsideClick = (event: globalThis.MouseEvent) => {
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
    const programType = getMetadataValue('programType');
    const isKnownWeddingProgramType =
      typeof programType === 'string' &&
      WEDDING_PROGRAM_TYPE_OPTIONS.some((item) => item.value === programType);
    setEditWeddingProgramType(
      isKnownWeddingProgramType
        ? (programType as WeddingProgramType)
        : 'មង្គលការ',
    );
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

  const activeMyTemplateId = useMemo(() => {
    if (!event?.metadata || typeof event.metadata !== 'object') {
      return '';
    }

    const metadata = event.metadata as Record<string, unknown>;
    return typeof metadata.activeMyTemplateId === 'string' ? metadata.activeMyTemplateId : '';
  }, [event?.metadata]);

  const activeMyTemplateForInvite = useMemo(() => {
    const eventScopedTemplates = myTemplates
      .filter((item) => item.eventId === eventId)
      .sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));

    if (!eventScopedTemplates.length) {
      return null;
    }

    if (activeMyTemplateId) {
      const bySavedId = eventScopedTemplates.find((item) => item.id === activeMyTemplateId);
      if (bySavedId) {
        return bySavedId;
      }
    }

    if (event?.templateId) {
      const matched = eventScopedTemplates.find((item) => item.templateId === event.templateId);
      if (matched) {
        return matched;
      }
    }

    return eventScopedTemplates[0];
  }, [myTemplates, eventId, event?.templateId, activeMyTemplateId]);

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

  const tabs: Array<{ id: TabId; label: string; icon: ComponentType<{ className?: string }> }> = useMemo(
    () => [
      { id: 'general', label: S.tabs.general, icon: Info },
      { id: 'guests', label: S.tabs.guests, icon: Users },
      { id: 'gifts', label: S.tabs.gifts, icon: Mail },
      { id: 'expenses', label: S.tabs.expenses, icon: DollarSign },
      { id: 'edit', label: S.tabs.edit, icon: Pencil },
      { id: 'schedule', label: S.tabs.schedule, icon: Clock3 },
      { id: 'my-template', label: S.tabs.myTemplate, icon: LayoutTemplate },
      { id: 'template-shop', label: S.tabs.templateShop, icon: Store },
    ],
    [S],
  );

  const refreshGuestsAndStats = async () => {
    const [statsData, guestsData] = await Promise.all([
      apiClient.getEventStats(eventId),
      apiClient.getEventGuests(eventId),
    ]);

    setStats(statsData);
    setGuests(guestsData);
  };

  const localizeApiError = (rawMessage: unknown, fallback: string) => {
    const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : String(rawMessage || '');

    if (message.toLowerCase().includes('guest name already exists')) {
      return S.guests.guestNameExists;
    }

    return message || fallback;
  };

  const requestConfirmation = (message: string) =>
    new Promise<boolean>((resolve) => {
      setConfirmDialog({
        isOpen: true,
        message,
        resolve,
      });
    });

  const makeInvitationLink = (guestId: string, guestName: string, guestEventId?: string) => {
    if (typeof window === 'undefined') return '';

    const encodedGuestName = encodeURIComponent(guestName || S.guests.defaultGuestName);

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
    setShareGuestName(guest.name || S.guests.defaultGuest);

    try {
      await ensureActiveTemplateSnapshotSynced();
    } catch {
      // Keep link generation working even if background sync fails.
    }

    setShareLink(makeInvitationLink(guest.id, guest.name || S.guests.defaultGuestName, guest.eventId));
    setShareNotice('');
  };

  const handleCopyInvitation = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setShareNotice(S.guests.copiedToClipboard);
    } catch {
      setShareNotice('Copy failed');
    }
  };

  const handleDownloadInvitation = async () => {
    if (!shareLink || typeof window === 'undefined') return;

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=900x900&data=${encodeURIComponent(shareLink)}`;
    const guestName = shareGuestName || S.guests.defaultGuest;

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
      context.fillText(S.guests.linkTitle, 600, 110);

      context.fillStyle = '#C52133';
      context.font = '600 44px Kantumruy Pro, sans-serif';
      context.fillText(guestName, 600, 180);

      context.fillStyle = '#f3f4f6';
      context.fillRect(150, 230, 900, 900);
      context.drawImage(qrImage, 180, 260, 840, 840);

      context.fillStyle = '#6b7280';
      context.font = '400 22px Kantumruy Pro, sans-serif';
      context.fillText(S.guests.scanHint, 600, 1230);

      const pngUrl = canvas.toDataURL('image/png');
      const anchor = document.createElement('a');
      anchor.href = pngUrl;
      anchor.download = `invitation-qr-${guestName.replace(/\s+/g, '-')}.png`;
      anchor.click();
      setShareNotice(S.guests.shareQrDownloaded);
    } catch {
      setShareNotice(S.guests.shareDownloadFailed);
    }
  };

  const handleRefreshInvitationLink = async () => {
    if (!shareGuestId) return;

    try {
      await ensureActiveTemplateSnapshotSynced();
    } catch {
      // Keep link generation working even if background sync fails.
    }

    setShareLink(makeInvitationLink(shareGuestId, shareGuestName || S.guests.defaultGuestName, eventId));
    setShareNotice(S.guests.linkRefreshedNotice);
  };

  const openQrModal = async (guest: Guest & { group?: string; tag?: string; greetingMessage?: string; note?: string }) => {
    setQrGuestName(guest.name || S.guests.defaultGuest);

    try {
      await ensureActiveTemplateSnapshotSynced();
    } catch {
      // Keep link generation working even if background sync fails.
    }

    setQrLink(makeInvitationLink(guest.id, guest.name || S.guests.defaultGuestName, guest.eventId));
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
      context.fillText(S.guests.qrCodeLabel, 450, 80);

      context.fillStyle = '#ffffff';
      context.strokeStyle = '#f1f5f9';
      context.lineWidth = 2;
      context.fillRect(130, 120, 640, 640);
      context.strokeRect(130, 120, 640, 640);
      context.drawImage(qrImage, 145, 135, 610, 610);

      context.fillStyle = '#374151';
      context.font = '500 28px Kantumruy Pro, sans-serif';
      context.fillText(qrGuestName || S.guests.defaultGuest, 450, 840);

      context.fillStyle = '#6b7280';
      context.font = '400 20px Kantumruy Pro, sans-serif';
      context.fillText(S.guests.scanHint, 450, 890);

      const dataUrl = canvas.toDataURL('image/png');
      const anchor = document.createElement('a');
      anchor.href = dataUrl;
      anchor.download = `guest-qr-${(qrGuestName || 'guest').replace(/\s+/g, '-')}.png`;
      anchor.click();
    } catch {
      setError(S.notices.loadQrFail);
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
      setError(S.guests.errEnterName);
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
      setError(S.guests.errEditFail);
    }
  };

  const handleDeleteOneGuest = async (guestId: string) => {
    const confirmed = await requestConfirmation(S.guests.confirmDeleteOne);
    if (!confirmed) return;

    try {
      await apiClient.deleteGuest(guestId);
      await refreshGuestsAndStats();
      setSelectedGuestIds((prev) => prev.filter((id) => id !== guestId));
      setActionMenuGuestId(null);
    } catch {
      setError(S.guests.deleteFail);
    }
  };

  const handleAddGuest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const confirmed = await requestConfirmation(S.guests.confirmAddGuest);
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
      setSuccess(S.guests.addSuccess);
    } catch (submitError: any) {
      const message = submitError?.response?.data?.message;
      setError(localizeApiError(message, S.guests.addFail));
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
          throw new Error(S.edit.validationWeddingNames);
        }
        title = `ពិធីរៀបមង្គលការ ${editGroomName.trim()} និង ${editBrideName.trim()}`;
      } else if (editEventType === 'CEREMONY') {
        if (!editCeremonyName.trim() || !editWatName.trim() || !editMainCelebrant.trim()) {
          throw new Error(S.edit.validationCeremony);
        }
        title = editCeremonyName.trim();
      } else if (editEventType === 'FUNERAL') {
        if (!editDeceasedName.trim() || !editDeceasedAge.trim() || !editReligiousRites.trim()) {
          throw new Error(S.edit.validationFuneral);
        }
        title = `បុណ្យសព ${editDeceasedName.trim()}`;
      } else {
        if (!editHostName.trim() || !editEventTitle.trim()) {
          throw new Error(S.edit.validationHost);
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
          category: EVENT_CATEGORY_BY_KEY[editCategoryKey]?.subtitle || S.edit.defaultEventCategory,
          categoryKey: editCategoryKey,
          programType: editEventType === 'WEDDING' ? editWeddingProgramType : undefined,
          visibility,
          preventDuplicateGuestNames,
          eventEndDate: editEndDate || editDate,
        },
        eventTypeId: selectedEventTypeId || undefined,
      });

      syncMyTemplatesForEvent(event.id, [previousTemplateId, updated.templateId], {
        eventTitle: title,
        eventDate: editDate,
        eventEndDate: editEndDate || editDate,
        eventLocation: editAddress,
        mapUrl: editGoogleMapLink || '',
        khqrUsdUrl: khqrDollar || '',
        khqrKhrUrl: khqrRiel || '',
      });

      setEvent(updated);
      setMyTemplates(getSavedMyTemplates());
      setSuccess(S.notices.changeEventOk);
    } catch (saveError: any) {
      const message = saveError?.response?.data?.message;
      setError(Array.isArray(message) ? message.join(', ') : message || S.notices.changeEventFail);
    } finally {
      setIsSavingEvent(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!event) {
      return;
    }

    const confirmed = await requestConfirmation(S.notices.deleteEventConfirm);
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
      setError(Array.isArray(message) ? message.join(', ') : message || S.notices.deleteEventFail);
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
    const exchangeRate = USD_KHR_EXCHANGE_RATE;
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

        <section className="flex gap-4 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch] xl:grid xl:grid-cols-5 xl:overflow-visible">
          <div className="flex h-36 min-w-[250px] shrink-0 flex-col rounded-2xl border border-sky-200/90 bg-sky-50 p-4 shadow-sm xl:min-w-0 dark:border-slate-600 dark:bg-slate-900">
            <div className="flex shrink-0 items-start justify-between gap-2">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/90 text-sky-600 shadow-sm ring-1 ring-sky-100 dark:bg-slate-800 dark:text-sky-400 dark:ring-slate-600">
                <Users className="h-5 w-5" />
              </span>
              <p className="shrink-0 text-right font-tabular-figures text-3xl font-bold tabular-nums tracking-tight text-sky-800 dark:text-sky-100">
                {totalGuests}
              </p>
            </div>
            <p className="mt-auto min-w-0 text-sm font-medium leading-snug text-sky-800 dark:text-sky-200">{S.general.invitedGuests}</p>
          </div>

          <div className="flex h-36 min-w-[250px] shrink-0 flex-col rounded-2xl border border-emerald-200/90 bg-emerald-50 p-4 shadow-sm xl:min-w-0 dark:border-slate-600 dark:bg-slate-900">
            <div className="flex shrink-0 items-start justify-between gap-2">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/90 text-emerald-600 shadow-sm ring-1 ring-emerald-100 dark:bg-slate-800 dark:text-emerald-400 dark:ring-slate-600">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <p className="shrink-0 text-right font-tabular-figures text-3xl font-bold tabular-nums tracking-tight text-emerald-800 dark:text-emerald-100">
                {acceptedGuests}
              </p>
            </div>
            <p className="mt-auto min-w-0 text-sm font-medium leading-snug text-emerald-800 dark:text-emerald-200">{S.general.totalConfirmed}</p>
          </div>

          <div className="flex h-36 min-w-[250px] shrink-0 flex-col rounded-2xl border border-violet-200/90 bg-violet-50 p-4 shadow-sm xl:min-w-0 dark:border-slate-600 dark:bg-slate-900">
            <div className="flex shrink-0 items-start justify-between gap-2">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/90 text-violet-600 shadow-sm ring-1 ring-violet-100 dark:bg-slate-800 dark:text-violet-400 dark:ring-slate-600">
                <TrendingUp className="h-5 w-5" />
              </span>
              <p className="shrink-0 text-right font-tabular-figures text-3xl font-bold tabular-nums tracking-tight text-violet-800 dark:text-violet-100">
                {formatUsdCurrency(totalGiftAsUsd)}
              </p>
            </div>
            <p className="mt-auto min-w-0 text-xs font-medium leading-snug text-violet-800 sm:text-sm dark:text-violet-200">
              {S.gifts.totalAsUsd} {S.general.exchangeNote}
            </p>
          </div>

          <div className="flex h-36 min-w-[250px] shrink-0 flex-col rounded-2xl border border-rose-200/90 bg-rose-50 p-4 shadow-sm xl:min-w-0 dark:border-slate-600 dark:bg-slate-900">
            <div className="flex shrink-0 items-start justify-between gap-2">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/90 text-rose-600 shadow-sm ring-1 ring-rose-100 dark:bg-slate-800 dark:text-rose-400 dark:ring-slate-600">
                <DollarSign className="h-5 w-5" />
              </span>
              <p className="shrink-0 text-right font-tabular-figures text-3xl font-bold tabular-nums tracking-tight text-rose-800 dark:text-rose-100">
                {formatUsdCurrency(totalExpenseActualUsd)}
              </p>
            </div>
            <div className="mt-auto min-w-0 space-y-1.5">
              <p className="text-sm font-medium leading-snug text-rose-800 dark:text-rose-200">{S.general.expenses}</p>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-rose-100/90 dark:bg-rose-950/50">
                <div className="h-full rounded-full bg-rose-400 dark:bg-rose-500" style={{ width: `${Math.min(100, expensePercent)}%` }} />
              </div>
              <p className="font-tabular-figures text-sm font-bold tabular-nums tracking-tight text-rose-700 dark:text-rose-300">{expensePercent}%</p>
            </div>
          </div>

          <div className="flex h-36 min-w-[250px] shrink-0 flex-col rounded-2xl border border-teal-200/90 bg-teal-50 p-4 shadow-sm xl:min-w-0 dark:border-slate-600 dark:bg-slate-900">
            <div className="flex shrink-0 items-start justify-between gap-2">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/90 text-teal-600 shadow-sm ring-1 ring-teal-100 dark:bg-slate-800 dark:text-teal-400 dark:ring-slate-600">
                {profitLossUsd >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              </span>
              <p className="shrink-0 text-right font-tabular-figures text-3xl font-bold tabular-nums tracking-tight text-teal-800 dark:text-teal-100">
                {formatUsdCurrency(profitLossUsd)}
              </p>
            </div>
            <p className="mt-auto min-w-0 text-sm font-medium leading-snug text-teal-800 dark:text-teal-200">{S.general.profitLoss}</p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h3 className="font-khmer-heading text-lg text-slate-900 dark:text-slate-100">{S.general.chartParticipation}</h3>
              <CheckCircle2 className="h-5 w-5 text-slate-400 dark:text-slate-500" />
            </div>
            <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-center">
              <div
                className="h-36 w-36 rounded-full"
                style={{
                  background: `conic-gradient(#10b981 0% ${acceptRate}%, #f59e0b ${acceptRate}% ${acceptRate + pendingRate}%, #f43f5e ${acceptRate + pendingRate}% 100%)`,
                }}
              />
              <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />{S.general.legendConfirmed}
                  </span>
                  <span className="font-tabular-figures font-bold tabular-nums text-slate-800 dark:text-slate-100">{acceptRate}%</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />{S.general.legendPending}
                  </span>
                  <span className="font-tabular-figures font-bold tabular-nums text-slate-800 dark:text-slate-100">{pendingRate}%</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />{S.general.legendDeclined}
                  </span>
                  <span className="font-tabular-figures font-bold tabular-nums text-slate-800 dark:text-slate-100">{declineRate}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h3 className="font-khmer-heading text-lg text-slate-900 dark:text-slate-100">{S.general.chartFinance}</h3>
              <DollarSign className="h-5 w-5 text-slate-400 dark:text-slate-500" />
            </div>
            <div className="mt-6 space-y-4">
              {[
                { label: S.general.barGifts, value: totalGiftAsUsd, color: 'bg-emerald-400' },
                { label: S.general.barBudget, value: totalExpenseBudgetUsd, color: 'bg-amber-400' },
                { label: S.general.barActual, value: totalExpenseActualUsd, color: 'bg-sky-400' },
                { label: S.general.barProfit, value: profitLossUsd, color: 'bg-rose-400' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                    <span>{item.label}</span>
                    <span className="font-tabular-figures font-bold tabular-nums text-slate-800 dark:text-slate-100">${formatUsd(item.value)}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-700">
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

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h3 className="font-khmer-heading text-lg text-slate-900 dark:text-slate-100">{S.general.financeOverviewTitle}</h3>
            <DollarSign className="h-5 w-5 text-slate-400 dark:text-slate-500" />
          </div>
          <div className="mt-5 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-2 dark:border-slate-700">
              <span>{S.general.financeGifts}</span>
              <span className="font-tabular-figures font-bold tabular-nums text-slate-800 dark:text-slate-100">${formatUsd(totalGiftAsUsd)}</span>
            </div>
            <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-2 dark:border-slate-700">
              <span>{S.general.financeExpensesActual}</span>
              <span className="font-tabular-figures font-bold tabular-nums text-slate-800 dark:text-slate-100">${formatUsd(totalExpenseActualUsd)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>{S.general.financeProfit}</span>
              <span className="font-tabular-figures font-bold tabular-nums text-slate-800 dark:text-slate-100">${formatUsd(profitLossUsd)}</span>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h3 className="font-khmer-heading text-lg text-slate-900 dark:text-slate-100">{S.general.guestStatsTitle}</h3>
            <Users className="h-5 w-5 text-slate-400 dark:text-slate-500" />
          </div>
          <div className="mt-5 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-2 dark:border-slate-700">
              <span>{S.general.statConfirmed}</span>
              <span className="font-tabular-figures font-bold tabular-nums text-slate-800 dark:text-slate-100">{acceptedGuests}</span>
            </div>
            <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-2 dark:border-slate-700">
              <span>{S.general.statPending}</span>
              <span className="font-tabular-figures font-bold tabular-nums text-slate-800 dark:text-slate-100">{pendingGuests}</span>
            </div>
            <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-2 dark:border-slate-700">
              <span>{S.general.statDeclined}</span>
              <span className="font-tabular-figures font-bold tabular-nums text-slate-800 dark:text-slate-100">{declinedGuests}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>{S.general.statGifted}</span>
              <span className="font-tabular-figures font-bold tabular-nums text-slate-800 dark:text-slate-100">{giftRows.length}</span>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-rose-50 p-6 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-khmer-heading text-lg text-amber-900 dark:text-slate-100">{S.general.recentGiftsTitle}</h3>
                <p className="mt-1 text-sm text-amber-700 dark:text-slate-300">{S.general.recentGiftsSubtitle}</p>
              </div>
              <Mail className="h-5 w-5 text-amber-700 dark:text-slate-300" />
            </div>
            <p className="mt-4 text-sm text-amber-700 dark:text-slate-300">{S.general.totalGiftsLine}</p>
            <p className="mt-2 font-tabular-figures text-2xl font-bold tabular-nums tracking-tight text-amber-900 dark:text-slate-100">
              {giftRows.length} {S.general.peopleSuffix}
            </p>
          </div>

          {(() => {
            // Prevent hydration mismatch: only render countdown after currentTime is set on client
            if (currentTime === null) {
              return (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-khmer-heading text-lg text-slate-900 dark:text-slate-100">{S.general.countdownTitle}</h3>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{S.general.countdownSubtitle}</p>
                    </div>
                    <Clock3 className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                  </div>
                  <div className="mt-4 text-center text-gray-400 dark:text-slate-400">{S.general.countdownLoading}</div>
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
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-khmer-heading text-lg text-slate-900 dark:text-slate-100">{S.general.countdownTitle}</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{S.general.countdownSubtitle}</p>
                  </div>
                  <Clock3 className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: S.general.day, value: days },
                    { label: S.general.hour, value: String(hours).padStart(2, '0') },
                    { label: S.general.minute, value: String(minutes).padStart(2, '0') },
                    { label: S.general.second, value: String(seconds).padStart(2, '0') },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-center dark:border-slate-700 dark:bg-slate-800">
                      <p className="font-tabular-figures text-xl font-bold tabular-nums tracking-tight text-slate-900 sm:text-2xl dark:text-slate-100">{item.value}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
                    </div>
                  ))}
                </div>

                {isPast && (
                  <p className="mt-3 text-sm font-medium text-rose-600">{S.general.eventStarted}</p>
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

    const getStatusMeta = (guest: Guest) => {
      const status = guest.rsvpStatus || guest.status;
      if (status === 'CONFIRMED' || status === 'ACCEPTED') {
        const attendees = Number.isFinite(guest.adultCount) && Number(guest.adultCount) > 0 ? Number(guest.adultCount) : 1;
        return {
          label: `${S.guests.statusConfirmed} (${attendees} ${S.guests.attendeesSuffix})`,
          classes: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
        };
      }

      if (status === 'PENDING') {
        return { label: S.guests.statusPending, classes: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' };
      }

      return { label: S.guests.statusDeclined, classes: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200' };
    };

    const getGroupLabel = (value: string) => {
      const opt = GUEST_GROUP_OPTIONS.find((item) => item.value === value);
      if (!opt) return '-';
      return getGuestGroupLabel(opt.value, isKhmer, opt.label);
    };
    const getTagLabel = (value: string) => {
      const opt = GUEST_TAG_OPTIONS.find((item) => item.value === value);
      if (!opt) return '-';
      return getGuestTagLabel(opt.value, isKhmer, opt.label);
    };
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
        setError(S.guests.exportNoData);
        setSuccess('');
        return;
      }

      setError('');
      setSuccess(S.guests.preparingExcel);

      const exportRows = rowsToExport.map((guest) => {
        const statusLabel = getStatusMeta(guest).label;

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

        setSuccess(S.guests.exportOk);
      } catch {
        setSuccess('');
        setError(S.guests.exportFail);
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
        setSuccess(S.guests.copyOk);
      } catch {
        setError(S.guests.copyFail);
        setSuccess('');
      }
    };

    const handleDeleteSelected = async () => {
      const selectedRows = filteredGuests.filter((item) => selectedGuestIds.includes(item.id));
      if (selectedRows.length === 0) {
        const confirmedAll = await requestConfirmation(S.guests.confirmDeleteNone);
        if (!confirmedAll) return;

        try {
          await Promise.all(filteredGuests.map((item) => apiClient.deleteGuest(item.id)));
          await refreshGuestsAndStats();
          setSelectedGuestIds([]);
        } catch {
          setError(S.guests.deleteFail);
        }
        return;
      }

      const confirmed = await requestConfirmation(
        isKhmer
          ? `តើអ្នកចង់លុបភ្ញៀវចំនួន ${selectedRows.length} នាក់មែនទេ?`
          : `Delete ${selectedRows.length} guest(s)?`,
      );
      if (!confirmed) return;

      try {
        await Promise.all(selectedRows.map((item) => apiClient.deleteGuest(item.id)));
        await refreshGuestsAndStats();
        setSelectedGuestIds([]);
      } catch {
        setError(S.guests.deleteFail);
      }
    };

    return (
      <section className="space-y-4 font-khmer-body">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-5 font-khmer-heading text-2xl text-gray-900 dark:text-slate-100">{S.guests.title}</h2>

          <div className="mb-4 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(220px,1.2fr)_220px_220px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-slate-400" />
              <Input
                value={guestSearch ?? ''}
                onChange={(e) => {
                  setGuestSearch(e.target.value ?? '');
                  setGuestPage(1);
                }}
                placeholder={S.guests.searchPh}
                className="h-10 rounded-lg pl-10"
              />
            </div>

            <select
              value={guestGroupFilter}
              onChange={(e) => {
                setGuestGroupFilter(e.target.value);
                setGuestPage(1);
              }}
              className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="ALL">{S.guests.groupFilter}</option>
              {GUEST_GROUP_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {getGuestGroupLabel(option.value, isKhmer, option.label)}
                </option>
              ))}
            </select>

            <select
              value={guestTagFilter}
              onChange={(e) => {
                setGuestTagFilter(e.target.value);
                setGuestPage(1);
              }}
              className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="ALL">{S.guests.tagFilter}</option>
              {GUEST_TAG_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {getGuestTagLabel(option.value, isKhmer, option.label)}
                </option>
              ))}
            </select>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCopySelected}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                title="Copy"
              >
                <Copy className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={handleExportGuestRows}
                className="inline-flex h-10 items-center rounded-full border border-gray-200 bg-white px-4 text-sm text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Download className="mr-2 h-4 w-4" />
                {S.guests.export}
              </button>

              <Button
                type="button"
                className="h-10 bg-[#C52133] px-4 text-white hover:bg-[#aa1b2a]"
                onClick={() => setIsGuestFormOpen(true)}
              >
                <Plus className="mr-1 h-4 w-4" />
                {S.guests.addNew}
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
                    <h3 className="text-xl font-semibold text-gray-900">{S.guests.addGuestTitle}</h3>
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"
                      onClick={() => setIsGuestFormOpen(false)}
                    >
                      ×
                    </button>
                  </div>
                  <p className="mb-4 text-sm text-gray-500">{S.guests.formHint}</p>

                  <form onSubmit={handleAddGuest} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-sm text-gray-600">{S.guests.nameLabel}</label>
                        <Input
                          value={guestName ?? ''}
                          onChange={(e) => setGuestName(e.target.value ?? '')}
                          placeholder={S.guests.namePh}
                          required
                          disabled={isSubmittingGuest}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm text-gray-600">{S.guests.phoneLabel}</label>
                        <Input
                          value={guestPhone ?? ''}
                          onChange={(e) => setGuestPhone(sanitizeEnglishDigits(e.target.value ?? ''))}
                          onKeyDown={handleDigitsOnlyKeyDown}
                          onPaste={handleDigitsOnlyPaste}
                          placeholder={S.guests.phonePh}
                          disabled={isSubmittingGuest}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={12}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm text-gray-600">{S.guests.groupLabel}</label>
                        <select
                          value={guestGroup}
                          onChange={(e) => setGuestGroup(e.target.value)}
                          className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm"
                          disabled={isSubmittingGuest}
                        >
                          {GUEST_GROUP_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {getGuestGroupLabel(option.value, isKhmer, option.label)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm text-gray-600">{S.guests.tagLabel}</label>
                        <select
                          value={guestTag}
                          onChange={(e) => setGuestTag(e.target.value)}
                          className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm"
                          disabled={isSubmittingGuest}
                        >
                          {GUEST_TAG_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {getGuestTagLabel(option.value, isKhmer, option.label)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-sm text-gray-600">{S.guests.noteLabel}</label>
                        <textarea
                          value={guestNote}
                          onChange={(e) => setGuestNote(e.target.value)}
                          rows={3}
                          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-red-400"
                          placeholder={S.guests.notePh}
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
                        ✕ {S.guests.cancel}
                      </Button>
                      <Button
                        type="submit"
                        className="bg-[#C52133] text-white hover:bg-[#aa1b2a]"
                        disabled={isSubmittingGuest}
                      >
                        {isSubmittingGuest ? S.guests.creating : S.guests.create}
                      </Button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="overflow-x-auto w-full max-w-full rounded-lg border border-gray-100 dark:border-slate-700">
            <table className="min-w-[600px] table-auto text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-slate-800">
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
                  <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-slate-200">{S.guests.thName}</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-slate-200">{S.guests.thPhone}</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-slate-200">{S.guests.thGroup}</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-slate-200">{S.guests.thTag}</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-slate-200">{S.guests.thStatus}</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-slate-200">{S.guests.thGreeting}</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700 dark:text-slate-200">{S.guests.thNote}</th>
                  <th className="px-6 py-4 text-right font-semibold text-gray-700 dark:text-slate-200">{S.guests.thActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700 dark:bg-slate-900">
                {pageGuests.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500 whitespace-nowrap dark:text-slate-400">
                      {S.guests.noData}
                    </td>
                  </tr>
                ) : (
                  pageGuests.map((guest) => {
                    const statusMeta = getStatusMeta(guest);

                    return (
                      <tr key={guest.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-slate-800">
                        <td className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
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
                        <td className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap dark:text-slate-100">{guest.name}</td>
                        <td className="px-6 py-4 text-gray-700 whitespace-nowrap dark:text-slate-300">{guest.phone || '-'}</td>
                        <td className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs ${getGroupBadgeClass(guest.group || 'GROOM_SIDE')} whitespace-nowrap`}>
                            {getGroupLabel(guest.group)}
                          </span>
                        </td>
                        <td className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs ${getTagBadgeClass(guest.tag || 'OTHERS')} whitespace-nowrap`}>
                            {getTagLabel(guest.tag)}
                          </span>
                        </td>
                        <td className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs ${statusMeta.classes} whitespace-nowrap`}>
                            {statusMeta.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-700 dark:text-slate-300">
                          {guest.greetingMessage?.trim() ? (
                            <button
                              type="button"
                              onClick={() => setGuestGreetingPreview(guest.greetingMessage || '')}
                              className="block max-w-[160px] cursor-pointer text-left text-sm text-gray-700 transition hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-300"
                              title={isKhmer ? 'ចុចមើលសារពេញ' : 'Click to view full message'}
                            >
                              <span className="block min-w-0">
                                {guest.greetingMessage.slice(0, 8)}
                                {guest.greetingMessage.length > 8 ? '…' : ''}
                              </span>
                            </button>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-700 dark:text-slate-300">
                          {guest.note?.trim() ? (
                            <button
                              type="button"
                              onClick={() => setGuestNotePreview(guest.note || '')}
                              className="block max-w-[160px] cursor-pointer text-left text-sm text-gray-700 transition hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-300"
                              title={isKhmer ? 'ចុចមើលចំណាំពេញ' : 'Click to view full note'}
                            >
                              <span className="block min-w-0">
                                {guest.note.slice(0, 8)}
                                {guest.note.length > 8 ? '…' : ''}
                              </span>
                            </button>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="relative px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                              title="Share"
                              onClick={() => openSharePopover(guest)}
                            >
                              <Send className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                              title="QR"
                              onClick={() => openQrModal(guest)}
                            >
                              <QrCode className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
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
                                className={`absolute right-6 z-100 w-56 rounded-lg bg-white font-khmer-body overflow-visible dark:bg-slate-900 ${guest === pageGuests[pageGuests.length - 1]
                                  ? 'bottom-full mb-2'
                                  : 'top-full mt-2'
                                  } shadow-xl border border-gray-100 dark:border-slate-700`}
                                style={{
                                  filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.1))'
                                }}
                              >
                                {/* Arrow pointing to button */}
                                <div
                                  className={`absolute right-6 w-3 h-3 bg-white border border-gray-100 rotate-45 dark:bg-slate-900 dark:border-slate-700 ${guest === pageGuests[pageGuests.length - 1]
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
                                  className="flex w-full items-center gap-2 rounded-t-lg px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-amber-50 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                  <Pencil className="h-4 w-4 text-amber-600" />
                                  {S.guests.editGuestMenu}
                                </button>

                                <div className="border-t border-gray-100 dark:border-slate-700" />

                                <button
                                  type="button"
                                  onClick={() => handleDeleteOneGuest(guest.id)}
                                  className="flex w-full items-center gap-2 rounded-b-lg px-3 py-2 text-left text-sm text-red-500 transition-colors hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  {S.guests.deleteThisGuest}
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

          <div className="mt-4 flex flex-col gap-3 text-sm text-gray-600 dark:text-slate-300 md:flex-row md:items-center md:justify-between">
            <p>
              {S.guests.totalLine}: {totalRecords} {S.guests.records}
            </p>

            <div className="flex items-center gap-2">
              <span>{S.guests.perPage}:</span>
              <select
                value={guestRowsPerPage}
                onChange={(e) => {
                  setGuestRowsPerPage(Number(e.target.value));
                  setGuestPage(1);
                }}
                className="h-8 rounded-md border border-gray-200 bg-white px-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>

              <span className="ml-2">
                {S.guests.pageXofY} {totalPages === 0 ? 1 : safePage} {S.guests.ofWord} {totalPages}
              </span>

              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 disabled:opacity-40"
                disabled={totalPages === 0 || safePage <= 1}
                onClick={() => setGuestPage((prev) => Math.max(1, prev - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 disabled:opacity-40"
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
                <h3 className="font-khmer-heading text-2xl text-black">{S.guests.editGuestTitle}</h3>
                <p className="mt-2 text-sm text-gray-500">{S.guests.editHint}</p>

                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-gray-700">{S.guests.nameLabel}</label>
                    <Input
                      value={editGuestName ?? ''}
                      onChange={(e) => setEditGuestName(e.target.value ?? '')}
                      placeholder={S.guests.namePh}
                      className="border-gray-200 bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-gray-700">{S.guests.phoneLabel}</label>
                    <Input
                      value={editGuestPhone ?? ''}
                      onChange={(e) => setEditGuestPhone(sanitizeEnglishDigits(e.target.value ?? ''))}
                      onKeyDown={handleDigitsOnlyKeyDown}
                      onPaste={handleDigitsOnlyPaste}
                      placeholder={S.guests.phonePh}
                      className="border-gray-200 bg-gray-50"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={12}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-700">{S.guests.groupLabel}</label>
                    <select
                      value={editGuestGroup}
                      onChange={(e) => setEditGuestGroup(e.target.value)}
                      className="h-10 w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-sm"
                    >
                      {GUEST_GROUP_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {getGuestGroupLabel(option.value, isKhmer, option.label)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-700">{S.guests.tagLabel}</label>
                    <select
                      value={editGuestTag}
                      onChange={(e) => setEditGuestTag(e.target.value)}
                      className="h-10 w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-sm"
                    >
                      {GUEST_TAG_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {getGuestTagLabel(option.value, isKhmer, option.label)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm text-gray-700">{S.guests.noteLabel}</label>
                    <textarea
                      value={editGuestNote}
                      onChange={(e) => setEditGuestNote(e.target.value)}
                      className="min-h-24 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-gray-300"
                      placeholder={S.guests.notePh}
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditGuestModalOpen(false)}
                    className="rounded-md bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
                  >
                    ✕ {S.guests.cancel}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEditedGuest}
                    className="rounded-md bg-[#C52133] px-4 py-2 text-sm text-white hover:bg-[#aa1b2a]"
                  >
                    {S.guests.save}
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
                <h3 className="font-khmer-body text-xl font-semibold text-gray-900">{S.guests.linkTitle}</h3>
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
                  <h3 className="font-khmer-body text-xl font-semibold text-gray-900">{S.guests.qrCodeLabel}</h3>
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
                    alt={S.guests.qrCodeLabel}
                    className="mx-auto h-64 w-64 rounded-xl bg-white object-contain"
                  />
                </div>

                <p className="mt-3 text-center text-sm text-gray-700">{qrGuestName}</p>
                <p className="mt-1 text-center text-xs text-gray-500">{S.guests.scanHint}</p>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleDownloadQrCode}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#C52133] bg-white px-8 py-3 font-khmer-body text-sm font-semibold text-[#C52133] transition-colors hover:bg-rose-50"
                  >
                    <Download className="h-4 w-4" />
                    {S.guests.downloadQrBtn}
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
    const groupOpt = GUEST_GROUP_OPTIONS.find((item) => item.value === (selectedGiftGuest?.group || 'GROOM_SIDE'));
    const tagOpt = GUEST_TAG_OPTIONS.find((item) => item.value === (selectedGiftGuest?.tag || 'OTHERS'));
    const selectedGiftGuestGroup = groupOpt
      ? getGuestGroupLabel(groupOpt.value, isKhmer, groupOpt.label)
      : getGuestGroupLabel('GROOM_SIDE', isKhmer, GUEST_GROUP_OPTIONS[0].label);
    const selectedGiftGuestTag = tagOpt
      ? getGuestTagLabel(tagOpt.value, isKhmer, tagOpt.label)
      : getGuestTagLabel('OTHERS', isKhmer, GUEST_TAG_OPTIONS.find((o) => o.value === 'OTHERS')?.label || '');
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
        setError(S.gifts.errSelectGuest);
        setSuccess('');
        return;
      }

      if (!editingGiftRowId && selectedGuestGiftRows.length > 0) {
        setError(S.gifts.errDuplicate);
        setSuccess('');
        return;
      }

      const parsedAmount = Number(String(giftAmount || '0').replace(/,/g, ''));
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        setError(S.gifts.errInvalidAmount);
        setSuccess('');
        return;
      }

      try {
        if (!editingGiftRowId) {
          const confirmed = await requestConfirmation(S.gifts.confirmNewGift);
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
          setSuccess(S.gifts.updateSuccess);
        } else {
          const created = await apiClient.createGift(eventId, {
            guestId: selectedGiftGuest.id,
            paymentType: giftPaymentType,
            currencyType: giftCurrencyType,
            amount: parsedAmount,
            note: giftNote.trim() || '-',
          });

          setGiftRows((prev) => [mapGiftToRow(created), ...prev]);
          setSuccess(S.gifts.addSuccess);
        }

        setError('');
        handleCloseGiftModal();
      } catch (createError: any) {
        setSuccess('');
        const message = createError?.response?.data?.message;
        if (Array.isArray(message)) {
          setError(message.join(', '));
        } else {
          setError(message || S.gifts.saveFail);
        }
      }
    };

    const handleDeleteGiftRow = async (id: string) => {
      const confirmed = await requestConfirmation(S.gifts.confirmDeleteOne);
      if (!confirmed) return;

      try {
        await apiClient.deleteGift(id);
        setGiftRows((prev) => prev.filter((row) => row.id !== id));
        setSelectedGiftRowIds((prev) => prev.filter((item) => item !== id));
        setError('');
      } catch {
        setSuccess('');
        setError(S.gifts.deleteFail);
      }
    };

    const handleDeleteSelectedGiftRows = async () => {
      const targetIds = selectedGiftRowIds.length > 0 ? selectedGiftRowIds : giftRows.map((row) => row.id);
      if (targetIds.length === 0) {
        setError(S.gifts.deleteNoData);
        setSuccess('');
        return;
      }

      const confirmed =
        selectedGiftRowIds.length > 0
          ? await requestConfirmation(
            isKhmer
              ? `តើអ្នកចង់លុបចំណងដៃចំនួន ${targetIds.length} មែនទេ?`
              : `Delete ${targetIds.length} gift(s)?`,
          )
          : await requestConfirmation(S.gifts.deleteAllPrompt);
      if (!confirmed) return;

      try {
        const results = await Promise.allSettled(targetIds.map((id) => apiClient.deleteGift(id)));
        const deletedIds = targetIds.filter((_, index) => results[index]?.status === 'fulfilled');
        const failedCount = targetIds.length - deletedIds.length;

        if (deletedIds.length > 0) {
          setGiftRows((prev) => prev.filter((row) => !deletedIds.includes(row.id)));
          setSelectedGiftRowIds((prev) => prev.filter((id) => !deletedIds.includes(id)));
          setSuccess(S.gifts.deleteSuccess);
          setError('');
        }

        if (failedCount > 0) {
          setSuccess('');
          setError(S.gifts.deleteSomeFail);
        }
      } catch {
        setSuccess('');
        setError(S.gifts.deleteSomeFail);
      }
    };

    const handleExportGiftRows = async () => {
      const rowsToExport =
        selectedGiftRowIds.length > 0
          ? giftRows.filter((row) => selectedGiftRowIds.includes(row.id))
          : giftRows;

      if (rowsToExport.length === 0) {
        setError(S.gifts.giftExportNoData);
        setSuccess('');
        return;
      }

      setError('');
      setSuccess(S.gifts.giftPreparing);

      const exchangeRateForExport = USD_KHR_EXCHANGE_RATE;
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

        setSuccess(S.gifts.giftExportOk);
      } catch {
        setSuccess('');
        setError(S.gifts.giftExportFail);
      }
    };

    const allGiftRowsSelected =
      pagedGiftRows.length > 0 && pagedGiftRows.every((row) => selectedGiftRowIds.includes(row.id));

    const exchangeRate = USD_KHR_EXCHANGE_RATE;
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

    const currencyLabel = (value: 'USD' | 'KHR') =>
      value === 'USD' ? S.gifts.currencyUsd : S.gifts.currencyKhr;
    const paymentLabel = (value: 'CASH' | 'KHQR') =>
      value === 'CASH' ? S.gifts.payCash : S.gifts.payKhqr;

    return (
      <section className="space-y-3 font-khmer-body sm:space-y-4">
        <div className="flex gap-4 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch] md:grid md:grid-cols-2 md:gap-4 md:overflow-visible xl:grid-cols-4">
          <div className="flex h-36 min-w-[250px] shrink-0 flex-col rounded-2xl border border-sky-200/90 bg-sky-50 p-4 shadow-sm md:min-w-0 dark:border-slate-600 dark:bg-slate-900">
            <div className="flex shrink-0 items-start justify-between gap-2">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/90 text-sky-600 shadow-sm ring-1 ring-sky-100 dark:bg-slate-800 dark:text-sky-400 dark:ring-slate-600">
                <Users className="h-5 w-5" />
              </span>
              <p className="shrink-0 text-right font-tabular-figures text-3xl font-bold tabular-nums tracking-tight text-sky-800 dark:text-sky-100">
                {formatAmount(receivedGiftCount)}
              </p>
            </div>
            <p className="mt-auto min-w-0 text-sm font-medium leading-snug text-sky-800 dark:text-sky-200">{S.gifts.summaryReceived}</p>
          </div>

          <div className="flex h-36 min-w-[250px] shrink-0 flex-col rounded-2xl border border-emerald-200/90 bg-emerald-50 p-4 shadow-sm md:min-w-0 dark:border-slate-600 dark:bg-slate-900">
            <div className="flex shrink-0 items-start justify-between gap-2">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/90 text-emerald-600 shadow-sm ring-1 ring-emerald-100 dark:bg-slate-800 dark:text-emerald-400 dark:ring-slate-600">
                <DollarSign className="h-5 w-5" />
              </span>
              <p className="shrink-0 text-right font-tabular-figures text-3xl font-bold tabular-nums tracking-tight text-emerald-800 dark:text-emerald-100">
                {formatUsdCurrency(totalUsd)}
              </p>
            </div>
            <p className="mt-auto min-w-0 text-sm font-medium leading-snug text-emerald-800 dark:text-emerald-200">{S.gifts.totalUsd}</p>
          </div>

          <div className="flex h-36 min-w-[250px] shrink-0 flex-col rounded-2xl border border-violet-200/90 bg-violet-50 p-4 shadow-sm md:min-w-0 dark:border-slate-600 dark:bg-slate-900">
            <div className="flex shrink-0 items-start justify-between gap-2">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/90 font-semibold text-violet-600 shadow-sm ring-1 ring-violet-100 dark:bg-slate-800 dark:text-violet-400 dark:ring-slate-600">
                ៛
              </span>
              <p className="shrink-0 text-right font-tabular-figures text-3xl font-bold tabular-nums tracking-tight text-violet-800 dark:text-violet-100">
                ៛{formatAmount(totalKhr)}
              </p>
            </div>
            <p className="mt-auto min-w-0 text-sm font-medium leading-snug text-violet-800 dark:text-violet-200">{S.gifts.totalKhr}</p>
          </div>

          <div className="flex h-36 min-w-[250px] shrink-0 flex-col rounded-2xl border border-rose-200/90 bg-rose-50 p-4 shadow-sm md:min-w-0 dark:border-slate-600 dark:bg-slate-900">
            <div className="flex shrink-0 items-start justify-between gap-2">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/90 text-rose-600 shadow-sm ring-1 ring-rose-100 dark:bg-slate-800 dark:text-rose-400 dark:ring-slate-600">
                <TrendingUp className="h-5 w-5" />
              </span>
              <p className="shrink-0 text-right font-tabular-figures text-3xl font-bold tabular-nums tracking-tight text-rose-800 dark:text-rose-100">
                {formatUsdCurrency(totalAsUsd)}
              </p>
            </div>
            <p className="mt-auto min-w-0 text-xs font-medium leading-snug text-rose-800 sm:text-sm dark:text-rose-200">
              {S.gifts.totalAsUsd} {S.gifts.exchangeNote}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm sm:rounded-2xl sm:p-5 dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 sm:mb-4 sm:gap-3">
            <h2 className="font-khmer-heading text-xl text-gray-900 sm:text-2xl dark:text-slate-100">{S.gifts.title}</h2>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleOpenGiftModal}
                className="inline-flex h-10 items-center rounded-lg bg-[#7A1F2B] px-4 text-sm font-medium text-white hover:bg-[#651925]"
              >
                <Plus className="mr-1 h-4 w-4" />
                {S.gifts.add}
              </button>

              <button
                type="button"
                onClick={handleExportGiftRows}
                className="inline-flex h-10 items-center rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Download className="mr-1 h-4 w-4" />
                {S.gifts.export}
              </button>

              <button
                type="button"
                onClick={handleDeleteSelectedGiftRows}
                className="inline-flex h-10 items-center rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Trash2 className="mr-1 h-4 w-4" />
                {S.gifts.delete}
              </button>
            </div>
          </div>

          <div className="mb-3 sm:mb-4">
            <div className="relative max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-slate-400" />
              <Input
                value={giftSearch}
                onChange={(e) => {
                  setGiftSearch(e.target.value);
                  setGiftPage(1);
                }}
                placeholder={S.gifts.searchPh}
                className="h-10 rounded-lg border-gray-200 pl-10 sm:h-11 sm:rounded-full"
              />
            </div>
          </div>

          <div className="max-w-full overflow-x-auto whitespace-nowrap rounded-lg border border-gray-100 bg-white px-0 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 sm:rounded-xl sm:px-2 dark:border-slate-700 dark:bg-slate-900 dark:scrollbar-thumb-slate-600 dark:scrollbar-track-slate-800">
            <table className="min-w-full table-auto text-sm">
              <thead className="bg-gray-50 dark:bg-slate-800">
                <tr>
                  <th className="w-12 px-3 py-2 sm:px-5 sm:py-3 text-left">
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
                  <th className="px-3 py-2 sm:px-5 sm:py-3 text-left font-semibold text-gray-700 sticky left-0 z-10 bg-white dark:bg-slate-900 dark:text-slate-200">{S.gifts.thGuest}</th>
                  <th className="px-3 py-2 sm:px-5 sm:py-3 text-left font-semibold text-gray-700 dark:text-slate-200">{S.gifts.thPhone}</th>
                  <th className="px-3 py-2 sm:px-5 sm:py-3 text-left font-semibold text-gray-700 dark:text-slate-200">{S.gifts.thPayType}</th>
                  <th className="px-3 py-2 sm:px-5 sm:py-3 text-left font-semibold text-gray-700 dark:text-slate-200">{S.gifts.thCurrency}</th>
                  <th className="px-3 py-2 sm:px-5 sm:py-3 text-left font-semibold text-gray-700 dark:text-slate-200">{S.gifts.thAmount}</th>
                  <th className="px-3 py-2 sm:px-5 sm:py-3 text-left font-semibold text-gray-700 dark:text-slate-200">{S.gifts.thNote}</th>
                  <th className="px-3 py-2 sm:px-5 sm:py-3 text-right font-semibold text-gray-700 dark:text-slate-200">{S.gifts.thActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white dark:divide-slate-700 dark:bg-slate-900">
                {pagedGiftRows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-10 text-center text-gray-500 sm:px-5 sm:py-14 dark:text-slate-400">
                      {S.gifts.noData}
                    </td>
                  </tr>
                )}

                {pagedGiftRows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                    <td className="px-3 py-2 sm:px-5 sm:py-3">
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
                    <td className="px-3 py-2 sm:px-5 sm:py-3 text-gray-900 sticky left-0 z-10 bg-white dark:bg-slate-900 dark:text-slate-100">
                      <div className="inline-flex items-center gap-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-50 text-[#C52133]">
                          <User className="h-4 w-4" />
                        </span>
                        <span>{row.guestName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 sm:px-5 sm:py-3 text-gray-700 dark:text-slate-300">{row.phone || '-'}</td>
                    <td className="px-3 py-2 sm:px-5 sm:py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${row.paymentType === 'CASH'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-sky-100 text-sky-700'
                          }`}
                      >
                        {paymentLabel(row.paymentType)}
                      </span>
                    </td>
                    <td className="px-3 py-2 sm:px-5 sm:py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${row.currencyType === 'USD'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-violet-100 text-violet-700'
                          }`}
                      >
                        {currencyLabel(row.currencyType)}
                      </span>
                    </td>
                    <td className="px-3 py-2 sm:px-5 sm:py-3">
                      <span
                        className={`inline-flex items-center rounded-lg px-2.5 py-1 text-sm font-semibold ${row.currencyType === 'USD'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-violet-50 text-violet-700'
                          }`}
                      >
                        {row.currencyType === 'USD' ? '$' : '៛'} {formatAmount(row.amount)}
                      </span>
                    </td>
                    <td className="px-3 py-2 sm:px-5 sm:py-3 text-gray-700 dark:text-slate-300">
                      {row.note && row.note !== '-' ? (
                        <button
                          type="button"
                          onClick={() => setGuestNotePreview(row.note || '')}
                          className="block max-w-[160px] cursor-pointer text-left text-sm text-gray-700 transition hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-300"
                          title={isKhmer ? 'ចុចមើលចំណាំពេញ' : 'Click to view full note'}
                        >
                          {row.note.slice(0, 8)}
                          {row.note.length > 8 ? '…' : ''}
                        </button>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-3 py-2 sm:px-5 sm:py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditGiftModal(row)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
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

          <div className="mt-4 flex flex-col gap-3 text-sm text-gray-600 dark:text-slate-300 md:flex-row md:items-center md:justify-between">
            <p>
              {S.gifts.totalLine}: {totalGiftRecords} {S.gifts.records}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <span>{S.gifts.perPage}</span>
              <select
                value={giftRowsPerPage}
                onChange={(e) => {
                  setGiftRowsPerPage(Number(e.target.value));
                  setGiftPage(1);
                }}
                className="h-8 rounded-md border border-gray-200 bg-white px-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>

              <span className="ml-2">
                {S.gifts.pageOf} {safeGiftPage} {S.gifts.ofWord} {totalGiftPages}
              </span>

              <button
                type="button"
                onClick={() => setGiftPage(1)}
                disabled={safeGiftPage <= 1}
                className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {S.gifts.goFirst}
              </button>

              <button
                type="button"
                onClick={() => setGiftPage((prev) => Math.max(1, prev - 1))}
                disabled={safeGiftPage <= 1}
                className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {S.gifts.goPrev}
              </button>

              <button
                type="button"
                onClick={() => setGiftPage((prev) => Math.min(totalGiftPages, prev + 1))}
                disabled={safeGiftPage >= totalGiftPages}
                className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {S.gifts.goNext}
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
                <h3 className="font-khmer-heading text-xl sm:text-2xl text-gray-900">
                  {editingGiftRowId ? S.gifts.modalTitleEdit : S.gifts.addTitle}
                </h3>

                <div className="mt-3 flex flex-col gap-4 sm:mt-5 sm:grid sm:min-h-0 sm:flex-1 sm:grid-cols-1 sm:gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
                  <div className="min-h-0 rounded-3xl border border-gray-100 bg-gray-50 p-3 sm:p-4">
                    <label className="mb-2 block text-sm text-gray-700">{S.gifts.labelGuest}</label>
                    <div ref={giftGuestMenuRef} className="relative">
                      <button
                        type="button"
                        onClick={() => setIsGiftGuestMenuOpen((prev) => !prev)}
                        className="flex h-11 w-full items-center justify-between rounded-full border border-gray-200 bg-white px-4 text-left text-sm text-gray-700"
                      >
                        <span className="truncate">
                          {selectedGiftGuest
                            ? `${selectedGiftGuest.name} • ${selectedGiftGuestGroup} • ${selectedGiftGuestTag}`
                            : S.gifts.selectGuest}
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
                              placeholder={S.gifts.searchGuest}
                              className="h-10 rounded-full pl-9"
                            />
                          </div>

                          <div className="mt-3 max-h-[44vh] space-y-2 overflow-auto pr-1">
                            {filteredGuestsForGift.length === 0 ? (
                              <p className="rounded-2xl bg-gray-50 px-3 py-4 text-sm text-gray-500">{S.gifts.noGuestsInList}</p>
                            ) : (
                              filteredGuestsForGift.map((guest) => {
                                const isActive = giftGuestId === guest.id;
                                const go = GUEST_GROUP_OPTIONS.find((item) => item.value === (guest.group || 'GROOM_SIDE'));
                                const to = GUEST_TAG_OPTIONS.find((item) => item.value === (guest.tag || 'OTHERS'));
                                const groupLabel = go
                                  ? getGuestGroupLabel(go.value, isKhmer, go.label)
                                  : getGuestGroupLabel('GROOM_SIDE', isKhmer, GUEST_GROUP_OPTIONS[0].label);
                                const tagLabel = to
                                  ? getGuestTagLabel(to.value, isKhmer, to.label)
                                  : getGuestTagLabel('OTHERS', isKhmer, GUEST_TAG_OPTIONS.find((o) => o.value === 'OTHERS')?.label || '');

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
                          <p className="text-sm font-semibold text-rose-700">{S.gifts.infoSelected}</p>
                          <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[11px] text-rose-700">
                            {S.gifts.selected}
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="rounded-xl border border-sky-100 bg-sky-50/70 px-3 py-2">
                            <p className="text-xs text-sky-700">{S.gifts.colName}</p>
                            <p className="text-sm font-medium text-sky-900">{selectedGiftGuest.name}</p>
                          </div>
                          <div className="rounded-xl border border-amber-100 bg-amber-50/70 px-3 py-2">
                            <p className="text-xs text-amber-700">{S.gifts.colPhone}</p>
                            <p className="text-sm font-medium text-amber-900">{selectedGiftGuest.phone || '-'}</p>
                          </div>
                          <div className="rounded-xl border border-rose-100 bg-white px-3 py-2">
                            <p className="text-xs text-gray-500">{S.gifts.colGroup}</p>
                            <span className="mt-1 inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-xs text-rose-700">
                              {selectedGiftGuestGroup}
                            </span>
                          </div>
                          <div className="rounded-xl border border-gray-200 bg-white px-3 py-2">
                            <p className="text-xs text-gray-500">{S.gifts.colTag}</p>
                            <span className="mt-1 inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                              {selectedGiftGuestTag}
                            </span>
                          </div>
                        </div>

                        {selectedGuestGiftRows.length > 0 && (
                          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                            <p className="text-sm font-medium text-amber-800">{S.gifts.alreadyGifted}</p>
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
                      <label className="mb-2 block text-sm text-gray-700">{S.gifts.labelPaymentType}</label>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => setGiftPaymentType('CASH')}
                          className={`flex h-16 items-center gap-3 rounded-2xl border-2 px-4 text-left transition-colors ${giftPaymentType === 'CASH' ? 'border-[#C52133] bg-rose-50/30' : 'border-gray-200 bg-white'
                            }`}
                        >
                          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                            <DollarSign className="h-5 w-5" />
                          </span>
                          <span className="text-sm font-medium text-gray-800">{S.gifts.payCash}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setGiftPaymentType('KHQR')}
                          className={`flex h-16 items-center gap-3 rounded-2xl border-2 px-4 text-left transition-colors ${giftPaymentType === 'KHQR' ? 'border-[#C52133] bg-rose-50/30' : 'border-gray-200 bg-white'
                            }`}
                        >
                          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 text-sky-600">
                            <QrCode className="h-5 w-5" />
                          </span>
                          <span className="text-sm font-medium text-gray-800">{S.gifts.payKhqr}</span>
                        </button>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="mb-2 block text-sm text-gray-700">{S.gifts.labelCurrencyType}</label>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => setGiftCurrencyType('USD')}
                          className="flex h-12 items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700"
                        >
                          <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${giftCurrencyType === 'USD' ? 'border-[#C52133] bg-[#C52133] text-white' : 'border-gray-300 bg-white text-transparent'}`}>
                            <Check className="h-3.5 w-3.5" />
                          </span>
                          {S.gifts.currencyUsd}
                        </button>

                        <button
                          type="button"
                          onClick={() => setGiftCurrencyType('KHR')}
                          className="flex h-12 items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700"
                        >
                          <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${giftCurrencyType === 'KHR' ? 'border-[#C52133] bg-[#C52133] text-white' : 'border-gray-300 bg-white text-transparent'}`}>
                            <Check className="h-3.5 w-3.5" />
                          </span>
                          {S.gifts.currencyKhr}
                        </button>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="mb-2 block text-sm text-gray-700">{S.gifts.thAmount}</label>
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
                      <label className="mb-2 block text-sm text-gray-700">{S.gifts.thNote}</label>
                      <Input
                        value={giftNote}
                        onChange={(e) => setGiftNote(e.target.value)}
                        placeholder={S.guests.notePh}
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
                    {S.guests.cancel}
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateGift}
                    disabled={isDuplicateGuestOnCreate}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#C52133] px-5 text-sm text-white hover:bg-[#aa1b2a] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:hover:bg-gray-300"
                  >
                    <Check className="h-4 w-4" />
                    {editingGiftRowId ? S.guests.save : S.guests.create}
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
    <section className="min-w-0 rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <p className="mb-3 text-sm text-gray-500 dark:text-slate-400">{S.edit.lead}</p>
      <form
        onSubmit={handleSaveEvent}
        className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] [&>div]:min-w-0"
      >
        {(() => {
          const editLabelClassName = 'mb-2 block text-sm font-medium text-gray-700 font-khmer-body dark:text-slate-300';
          const editInputClassName =
            'h-11 w-full min-w-0 max-w-full box-border rounded-xl border border-gray-300 bg-white/90 text-gray-900 shadow-sm transition focus-visible:border-red-500 focus-visible:ring-2 focus-visible:ring-red-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus-visible:ring-slate-700';
          const editSelectClassName =
            'h-11 w-full min-w-0 max-w-full rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-slate-700';

          return (
            <>
              {editEventType === 'WEDDING' && (
                <>
                  <div>
                    <label className={editLabelClassName}>{S.edit.groom}<RequiredStar /></label>
                    <Input
                      value={editGroomName}
                      onChange={(e) => setEditGroomName(e.target.value)}
                      disabled={isSavingEvent}
                      className={editInputClassName}
                    />
                  </div>
                  <div>
                    <label className={editLabelClassName}>{S.edit.bride}<RequiredStar /></label>
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
                <label className={editLabelClassName}>{S.edit.eventTypeCatalog}<RequiredStar /></label>
                <select
                  value={selectedEventTypeId}
                  onChange={(e) => setSelectedEventTypeId(e.target.value)}
                  className={`${editSelectClassName} disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400 dark:disabled:border-slate-700 dark:disabled:bg-slate-800/70 dark:disabled:text-slate-500`}
                  disabled
                >
                  {eventTypes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              {editEventType === 'WEDDING' && (
                <div>
                  <label className={editLabelClassName}>កម្មវិធីប្រភេទ</label>
                  <select
                    value={editWeddingProgramType}
                    onChange={(e) => setEditWeddingProgramType(e.target.value as WeddingProgramType)}
                    disabled={isSavingEvent}
                    className={editSelectClassName}
                  >
                    {WEDDING_PROGRAM_TYPE_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {isKhmer ? item.km : item.en}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
                    <div className="relative min-w-0 w-full max-w-full">
                      <Home className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-slate-400" />
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
                    <div className="relative min-w-0 w-full max-w-full">
                      <PartyPopper className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-slate-400" />
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

              <div className="min-w-0">
                <label className={editLabelClassName}>{S.edit.startDate}<RequiredStar /></label>
                <Input
                  type="datetime-local"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  required
                  disabled={isSavingEvent}
                  className={editInputClassName}
                />
              </div>

              <div className="min-w-0">
                <label className={editLabelClassName}>{S.edit.endDate}</label>
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
                <label className={editLabelClassName}>{S.edit.address}<RequiredStar /></label>
                <div className="relative min-w-0 w-full max-w-full">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-slate-400" />
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
                <div className="relative min-w-0 w-full max-w-full">
                  <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-slate-400" />
                  <Input
                    type="url"
                    value={editGoogleMapLink}
                    onChange={(e) => setEditGoogleMapLink(e.target.value)}
                    disabled={isSavingEvent}
                    className={`${editInputClassName} pl-10`}
                  />
                </div>
              </div>

              <div className="md:col-span-2 rounded-lg border border-gray-200 p-4 dark:border-slate-700 dark:bg-slate-900/40">
                <p className="mb-3 text-sm font-medium text-gray-700 dark:text-slate-200">{S.edit.visibilityTitle}</p>
                <div className="space-y-2 text-sm text-gray-700 dark:text-slate-300">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="visibility"
                      value="PUBLIC"
                      checked={visibility === 'PUBLIC'}
                      onChange={() => setVisibility('PUBLIC')}
                      disabled={isSavingEvent}
                    />
                    {S.edit.everyone}
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
                    {S.edit.onlyMe}
                  </label>
                </div>
              </div>

              <div className="md:col-span-2 rounded-lg border border-gray-200 p-4 dark:border-slate-700 dark:bg-slate-900/40">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={preventDuplicateGuestNames}
                    onChange={(e) => setPreventDuplicateGuestNames(e.target.checked)}
                    disabled={isSavingEvent}
                  />
                  {S.edit.dupGuests}
                </label>
              </div>

              <div className="md:col-span-2 grid grid-cols-1 gap-4 md:grid-cols-3">
                {[
                  { key: 'backgroundImage', label: S.edit.coverImage, isKhqr: false },
                  { key: 'khqrDollar', label: S.edit.khqrUsd, isKhqr: true },
                  { key: 'khqrRiel', label: S.edit.khqrKhr, isKhqr: true },
                ].map((section) => (
                  <div key={section.key}>
                    <p className="mb-2 text-sm font-medium text-gray-700 font-khmer-body dark:text-slate-300">{section.label}</p>
                    <label
                      htmlFor={`edit-${section.key}`}
                      className={`flex h-40 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-3 text-center text-sm transition-all ${filePreviews[section.key] || getStoredImageInfo(section.key as 'backgroundImage' | 'khqrDollar' | 'khqrRiel')
                          ? 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-100 shadow-sm dark:bg-emerald-900/30 dark:ring-emerald-800/70'
                        : section.isKhqr
                          ? 'border-rose-300 bg-rose-50/70 text-rose-700 hover:border-rose-400 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-300 dark:hover:border-rose-500'
                          : 'border-gray-300 bg-gray-50 text-gray-500 hover:border-red-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-rose-500'
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
                              <p>{S.edit.uploadHint}</p>
                              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">{S.edit.uploadFormats}</p>
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
                                {S.edit.success}
                              </p>
                            )}
                            <p className="line-clamp-2 break-all text-xs text-gray-600 dark:text-slate-300">{previewName}</p>
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

              <div className="md:col-span-2 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSavingEvent || isDeletingEvent}
                  onClick={handleDeleteEvent}
                  className="h-9 min-w-0 shrink-0 rounded-lg border-orange-200/90 bg-orange-50/40 px-3 py-0 font-khmer-body text-[13px] font-medium leading-none text-orange-800 shadow-none transition-colors hover:border-orange-300 hover:bg-orange-100/70 dark:border-orange-800/60 dark:bg-orange-950/30 dark:text-orange-200 dark:hover:border-orange-600 dark:hover:bg-orange-950/50"
                >
                  {isDeletingEvent ? S.edit.deleting : S.edit.deleteEvent}
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingEvent || isDeletingEvent}
                  className="h-9 shrink-0 whitespace-nowrap rounded-lg border border-teal-700/90 px-4 py-0 font-khmer-body text-[13px] font-semibold leading-none !bg-teal-600 text-white shadow-sm shadow-teal-950/18 transition-colors hover:!bg-teal-500 hover:shadow-md hover:shadow-teal-950/25 active:translate-y-px dark:!bg-teal-600 dark:border-teal-500/35 dark:text-white dark:shadow-black/35 dark:hover:!bg-teal-500"
                >
                  {isSavingEvent ? S.edit.saving : S.edit.save}
                </Button>
              </div>
            </>
          );
        })()}
      </form>
    </section>
  );

  const renderScheduleTab = () => {
    const agendaFieldInputClassName =
      'h-11 w-full min-w-0 max-w-full box-border rounded-xl border border-gray-300 bg-white/90 text-gray-900 shadow-sm transition focus-visible:border-red-500 focus-visible:ring-2 focus-visible:ring-red-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus-visible:ring-slate-700';

    return (
    <section className="min-w-0 space-y-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-[#C52133]">
            <CalendarDays className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-moul text-2xl text-gray-900 dark:text-slate-100">{S.schedule.title}</h2>
            <span className="mt-1 inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
              {agendaSections.length} {S.schedule.agendaCountSuffix}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAgendaCollapsed((prev) => !prev)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          {isAgendaCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
        </button>
      </div>

      {!isAgendaCollapsed && (
        <div className="space-y-6 font-khmer-body">
          {agendaSections.map((section, sectionIndex) => (
            <div key={section.id} className="min-w-0 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
                    {S.schedule.sectionName}
                    <span className="ml-1 text-[#C52133]">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => removeAgendaSection(section.id)}
                    className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-[#C52133] hover:bg-rose-100 dark:border-rose-700 dark:bg-rose-900/25 dark:text-rose-300 dark:hover:bg-rose-900/40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {S.schedule.deleteSection}
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
                  placeholder={S.schedule.sectionPlaceholder}
                  className={agendaFieldInputClassName}
                />
              </div>

              <div className="relative min-w-0 pl-6">
                <div className="absolute left-2 top-2 h-[calc(100%-16px)] border-l-2 border-dashed border-gray-200 dark:border-slate-700" />

                <div className="space-y-3">
                  {section.items.map((item) => (
                    <div key={item.id} className="relative rounded-2xl bg-gray-50 p-4 dark:bg-slate-800">
                      <span className="absolute -left-6 top-5 h-3 w-3 rounded-full border-2 border-white bg-[#C52133] dark:border-slate-900" />
                      <button
                        type="button"
                        onClick={() => removeAgendaItem(section.id, item.id)}
                        className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-[#C52133] hover:bg-rose-100 dark:border-rose-700 dark:bg-rose-900/25 dark:text-rose-300 dark:hover:bg-rose-900/40"
                        title={S.schedule.deleteItemTitle}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.6fr)_minmax(0,0.6fr)] [&>div]:min-w-0">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-600 dark:text-slate-400">{S.schedule.itemTitle}</label>
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
                            placeholder={S.schedule.itemTitlePh}
                            className={agendaFieldInputClassName}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-600 dark:text-slate-400">{S.schedule.date}</label>
                          <div className="relative min-w-0 w-full max-w-full">
                            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
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
                              className={`${agendaFieldInputClassName} pl-9`}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-600 dark:text-slate-400">{S.schedule.time}</label>
                          <div className="relative min-w-0 w-full max-w-full">
                            <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
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
                              className={`${agendaFieldInputClassName} pl-9`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="mt-4 inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
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
                  + {S.schedule.addItem}
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            className="inline-flex w-full items-center justify-center rounded-full border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
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
            + {S.schedule.addSection}
          </button>

          <div className="flex justify-end">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-[#C52133] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#aa1b2a]"
              onClick={handleSaveAgenda}
              disabled={isSavingAgenda}
            >
              <Save className="h-4 w-4" />
              {isSavingAgenda ? S.schedule.saving : S.schedule.save}
            </button>
          </div>
        </div>
      )}
    </section>
    );
  };

  const handleRemoveMyTemplate = async (id: string) => {
    const confirmed = await requestConfirmation(S.myTemplate.confirmRemove);
    if (!confirmed) {
      return;
    }

    removeMyTemplate(id);
    const remaining = getSavedMyTemplates();
    setMyTemplates(remaining);

    if (!event || activeMyTemplateId !== id) {
      return;
    }

    const metadata =
      event.metadata && typeof event.metadata === 'object'
        ? (event.metadata as Record<string, unknown>)
        : {};
    const eventScoped = remaining
      .filter((item) => item.eventId === eventId)
      .sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
    const fallback = eventScoped[0] || null;

    void apiClient
      .updateEvent(event.id, {
        templateId: fallback?.templateId || event.templateId,
        metadata: {
          ...metadata,
          activeMyTemplateId: fallback?.id || undefined,
        },
      })
      .then((updated) => setEvent(updated))
      .catch(() => {
        // keep local removal even if server sync fails
      });
  };

  const handleActivateMyTemplate = async (template: MyTemplateItem) => {
    if (!event || activatingMyTemplateId || activeMyTemplateId === template.id) {
      return;
    }

    setActivatingMyTemplateId(template.id);
    setError('');
    setSuccess('');

    try {
      const metadata =
        event.metadata && typeof event.metadata === 'object'
          ? (event.metadata as Record<string, unknown>)
          : {};

      const currentSnapshots =
        metadata.myTemplateSnapshots && typeof metadata.myTemplateSnapshots === 'object'
          ? (metadata.myTemplateSnapshots as Record<string, unknown>)
          : {};

      const updated = await apiClient.updateEvent(event.id, {
        templateId: template.templateId,
        metadata: {
          ...metadata,
          activeMyTemplateId: template.id,
          myTemplateSnapshots: {
            ...currentSnapshots,
            [template.id]: {
              name: template.name,
              templateId: template.templateId,
              builderState: template.builderState,
              updatedAt: new Date().toISOString(),
            },
          },
        },
      });

      setEvent(updated);
      setSuccess(S.myTemplate.useSuccess);
    } catch {
      setError(S.myTemplate.useFail);
    } finally {
      setActivatingMyTemplateId(null);
    }
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
      return S.builderDefaults.weddingDay;
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
          title: S.builderDefaults.agendaSection,
          items: [{ id: `agenda-item-${Date.now()}`, title: '', date: dateOnly, time: '' }],
        },
      ];

    const templateImage = getEventTemplateCatalogImage(sourceEvent);
    const styleDefaults = getTemplateStyleDefaults(sourceEvent.template);

    return {
      styleVariant: styleDefaults.styleVariant as BuilderState['styleVariant'],
      templateId: sourceEvent.templateId || sourceEvent.template?.id,
      language: language === 'km' ? 'km' : 'en',
      musicEnabled: true,
      musicId: 'classic',
      musicUrl: sourceEvent.musicUrl || Assets.weddingMusic,
      textColor: styleDefaults.textColor,
      headingColor: styleDefaults.headingColor,
      coverImageUrl: templateImage || getSeededCoverImage(sourceEvent.id || sourceEvent.title || sourceEvent.date),
      backgroundUrl: styleDefaults.backgroundUrl,
      eventTitle: sourceEvent.title || S.builderDefaults.eventTitle,
      eventSubtitle: '',
      eventDate: formatBuilderEventDate(sourceEvent.date),
      eventEndDate:
        typeof metadata?.eventEndDate === 'string' && metadata.eventEndDate.trim()
          ? metadata.eventEndDate
          : formatBuilderEventDate(sourceEvent.date),
      eventLocation: sourceEvent.location || S.builderDefaults.eventLocation,
      greetingTitle: S.invitationSeed.greetingTitle,
      greetingMessage: S.invitationSeed.greetingMessage,
      agendaSections: agenda as BuilderState['agendaSections'],
      mapUrl: sourceEvent.googleMapLink || '',
      mapImageUrl: Assets.map,
      galleryImages: getSeededGalleryImages(sourceEvent.id || sourceEvent.title || sourceEvent.date),
      thankYouTitle: S.invitationSeed.thankYouTitle,
      thankYouMessage: S.invitationSeed.thankYouMessage,
      khqrUsdUrl: sourceEvent.khqrDollar || Assets.khqrSampleAbaPay,
      khqrKhrUrl: sourceEvent.khqrRiel || Assets.khqrSampleAbaPay,
    };
  };

  /** Builder slice for template-shop cards so the cover matches InvitationBuilder / PreviewPanel (ImageCover). */
  const buildTemplateShopCoverPreviewState = (
    sourceEvent: Event,
    catalogTemplate: Template,
    previewCoverUrl: string,
    linked: MyTemplateItem | undefined,
  ): BuilderState => {
    const base = createBuilderStateSnapshot(sourceEvent);
    const style = getTemplateStyleDefaults(catalogTemplate);
    const cover =
      typeof previewCoverUrl === 'string' && previewCoverUrl.trim().length > 0
        ? previewCoverUrl.trim()
        : base.coverImageUrl;

    if (linked?.builderState) {
      const saved = linked.builderState as BuilderState;
      return {
        ...base,
        ...saved,
        templateId: catalogTemplate.id,
        coverImageUrl: cover || saved.coverImageUrl || base.coverImageUrl,
      };
    }

    return {
      ...base,
      templateId: catalogTemplate.id,
      styleVariant: style.styleVariant as BuilderState['styleVariant'],
      textColor: style.textColor,
      headingColor: style.headingColor,
      backgroundUrl: style.backgroundUrl || base.backgroundUrl,
      coverImageUrl: cover || base.coverImageUrl,
    };
  };

  const handleUseTemplateAndSave = async (template: Template) => {
    setPreviewingTemplateId(template.id);
    setError('');
    setSuccess('');

    try {
      const updatedEvent = await apiClient.updateEvent(eventId, { templateId: template.id });
      const snapshot = createBuilderStateSnapshot(updatedEvent);
      const existingActiveId =
        updatedEvent.metadata && typeof updatedEvent.metadata === 'object'
          ? (() => {
            const metadata = updatedEvent.metadata as Record<string, unknown>;
            return typeof metadata.activeMyTemplateId === 'string' ? metadata.activeMyTemplateId : '';
          })()
          : '';

      const saved = saveMyTemplate({
        templateId: template.id,
        eventId: updatedEvent.id,
        name: template.name,
        thumbnail:
          snapshot.coverImageUrl ||
          snapshot.backgroundUrl ||
          getTemplateCatalogImage(updatedEvent.template || template),
        previewUrl:
          snapshot.coverImageUrl ||
          snapshot.backgroundUrl ||
          getTemplateCatalogImage(updatedEvent.template || template),
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
          // Keep currently active template unchanged; users switch active only from "My templates".
          activeMyTemplateId: existingActiveId || saved.id,
          myTemplateSnapshots: {
            ...currentSnapshots,
            [saved.id]: {
              name: saved.name,
              templateId: saved.templateId,
              builderState: saved.builderState,
              updatedAt: new Date().toISOString(),
            },
          },
        },
      });

      setEvent(syncedEvent);
      setMyTemplates(getSavedMyTemplates());
      setSuccess(S.messages.useTemplateSuccess);
    } catch (previewError) {
      console.error('Failed to apply template and save:', previewError);
      setError(S.messages.useTemplateError);
    } finally {
      setPreviewingTemplateId(null);
    }
  };

  const renderMyTemplateTab = () => (
    <section className="space-y-5 rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500 dark:text-slate-400">{S.myTemplate.sectionLabel}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setMyTemplates(getSavedMyTemplates())}
          className="dark:border-slate-700 dark:bg-black dark:text-white dark:hover:bg-slate-900"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          {S.myTemplate.reload}
        </Button>
      </div>

      {eventMyTemplates.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-600 dark:border-slate-700 dark:text-slate-300">
          {S.myTemplate.empty}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {eventMyTemplates.map((template) => {
            const previewImage =
              template.thumbnail ||
              template.previewUrl ||
              template.builderState?.coverImageUrl ||
              template.builderState?.backgroundUrl ||
              Assets.mainThumbnail1;
            const coverPreviewData = event
              ? (() => {
                const base = createBuilderStateSnapshot(event);
                return {
                  ...base,
                  ...(template.builderState || {}),
                  templateId: template.templateId || base.templateId,
                  coverImageUrl: previewImage || template.builderState?.coverImageUrl || base.coverImageUrl,
                } as BuilderState;
              })()
              : undefined;
            const isInUse = activeMyTemplateForInvite?.id === template.id;

            return (
              <div key={template.id} className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <div className="relative p-4">
                  <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl shadow-sm">
                    <div className="absolute inset-0 overflow-hidden">
                      {coverPreviewData ? (
                        <div className="pointer-events-none absolute left-1/2 top-0 w-[28rem] max-w-[200%] -translate-x-1/2 origin-top scale-[0.82] sm:scale-[0.84] md:scale-[0.8] xl:scale-[0.74]">
                          <Suspense
                            fallback={
                              <div className="flex h-160 w-full items-center justify-center">
                                <span className="text-xs text-gray-400 dark:text-slate-500">...</span>
                              </div>
                            }
                          >
                            <ImageCover data={coverPreviewData} />
                          </Suspense>
                        </div>
                      ) : (
                        <div
                          className="absolute inset-0"
                          style={{
                            backgroundImage: `url(${previewImage})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center top',
                          }}
                        />
                      )}
                    </div>
                  </div>
                  <div className="absolute left-6 top-6 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-[#C52133] shadow-sm backdrop-blur dark:bg-slate-900/95 dark:text-rose-300">
                    {template.eventTypeName || 'Template'}
                  </div>
                </div>

                <div className="space-y-4 p-5 pt-2">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-khmer-heading text-lg text-gray-900 dark:text-slate-100">{template.name}</h3>
                      {isInUse ? (
                        <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                          {S.myTemplate.inUseBadge}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                      {S.myTemplate.savedAt}{' '}
                      {new Date(template.savedAt).toLocaleString(isKhmer ? 'km-KH' : 'en-US')}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/events/${eventId}/my-template/${template.id}`} className="flex-1">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 dark:hover:text-white"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        {S.myTemplate.view}
                      </Button>
                    </Link>

                    <Link href={`/events/${eventId}/builder?myTemplateId=${template.id}`} className="flex-1">
                      <Button type="button" className="w-full bg-[#C52133] text-white hover:bg-[#aa1b2a]">
                        <Pencil className="mr-2 h-4 w-4" />
                        {S.myTemplate.edit}
                      </Button>
                    </Link>
                  </div>

                  <Button
                    type="button"
                    variant={isInUse ? 'outline' : 'default'}
                    className={
                      isInUse
                        ? 'w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-900/30'
                        : 'w-full bg-[#7A1F2B] text-white hover:bg-[#651925]'
                    }
                    disabled={isInUse || activatingMyTemplateId === template.id}
                    onClick={() => handleActivateMyTemplate(template)}
                  >
                    {activatingMyTemplateId === template.id ? S.myTemplate.usingThis : S.myTemplate.useThis}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-300 dark:hover:bg-rose-900/25 dark:hover:text-rose-200"
                    onClick={() => handleRemoveMyTemplate(template.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {S.myTemplate.remove}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );

  const renderTemplateShopTab = () => {
    if (!event) {
      return null;
    }

    return (
      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-khmer-heading text-2xl text-gray-900 dark:text-slate-100">{S.shop.title}</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{S.shop.subtitle}</p>
          </div>
        </div>

        {templateError && (
          <MessageCard
            text={templateError}
            tone="error"
            onClose={() => setTemplateError('')}
          />
        )}

        {isTemplatesLoading ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            {S.shop.loading}
          </div>
        ) : templates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            {S.shop.empty}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {templates.map((template) => {
              const eventTypeLabel = template.eventType?.name || 'Wedding';

              const eventTitle = event.title || S.shop.defaultEventTitle;

              const linkedMyTemplate = myTemplates.find(
                (item) => item.eventId === eventId && item.templateId === template.id,
              );

              const savedCover =
                typeof linkedMyTemplate?.builderState?.coverImageUrl === 'string'
                  ? linkedMyTemplate.builderState.coverImageUrl.trim()
                  : '';
              const savedThumb =
                typeof linkedMyTemplate?.thumbnail === 'string' ? linkedMyTemplate.thumbnail.trim() : '';
              const catalogForRow = getTemplateCatalogImage(template);
              const snapshotCover = getBuilderCoverFromMyTemplateSnapshots(event.metadata, template.id);
              const previewImage =
                (savedCover.length > 0 ? savedCover : undefined) ||
                snapshotCover ||
                (savedThumb.length > 0 ? savedThumb : undefined) ||
                catalogForRow ||
                Assets.mainThumbnail1;

              const coverPreviewData = buildTemplateShopCoverPreviewState(
                event,
                template,
                previewImage,
                linkedMyTemplate,
              );

              return (
                <div key={template.id} className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <div className="relative p-4">
                    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl shadow-sm">
                      <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none absolute left-1/2 top-0 w-[28rem] max-w-[200%] -translate-x-1/2 origin-top scale-[0.82] sm:scale-[0.84] md:scale-[0.8] xl:scale-[0.74]">
                          <Suspense
                            fallback={
                              <div className="flex h-160 w-full items-center justify-center">
                                <span className="text-xs text-gray-400 dark:text-slate-500">…</span>
                              </div>
                            }
                          >
                            <ImageCover data={coverPreviewData} />
                          </Suspense>
                        </div>
                      </div>
                    </div>
                    <div className="absolute left-6 top-6 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-[#C52133] shadow-sm backdrop-blur dark:bg-slate-900/95 dark:text-rose-300">
                      {eventTypeLabel}
                    </div>
                  </div>
                  <div className="space-y-4 p-5 pt-2">
                    <div>
                      <h3 className="font-khmer-heading text-lg text-gray-900 dark:text-slate-100">{eventTitle}</h3>
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2 dark:text-slate-400">
                        {S.shop.templateLine} {template.name}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {linkedMyTemplate ? (
                        <>
                          <Link href={`/events/${eventId}/my-template/${linkedMyTemplate.id}`} className="flex-1">
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 dark:hover:text-white"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              {S.shop.view}
                            </Button>
                          </Link>
                          <Link href={`/events/${eventId}/builder?myTemplateId=${linkedMyTemplate.id}`} className="flex-1">
                            <Button type="button" className="w-full bg-[#C52133] text-white hover:bg-[#aa1b2a]">
                              <Pencil className="mr-2 h-4 w-4" />
                              {S.shop.edit}
                            </Button>
                          </Link>
                        </>
                      ) : (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full flex-1 border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 dark:hover:text-white"
                            onClick={() => handleUseTemplateAndSave(template)}
                            disabled={previewingTemplateId === template.id}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            {previewingTemplateId === template.id ? S.shop.usingTemplate : S.shop.useTemplate}
                          </Button>
                          <Link
                            href={`/events/${eventId}/builder?templateId=${template.id}`}
                            className="flex-1"
                          >
                            <Button type="button" className="w-full bg-[#C52133] text-white hover:bg-[#aa1b2a]">
                              <Pencil className="mr-2 h-4 w-4" />
                              {S.shop.customize}
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
  };

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
      const confirmed = await requestConfirmation(S.expenses.confirmDeleteOne);
      if (!confirmed) return;

      try {
        await apiClient.deleteExpense(id);
        setExpenseRows((prev) => prev.filter((row) => row.id !== id));
        setSelectedExpenseRowIds((prev) => prev.filter((rowId) => rowId !== id));
        setError('');
      } catch (deleteError) {
        setSuccess('');
        setError(extractApiErrorMessage(deleteError) || S.expenses.deleteFail);
      }
    };

    const handleDeleteSelectedExpenseRows = async () => {
      const targetIds = selectedExpenseRowIds.length > 0 ? selectedExpenseRowIds : expenseRows.map((row) => row.id);
      if (targetIds.length === 0) {
        setError(S.expenses.deleteNoData);
        setSuccess('');
        return;
      }

      const confirmed =
        selectedExpenseRowIds.length > 0
          ? await requestConfirmation(
            isKhmer
              ? `តើអ្នកចង់លុបចំណាយចំនួន ${targetIds.length} មែនទេ?`
              : `Delete ${targetIds.length} expense(s)?`,
          )
          : await requestConfirmation(S.expenses.deleteAllPrompt);
      if (!confirmed) return;

      try {
        const results = await Promise.allSettled(targetIds.map((id) => apiClient.deleteExpense(id)));
        const deletedIds = targetIds.filter((_, index) => results[index]?.status === 'fulfilled');
        const failedCount = targetIds.length - deletedIds.length;

        if (deletedIds.length > 0) {
          setExpenseRows((prev) => prev.filter((row) => !deletedIds.includes(row.id)));
          setSelectedExpenseRowIds((prev) => prev.filter((id) => !deletedIds.includes(id)));
          setSuccess(S.expenses.deleteSuccess);
          setError('');
        }

        if (failedCount > 0) {
          setSuccess('');
          setError(S.expenses.deleteSomeFail);
        }
      } catch {
        setSuccess('');
        setError(S.expenses.deleteSomeFail);
      }
    };

    const openMenu = (columnId: string, target: HTMLElement) => {
      const rect = target.getBoundingClientRect();
      setExpenseColumnMenu({ columnId, anchorRect: rect });
    };

    const handleExportExpenseRows = async () => {
      if (expenseRows.length === 0) {
        setError(S.expenses.exportNoData);
        setSuccess('');
        return;
      }

      setError('');
      setSuccess(S.expenses.preparingExcel);

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

        setSuccess(S.expenses.exportOk);
      } catch {
        setSuccess('');
        setError(S.expenses.exportFail);
      }
    };

    return (
      <section className="space-y-4 font-khmer-body">
        <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm sm:p-5 dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 sm:mb-4 sm:gap-3">
            <h2 className="font-khmer-heading text-xl text-gray-900 sm:text-2xl dark:text-slate-100">{S.expenses.title}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                className="h-10 bg-[#C52133] px-4 text-white hover:bg-[#aa1b2a]"
                onClick={() => setIsExpenseModalOpen(true)}
              >
                <Plus className="mr-1 h-4 w-4" />
                {S.expenses.add}
              </Button>
              <button
                type="button"
                className="inline-flex h-10 items-center rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                onClick={() => {
                  resetExpenseImportState();
                  setIsExpenseImportOpen(true);
                }}
              >
                <Upload className="mr-1 h-4 w-4" />
                {S.expenses.importExcel}
              </button>
              <button
                type="button"
                className="inline-flex h-10 items-center rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                onClick={handleExportExpenseRows}
              >
                <Download className="mr-1 h-4 w-4" />
                {S.expenses.export}
              </button>
              <button
                type="button"
                className="inline-flex h-10 items-center rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                onClick={handleDeleteSelectedExpenseRows}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                {S.expenses.delete}
              </button>
            </div>
          </div>

          <div className="mb-3 sm:mb-4">
            <div className="relative max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-slate-400" />
              <Input
                value={expenseSearch}
                onChange={(event) => setExpenseSearch(event.target.value)}
                placeholder={S.expenses.searchPh}
                className="h-10 rounded-lg border-gray-200 pl-10 sm:h-11 sm:rounded-full"
              />
            </div>
          </div>

          <div className="w-full max-w-full overflow-x-auto rounded-lg border border-gray-100 bg-white px-0 sm:rounded-xl sm:px-2 dark:border-slate-700 dark:bg-slate-900">
            <table className="min-w-full table-auto text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-slate-800">
                <tr>
                  <th className="w-12 px-3 py-2 sm:px-5 sm:py-3 text-left whitespace-nowrap">
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
                    <th className="px-3 py-2 sm:px-5 sm:py-3 text-left font-semibold text-gray-700 whitespace-nowrap dark:text-slate-200">
                      <button
                        type="button"
                        onClick={(event) => openMenu('name', event.currentTarget)}
                        className="inline-flex items-center gap-2"
                      >
                        {S.expenses.thName}
                        <ArrowUpDown className="h-4 w-4 text-gray-500 dark:text-slate-400" />
                      </button>
                    </th>
                  )}
                  {visibleColumns.budget && (
                    <th className="px-3 py-2 sm:px-5 sm:py-3 text-left font-semibold text-gray-700 whitespace-nowrap dark:text-slate-200">
                      <button
                        type="button"
                        onClick={(event) => openMenu('budget', event.currentTarget)}
                        className="inline-flex items-center gap-2"
                      >
                        {S.expenses.thBudget}
                        <ArrowUpDown className="h-4 w-4 text-gray-500 dark:text-slate-400" />
                      </button>
                    </th>
                  )}
                  {visibleColumns.actual && (
                    <th className="px-3 py-2 sm:px-5 sm:py-3 text-left font-semibold text-gray-700 whitespace-nowrap dark:text-slate-200">
                      <button
                        type="button"
                        onClick={(event) => openMenu('actual', event.currentTarget)}
                        className="inline-flex items-center gap-2"
                      >
                        {S.expenses.thActual}
                        <ArrowUpDown className="h-4 w-4 text-gray-500 dark:text-slate-400" />
                      </button>
                    </th>
                  )}
                  {visibleColumns.note && (
                    <th className="px-3 py-2 sm:px-5 sm:py-3 text-left font-semibold text-gray-700 whitespace-nowrap dark:text-slate-200">
                      <button
                        type="button"
                        onClick={(event) => openMenu('note', event.currentTarget)}
                        className="inline-flex items-center gap-2"
                      >
                        {S.expenses.thDescription}
                        <ArrowUpDown className="h-4 w-4 text-gray-500 dark:text-slate-400" />
                      </button>
                    </th>
                  )}
                  <th className="px-3 py-2 sm:px-5 sm:py-3 text-right font-semibold text-gray-700 whitespace-nowrap dark:text-slate-200">{S.expenses.thActions}</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900">
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
                      className="px-3 py-10 text-center text-gray-500 whitespace-nowrap sm:px-5 sm:py-14 dark:text-slate-400"
                    >
                      {S.expenses.noDataRow}
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
                        <td className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
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
                          <td className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                            <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm text-[#7A1F2B] whitespace-nowrap dark:border-slate-700 dark:bg-slate-800 dark:text-rose-300">
                              {row.name}
                            </div>
                          </td>
                        )}
                        {visibleColumns.budget && (
                          <td className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                            <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm text-gray-700 whitespace-nowrap dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              ${formatCurrency(budgetValue)}
                            </div>
                          </td>
                        )}
                        {visibleColumns.actual && (
                          <td className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                            <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm text-gray-700 whitespace-nowrap dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              <div className="flex items-center justify-between text-xs text-gray-500 whitespace-nowrap dark:text-slate-400">
                                <span>${formatCurrency(actualValue)}</span>
                                <span>${formatCurrency(budgetValue)}</span>
                              </div>
                              <div className="mt-2 h-2 w-full rounded-full bg-gray-100 dark:bg-slate-700">
                                <div
                                  className="h-2 rounded-full bg-[#C52133]"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                              <div className="mt-2 flex justify-end text-xs text-gray-500 whitespace-nowrap dark:text-slate-400">{percent}%</div>
                            </div>
                          </td>
                        )}
                        {visibleColumns.note && (
                          <td className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setExpenseDescriptionPreview(row.note || '')}
                              className="rounded-2xl border border-gray-100 bg-white px-4 py-3 text-left text-sm text-gray-700 transition hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-emerald-300"
                              title={isKhmer ? 'ចុចមើលការពិពណ៌នាពេញ' : 'Click to view full description'}
                            >
                              {row.note.slice(0, 8)}
                              {row.note.length > 8 ? '…' : ''}
                            </button>
                          </td>
                        )}
                        <td className="px-2 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditExpenseRow(row)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
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

          <div className="mt-4 flex flex-col gap-3 text-sm text-gray-600 dark:text-slate-300 md:flex-row md:items-center md:justify-between">
            <p>
              {S.guests.totalLine}: {totalRecords} {S.guests.records}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span>{S.guests.perPage}</span>
              <select className="h-8 rounded-md border border-gray-200 bg-white px-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="ml-2">
                {S.guests.pageXofY} 1 {S.guests.ofWord} {totalPages}
              </span>
              <button
                type="button"
                className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                disabled
              >
                {S.guests.firstPage}
              </button>
              <button
                type="button"
                className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                disabled
              >
                {S.guests.prevPage}
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen && expenseColumnMenu &&
          createPortal(
            <div
              ref={expenseMenuRef}
              className="fixed z-[120] w-56 rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
              style={{
                top: expenseColumnMenu.anchorRect.bottom + 8,
                left: expenseColumnMenu.anchorRect.left,
              }}
            >
              <button
                type="button"
                onClick={() => handleSortExpenseColumn('asc')}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ArrowUp className="h-4 w-4 text-gray-500 dark:text-slate-400" />
                {S.expenses.sortAsc}
              </button>
              <button
                type="button"
                onClick={() => handleSortExpenseColumn('desc')}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ArrowDown className="h-4 w-4 text-gray-500 dark:text-slate-400" />
                {S.expenses.sortDesc}
              </button>
              <div className="mx-4 border-t border-gray-200 dark:border-slate-700" />
              <button
                type="button"
                onClick={handleHideExpenseColumn}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <EyeOff className="h-4 w-4 text-gray-500 dark:text-slate-400" />
                {S.expenses.hideColumn}
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
                    <h3 className="font-moul text-2xl text-gray-900">{S.expenses.importTitle}</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {S.expenses.importSubtitle}
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
                      <p className="text-sm font-semibold text-gray-700">{S.expenses.needSample}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadExpenseSample}
                      className="inline-flex items-center gap-2 rounded-full border border-[#E38E98] bg-white px-4 py-2 text-sm font-semibold text-[#C52133] hover:bg-rose-50"
                    >
                      <Download className="h-4 w-4" />
                      {S.expenses.downloadShort}
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
                  <p className="text-base font-semibold text-gray-900">{S.expenses.dropTitle}</p>
                  <p className="text-sm text-gray-500">{S.expenses.dropHint}</p>
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
                    <p className="text-sm text-gray-500">{S.expenses.parsingFile}</p>
                  ) : expenseImportPreview.length === 0 ? (
                    <p className="text-sm text-gray-500">{S.expenses.previewEmpty}</p>
                  ) : (
                    <div className="space-y-4">
                      {expenseImportPreview.map((expense) => (
                        <div key={expense.name} className="rounded-2xl border border-gray-100 bg-white p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{expense.name}</p>
                              <p className="text-xs text-gray-500">
                                {S.expenses.budgetLine}: ${expense.budget.toFixed(2)}
                              </p>
                            </div>
                            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                              {expense.payments.length} {S.expenses.paymentEntries}
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
                    {S.guests.cancel}
                  </button>
                  <button
                    type="button"
                    onClick={handleImportExpenses}
                    disabled={isImportingExpenses || expenseImportPreview.length === 0 || isParsingExpenseFile}
                    className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm text-white transition-colors ${!isImportingExpenses && expenseImportPreview.length > 0 && !isParsingExpenseFile
                      ? 'bg-[#E38E98] hover:bg-[#d87984]'
                      : 'cursor-not-allowed bg-gray-300 text-gray-500'
                      }`}
                  >
                    <ArrowUp className="h-4 w-4" />
                    {isImportingExpenses ? S.expenses.importing : S.expenses.importBtn}
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
                      {editingExpenseId ? S.expenses.modalEditTitle : S.expenses.modalAddTitle}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">{S.expenses.modalHint}</p>
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
                        setSuccess(S.expenses.expenseUpdateOk);
                      } else {
                        const confirmed = await requestConfirmation(S.expenses.confirmNewExpense);
                        if (!confirmed) return;

                        const created = await apiClient.createExpense(eventId, {
                          name: expenseName.trim(),
                          budget: budgetValue,
                          note: expenseNote.trim() || '-',
                          payments: paymentsPayload,
                        });
                        const mapped = mapExpenseToRow(created);
                        setExpenseRows((prev) => [mapped, ...prev]);
                        setSuccess(S.expenses.expenseAddOk);
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
                      setError(extractApiErrorMessage(saveError) || S.expenses.expenseSaveFail);
                    }
                  }}
                  className="flex-1 space-y-4 overflow-y-auto pr-1"
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-sm text-gray-700">
                        {S.expenses.nameRequired}
                        <RequiredStar />
                      </label>
                      <Input
                        value={expenseName}
                        onChange={(event) => setExpenseName(event.target.value)}
                        placeholder={S.expenses.namePh}
                        className="h-11 rounded-xl border-gray-200"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm text-gray-700">
                        {S.expenses.budgetRequired} <RequiredStar />
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
                          placeholder={S.expenses.amountPh}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-sm text-gray-500">{S.expenses.noteOptional}</label>
                      <textarea
                        value={expenseNote}
                        onChange={(event) => setExpenseNote(event.target.value)}
                        rows={3}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-300"
                        placeholder={S.guests.notePh}
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-700">{S.expenses.paymentsSection}</p>
                      <button
                        type="button"
                        onClick={addExpensePayment}
                        className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        {S.expenses.addPayment}
                      </button>
                    </div>
                    {expensePayments.length === 0 ? (
                      <div className="mt-3 flex min-h-[120px] items-center justify-center rounded-2xl border border-gray-200 bg-white px-6 text-center text-sm text-gray-500">
                        {S.expenses.noPaymentsHint}
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
                                      {payment.description.trim() || `${S.expenses.paymentFallback} #${index + 1}`}
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
                                      {S.expenses.payForLabel}
                                      <RequiredStar />
                                    </label>
                                    <Input
                                      value={payment.description}
                                      onChange={(event) =>
                                        updateExpensePayment(payment.id, { description: event.target.value })
                                      }
                                      placeholder={S.expenses.payDescriptionPh}
                                      className={`h-11 rounded-xl ${isDescriptionEmpty ? 'border-red-400 focus-visible:border-red-500' : 'border-gray-200'
                                        }`}
                                    />
                                  </div>

                                  <div className="space-y-1.5">
                                    <label className="text-sm text-gray-700">
                                      {S.expenses.payAmountLabel}
                                      <RequiredStar />
                                    </label>
                                    <div
                                      className={`flex h-12 items-center rounded-xl border px-3 ${isAmountEmpty ? 'border-red-400' : 'border-gray-200'
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
                                    <label className="text-sm text-gray-500">{S.expenses.payNoteOptional}</label>
                                    <textarea
                                      value={payment.note}
                                      onChange={(event) => updateExpensePayment(payment.id, { note: event.target.value })}
                                      rows={3}
                                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-300"
                                      placeholder={S.expenses.payNotePh}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        <div className="flex justify-end text-sm font-medium text-gray-700">
                          {S.expenses.paymentTotalLabel}: ${formatPaymentTotal(paymentTotal)}
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
                      {S.guests.cancel}
                    </button>
                    <button
                      type="submit"
                      disabled={!isExpenseFormReady}
                      className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm text-white transition-colors ${isExpenseFormReady
                        ? 'bg-[#C52133] hover:bg-[#aa1b2a]'
                        : 'cursor-not-allowed bg-gray-300 text-gray-500'
                        }`}
                    >
                      <Check className="h-4 w-4" />
                      {editingExpenseId ? S.expenses.expenseSaveBtn : S.guests.create}
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
      default:
        return renderGeneralTab();
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-6 font-khmer-body">
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={Assets.loadingMascot}
            alt="Loading mascot"
            className="mx-auto h-44 w-auto object-contain sm:h-52"
          />
          <span className="loader mt-4" aria-hidden="true" />
          <p className="mt-5 font-khmer-heading text-4xl text-slate-900 sm:text-5xl">
            {S.layout.loadingTitle}
          </p>
          <p className="mt-3 text-sm text-slate-500 sm:text-base">
            {S.layout.loadingSub}
          </p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center font-khmer-body">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">{S.layout.notFoundTitle}</h1>
          <Link href="/dashboard" className="mt-4 inline-block text-red-600">
            {S.layout.notFoundLink}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-khmer-body dark:bg-slate-950 dark:text-slate-100">
      <div className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto max-w-[1400px] px-2 py-3 sm:px-6 sm:py-3.5 lg:px-8">
          <h1 className="sr-only font-khmer-body text-[1.7rem] font-semibold leading-[1.2] tracking-tight text-gray-900 dark:text-slate-100 sm:font-khmer-heading sm:text-3xl sm:leading-tight">
            {event.title}
          </h1>
          <div className="flex items-center justify-between gap-3">
            <Link href="/dashboard">
              <Button variant="outline" className="border-gray-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {S.layout.back}
              </Button>
            </Link>
            <div className="flex shrink-0 items-center gap-2">
              <DashboardLanguageThemeControls />
              <Link
                href={externalPreviewPath}
                target="_blank"
                className="rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                aria-label={S.layout.viewInvitationAria}
              >
                <ExternalLink className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>

        {/*
          Change this to 'minimal' if you want monochrome tabs.
          Available presets: 'glass' | 'minimal'
        */}
        {(() => {
          const tabStylePreset: 'glass' | 'minimal' = 'glass';
          const navClassName =
            tabStylePreset === 'glass'
              ? 'relative inline-flex min-w-max items-center gap-2 overflow-hidden rounded-2xl border border-white/60 bg-white/50 p-2 shadow-lg shadow-slate-900/5 backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-900/95'
              : 'inline-flex min-w-max items-center gap-2 rounded-2xl border border-gray-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900';
          const activeTabClassName =
            tabStylePreset === 'glass'
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25 ring-1 ring-emerald-300/50 dark:bg-emerald-500 dark:text-white'
              : 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900';
          const inactiveTabClassName =
            tabStylePreset === 'glass'
              ? 'text-slate-600 hover:bg-white/70 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white';
          const activeIconClassName = tabStylePreset === 'glass' ? 'h-4 w-4 text-white' : 'h-4 w-4 text-white dark:text-slate-900';
          const inactiveIconClassName =
            tabStylePreset === 'glass' ? 'h-4 w-4 text-slate-500 dark:text-slate-300' : 'h-4 w-4 text-gray-500 dark:text-slate-400';

          return (
            <div className="mx-auto max-w-[1400px] overflow-x-auto px-2 pb-3 sm:px-6 lg:px-8">
              <nav
                className={navClassName}
                onMouseEnter={() => setIsTabNavHovered(true)}
                onMouseLeave={() => setIsTabNavHovered(false)}
                onMouseMove={handleTabNavMouseMove}
              >
                {tabStylePreset === 'glass' && (
                  <motion.div
                    aria-hidden="true"
                    className="pointer-events-none absolute left-0 top-0 h-60 w-60 rounded-full bg-gradient-to-br from-white/70 via-emerald-200/45 to-lime-200/35 blur-3xl dark:from-emerald-500/20 dark:via-cyan-500/15 dark:to-slate-500/20"
                    style={{
                      x: tabNavGlowSmoothX,
                      y: tabNavGlowSmoothY,
                      opacity: isTabNavHovered ? 1 : 0,
                    }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                  />
                )}
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
                        updateEventPageQuery({
                          tab: tab.id,
                          page: tab.id === 'guests' ? String(guestPage) : null,
                        });
                      }}
                      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 transition-all duration-200 ${isActive
                        ? 'scale-[1.03] text-sm font-semibold'
                        : 'text-sm font-medium'
                        } ${isActive
                          ? activeTabClassName
                          : inactiveTabClassName
                        }`}
                    >
                      <Icon className={isActive ? activeIconClassName : inactiveIconClassName} />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          );
        })()}
      </div>

      <main className="mx-auto max-w-[1400px] px-2 pt-4 pb-8 sm:px-6 lg:px-8">
        {(error || success) && (
          <div ref={feedbackRef}>
            <MessageCard
              text={error || success}
              tone={error ? 'error' : 'success'}
              onClose={() => {
                setError('');
                setSuccess('');
              }}
              className="mb-4 p-4"
            />
          </div>
        )}

        {renderTabContent()}
      </main>

      <AnimatePresence>
        {guestGreetingPreview !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[160] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={() => setGuestGreetingPreview(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  {isKhmer ? 'សារជូនពរពេញ' : 'Full message'}
                </h3>
                <button
                  type="button"
                  onClick={() => setGuestGreetingPreview(null)}
                  className="rounded-full border border-gray-200 p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                  aria-label="Close message preview"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="max-h-[55vh] overflow-y-auto whitespace-pre-wrap break-words rounded-2xl bg-gray-50 p-4 text-sm leading-relaxed text-gray-700">
                {guestGreetingPreview}
              </p>
            </motion.div>
          </motion.div>
        )}

        {guestNotePreview !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[160] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={() => setGuestNotePreview(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  {isKhmer ? 'កំណត់ចំណាំពេញ' : 'Full note'}
                </h3>
                <button
                  type="button"
                  onClick={() => setGuestNotePreview(null)}
                  className="rounded-full border border-gray-200 p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                  aria-label="Close note preview"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="max-h-[55vh] overflow-y-auto whitespace-pre-wrap break-words rounded-2xl bg-gray-50 p-4 text-sm leading-relaxed text-gray-700">
                {guestNotePreview}
              </p>
            </motion.div>
          </motion.div>
        )}

        {expenseDescriptionPreview !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[160] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={() => setExpenseDescriptionPreview(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  {isKhmer ? 'ការពិពណ៌នាពេញ' : 'Full description'}
                </h3>
                <button
                  type="button"
                  onClick={() => setExpenseDescriptionPreview(null)}
                  className="rounded-full border border-gray-200 p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                  aria-label="Close description preview"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="max-h-[55vh] overflow-y-auto whitespace-pre-wrap break-words rounded-2xl bg-gray-50 p-4 text-sm leading-relaxed text-gray-700">
                {expenseDescriptionPreview}
              </p>
            </motion.div>
          </motion.div>
        )}

        {confirmDialog.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={() => {
              confirmDialog.resolve?.(false);
              setConfirmDialog({ isOpen: false, message: '' });
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  <Info className="h-5 w-5" />
                </div>
                <p className="pt-1 text-sm text-gray-700">{confirmDialog.message}</p>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="border-gray-200 text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    confirmDialog.resolve?.(false);
                    setConfirmDialog({ isOpen: false, message: '' });
                  }}
                >
                  {S.guests.cancel}
                </Button>
                <Button
                  type="button"
                  className="bg-[#C52133] text-white hover:bg-[#aa1b2a]"
                  onClick={() => {
                    confirmDialog.resolve?.(true);
                    setConfirmDialog({ isOpen: false, message: '' });
                  }}
                >
                  {S.notices.confirmAction}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <SupportContactFab />
    </div>
  );
}

export default withProtectedRoute(EventDetailPage);
