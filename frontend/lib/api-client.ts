import axios, { AxiosInstance } from 'axios';

function getApiBaseUrl() {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Keep local dev working for both localhost and LAN device testing.
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:3001`;
  }

  return 'http://localhost:3001';
}

interface AuthTokens {
  access_token: string;
}

type UserRole = 'CUSTOMER' | 'USER' | 'ADMIN';

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  createdAt: string;
}

interface Event {
  id: string;
  title: string;
  slug?: string;
  type: 'WEDDING' | 'BIRTHDAY' | 'CEREMONY' | 'HOUSEWARMING' | 'FUNERAL' | 'OTHER';
  date: string;
  location: string;
  address?: string;
  musicUrl?: string;
  eventTypeId?: string;
  templateId?: string;
  guestCount?: number;
  eventType?: EventType;
  template?: Template;
  googleMapLink?: string;
  description?: string;
  coverImage?: string;
  khqrDollar?: string;
  khqrRiel?: string;
  metadata?: Record<string, unknown>;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface Guest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  group?: string;
  tag?: string;
  greetingMessage?: string;
  note?: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  rsvpStatus?: 'PENDING' | 'CONFIRMED' | 'DECLINED';
  eventId: string;
  createdAt: string;
  updatedAt: string;
}

interface EventType {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
}

interface Template {
  id: string;
  name: string;
  thumbnail?: string;
  previewUrl?: string;
  eventTypeId: string;
  config?: Record<string, unknown>;
  eventType?: EventType;
}

interface EventStats {
  totalGuests: number;
  confirmed?: number;
  accepted?: number;
  declined: number;
  pending: number;
}

interface Gift {
  id: string;
  eventId: string;
  guestId: string;
  paymentType: 'CASH' | 'KHQR';
  currencyType: 'USD' | 'KHR';
  amount: number;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  guest?: {
    id: string;
    name: string;
    phone?: string | null;
  };
}

interface ExpensePayment {
  id: string;
  expenseId: string;
  description: string;
  amount: number;
  note?: string | null;
  paidAt: string;
  createdAt: string;
  updatedAt: string;
}

interface Expense {
  id: string;
  eventId: string;
  name: string;
  budget: number;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  payments: ExpensePayment[];
}

interface EventsResponse {
  data?: Event[];
  total?: number;
}

class APIClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: getApiBaseUrl(),
      withCredentials: true,
    });

    // Load token from localStorage on initialization
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('auth_token');
      if (stored) {
        this.token = stored;
      }
    }

    // Interceptor to add token to requests
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Clear token and redirect to login
          this.clearToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  // Auth endpoints
  async register(email: string, name: string, password: string, phone?: string): Promise<AuthTokens> {
    const { data } = await this.client.post('/api/auth/register', {
      email,
      name,
      password,
      phone,
    });
    this.setToken(data.access_token);
    return data;
  }

  async login(email: string, password: string): Promise<AuthTokens> {
    const { data } = await this.client.post('/api/auth/login', {
      email,
      password,
    });
    this.setToken(data.access_token);
    return data;
  }

  async googleLogin(credential: string): Promise<AuthTokens> {
    const { data } = await this.client.post('/api/auth/google', {
      credential,
    });
    this.setToken(data.access_token);
    return data;
  }

  // Users endpoints
  async getCurrentUser(): Promise<User> {
    const { data } = await this.client.get('/api/users/me');
    return data;
  }

  async getUser(id: string): Promise<User> {
    const { data } = await this.client.get(`/api/users/${id}`);
    return data;
  }

  async updateCurrentUser(updates: { name?: string; phone?: string; avatarUrl?: string }): Promise<User> {
    const { data } = await this.client.patch('/api/users/me', updates);
    return data;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const { data } = await this.client.patch('/api/users/me/password', {
      currentPassword,
      newPassword,
    });

    return data;
  }

  async getUsers(skip: number = 0, take: number = 50): Promise<User[]> {
    const { data } = await this.client.get('/api/users', {
      params: { skip, take },
    });

    return Array.isArray(data) ? data : [];
  }

  async updateUserRole(userId: string, role: 'ADMIN' | 'USER' | 'CUSTOMER'): Promise<User> {
    const { data } = await this.client.patch(`/api/users/${userId}/role`, {
      role,
    });

    return data;
  }

  async adminResetUserPassword(userId: string, newPassword: string): Promise<{ message: string }> {
    const { data } = await this.client.patch(`/api/users/${userId}/password`, {
      newPassword,
    });

    return data;
  }

  async uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await this.client.post('/api/uploads', formData);
    return data.url;
  }

  // Events endpoints
  async createEvent(
    title: string,
    type: string,
    date: string,
    location: string,
    description?: string,
    coverImage?: string,
    metadata?: Record<string, unknown>,
    googleMapLink?: string,
    khqrDollar?: string,
    khqrRiel?: string,
    eventTypeId?: string,
    templateId?: string,
    address?: string,
    musicUrl?: string,
    slug?: string
  ): Promise<Event> {
    const { data } = await this.client.post('/api/events', {
      title,
      type,
      slug,
      date,
      location,
      address,
      musicUrl,
      description,
      coverImage,
      metadata,
      googleMapLink,
      khqrDollar,
      khqrRiel,
      eventTypeId,
      templateId,
    });
    return data;
  }

  async getEvents(page: number = 1, limit: number = 10): Promise<Event[]> {
    const skip = (page - 1) * limit;
    const { data } = await this.client.get<Event[] | EventsResponse>('/api/events', {
      params: { skip, take: limit },
    });

    if (Array.isArray(data)) {
      return data;
    }

    return Array.isArray(data?.data) ? data.data : [];
  }

  async getEvent(id: string): Promise<Event> {
    const { data } = await this.client.get(`/api/events/${id}`);
    return data;
  }

  async getPublicEvent(id: string): Promise<Event> {
    const { data } = await this.client.get(`/api/events/public/${id}`);
    return data;
  }

  async getPublicEventBySlug(slug: string): Promise<Event> {
    const { data } = await this.client.get(`/api/events/public/slug/${slug}`);
    return data;
  }

  async updateEvent(
    id: string,
    updates: Partial<Omit<Event, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<Event> {
    const { data } = await this.client.put(`/api/events/${id}`, updates);
    return data;
  }

  async deleteEvent(id: string): Promise<void> {
    await this.client.delete(`/api/events/${id}`);
  }

  async getEventStats(id: string): Promise<EventStats> {
    const { data } = await this.client.get(`/api/events/${id}/stats`);
    return data;
  }

  // Guests endpoints
  async createGuest(
    eventId: string,
    name: string,
    email?: string,
    phone?: string,
    options?: { group?: string; tag?: string; greetingMessage?: string; note?: string },
  ): Promise<Guest> {
    const { data } = await this.client.post(`/api/guests/${eventId}`, {
      name,
      email,
      phone,
      group: options?.group,
      tag: options?.tag,
      greetingMessage: options?.greetingMessage,
      note: options?.note,
    });
    return data;
  }

  async getEventGuests(eventId: string, skip: number = 0, take: number = 50): Promise<Guest[]> {
    const { data } = await this.client.get(`/api/guests/event/${eventId}`, {
      params: { skip, take },
    });
    return data;
  }

  async getGuest(id: string): Promise<Guest> {
    const { data } = await this.client.get(`/api/guests/${id}`);
    return data;
  }

  async updateGuestStatus(guestId: string, status: 'ACCEPTED' | 'DECLINED' | 'PENDING'): Promise<Guest> {
    const { data } = await this.client.put(`/api/guests/${guestId}/status`, {
      status,
    });
    return data;
  }

  async updateGuest(
    guestId: string,
    updates: {
      name?: string;
      phone?: string;
      group?: string;
      tag?: string;
      greetingMessage?: string;
      note?: string;
      adultCount?: number;
      childrenCount?: number;
    },
  ): Promise<Guest> {
    const { data } = await this.client.put(`/api/guests/${guestId}`, updates);
    return data;
  }

  async deleteGuest(id: string): Promise<void> {
    await this.client.delete(`/api/guests/${id}`);
  }

  async createGift(
    eventId: string,
    payload: {
      guestId: string;
      paymentType: 'CASH' | 'KHQR';
      currencyType: 'USD' | 'KHR';
      amount: number;
      note?: string;
    },
  ): Promise<Gift> {
    const { data } = await this.client.post(`/api/gifts/${eventId}`, payload);
    return data;
  }

  async getEventGifts(eventId: string): Promise<Gift[]> {
    const { data } = await this.client.get(`/api/gifts/event/${eventId}`);
    return Array.isArray(data) ? data : [];
  }

  async updateGift(
    giftId: string,
    payload: {
      guestId?: string;
      paymentType?: 'CASH' | 'KHQR';
      currencyType?: 'USD' | 'KHR';
      amount?: number;
      note?: string;
    },
  ): Promise<Gift> {
    const { data } = await this.client.put(`/api/gifts/${giftId}`, payload);
    return data;
  }

  async deleteGift(giftId: string): Promise<void> {
    await this.client.delete(`/api/gifts/${giftId}`);
  }

  async createExpense(
    eventId: string,
    payload: {
      name: string;
      budget: number;
      note?: string;
      payments?: Array<{
        description: string;
        amount: number;
        note?: string;
        paidAt?: string;
      }>;
    },
  ): Promise<Expense> {
    const { data } = await this.client.post(`/api/expenses/event/${eventId}`, payload);
    return data;
  }

  async getEventExpenses(eventId: string): Promise<Expense[]> {
    const { data } = await this.client.get(`/api/expenses/event/${eventId}`);
    return Array.isArray(data) ? data : [];
  }

  async updateExpense(
    expenseId: string,
    payload: {
      name?: string;
      budget?: number;
      note?: string;
      payments?: Array<{
        description?: string;
        amount?: number;
        note?: string;
        paidAt?: string;
      }>;
    },
  ): Promise<Expense> {
    const { data } = await this.client.put(`/api/expenses/${expenseId}`, payload);
    return data;
  }

  async deleteExpense(expenseId: string): Promise<void> {
    await this.client.delete(`/api/expenses/${expenseId}`);
  }

  async submitPublicRsvpBySlug(
    slug: string,
    payload: {
      name: string;
      phone?: string;
      guestId?: string;
      rsvpStatus: 'PENDING' | 'CONFIRMED' | 'DECLINED';
      adultCount?: number;
      childrenCount?: number;
      greetingMessage?: string;
    }
  ): Promise<Guest> {
    const { data } = await this.client.post(`/api/guests/public/rsvp/${slug}`, payload);
    return data;
  }

  async getPublicGuestBySlug(
    slug: string,
    guestId: string,
  ): Promise<Pick<Guest, 'id' | 'eventId' | 'name' | 'phone' | 'rsvpStatus' | 'greetingMessage'> & { adultCount?: number; childrenCount?: number; updatedAt?: string }> {
    const { data } = await this.client.get(`/api/guests/public/by-slug/${slug}/${guestId}`);
    return data;
  }

  async getEventTypes(): Promise<EventType[]> {
    const { data } = await this.client.get('/api/event-types');
    return Array.isArray(data) ? data : [];
  }

  async getTemplates(eventTypeId?: string): Promise<Template[]> {
    const { data } = await this.client.get('/api/templates', {
      params: eventTypeId ? { eventTypeId } : {},
    });
    return Array.isArray(data) ? data : [];
  }

  // Public endpoints (no auth required)
  async getGuestByInvitationLink(uniqueLink: string): Promise<{ guest: Guest; event: Event }> {
    const { data } = await this.client.get(`/api/guests/invitation/${uniqueLink}`);
    return data;
  }
}

export const apiClient = new APIClient();
export type { AuthTokens, User, Event, Guest, Gift, Expense, ExpensePayment, EventStats, UserRole, EventType, Template };
