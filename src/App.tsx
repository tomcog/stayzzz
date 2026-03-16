import { useState, useEffect, useRef } from 'react';
import { Home, Calendar, RefreshCw, Search, XCircle, Share } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { BookingList } from './components/BookingList';
import { CalendarView } from './components/CalendarView';
import { AddBookingDialog } from './components/AddBookingDialog';
import { BookingDetailsSheet } from './components/BookingDetailsSheet';
import { ButtonFab } from './components/button-fab';
import { ButtonPrimary } from './components/button-primary';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from './utils/supabase/info';
import { calculateBookingStatus, getCurrentDatePacific, parseLocalDate } from './utils/dateUtils';
import { syncAirbnbCalendar } from './lib/syncAirbnb';
import { syncVrboCalendar } from './lib/syncVrbo';
import { getAppAlerts, type AppAlert } from './lib/appAlerts';
import { AlertsModal } from './components/AlertsModal';

export interface Booking {
  id: string;
  stay_type: 'guest' | 'owner' | 'service' | 'unresolved';
  guest_name: string;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'current' | 'completed';
  phone_number: string;
  booking_url: string;
  notes?: string;
  pool_heat?: 'not-asked' | 'undecided' | 'declined' | 'requested' | 'paid';
  airbnb_uid?: string;
  confirmation_code?: string;
  phone_last_four?: string;
  last_synced_at?: string;
  created_at?: string;
  updated_at?: string;
  service_requested?: string;
  provider_name?: string;
  provider_contact?: string;
  provider_url?: string;
  service_date?: string;
  service_time?: string;
  contact_phone?: string;
  hidden?: boolean;
  total_rent?: number;
}

const API_URL = `https://${projectId}.supabase.co/rest/v1`;

export default function App() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const openSearch = () => {
    setIsSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const filteredBookings = searchQuery.trim()
    ? bookings.filter(b => b.guest_name?.toLowerCase().includes(searchQuery.toLowerCase()))
    : bookings;

  const headers = {
    'apikey': publicAnonKey,
    'Authorization': `Bearer ${publicAnonKey}`,
    'Content-Type': 'application/json',
  };

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/rentals?select=*&hidden=not.is.true`, { headers });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch bookings: ${response.status} ${errorText}`);
      }

      const fetchedBookings: Booking[] = await response.json();

      const updatedBookings = fetchedBookings.map((booking) => ({
        ...booking,
        status: calculateBookingStatus(booking.start_date, booking.end_date),
        pool_heat: booking.pool_heat || 'not-asked',
      }));

      setBookings(updatedBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const syncAndFetch = async () => {
    await Promise.allSettled([
      syncAirbnbCalendar().catch(e => console.error('Airbnb sync failed:', e)),
      syncVrboCalendar().catch(e => console.error('VRBO sync failed:', e)),
    ]);
    await fetchBookings();
  };

  const [pendingAlerts, setPendingAlerts] = useState<AppAlert[]>([]);
  const hasCheckedAlerts = useRef(false);
  useEffect(() => {
    if (!isLoading && bookings.length > 0 && !hasCheckedAlerts.current) {
      hasCheckedAlerts.current = true;
      const alerts = getAppAlerts(bookings);
      if (alerts.length > 0) setPendingAlerts(alerts);
    }
  }, [isLoading, bookings]);

  useEffect(() => { syncAndFetch(); }, []);

  useEffect(() => {
    let link = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'apple-touch-icon';
      document.head.appendChild(link);
    }
    let viewport = document.querySelector("meta[name='viewport']") as HTMLMetaElement | null;
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }
    viewport.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no';
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const [airbnbResult, vrboResult] = await Promise.all([
        syncAirbnbCalendar().catch(() => ({ inserted: 0, errors: [] })),
        syncVrboCalendar().catch(() => ({ inserted: 0, errors: [] })),
      ]);
      await fetchBookings();
      const totalNew = airbnbResult.inserted + vrboResult.inserted;
      void totalNew;
    } catch (error) {
      console.error('Sync failed:', error);
      await fetchBookings();
      toast.error('Sync failed, showing cached bookings');
    }
    setIsRefreshing(false);
  };

  useEffect(() => {
    const updateStatuses = () => {
      setBookings(prev =>
        prev.map(booking => {
          const newStatus = calculateBookingStatus(booking.start_date, booking.end_date);
          return newStatus !== booking.status
            ? { ...booking, status: newStatus, pool_heat: booking.pool_heat || 'not-asked' }
            : { ...booking, pool_heat: booking.pool_heat || 'not-asked' };
        })
      );
    };
    updateStatuses();
    const interval = setInterval(updateStatuses, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAddBooking = async (booking: Omit<Booking, 'id' | 'status'>) => {
    const status = calculateBookingStatus(booking.start_date, booking.end_date);
    const bookingData = {
      ...booking,
      airbnb_uid: `manual_${crypto.randomUUID()}`,
    };

    const response = await fetch(`${API_URL}/rentals`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify(bookingData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create booking: ${errorText}`);
    }
    const [newBooking] = await response.json();
    setBookings(prev => [...prev, { ...newBooking, status, pool_heat: newBooking.pool_heat || 'not-asked' }]);
  };

  const handleUpdateBooking = async (updatedBooking: Booking) => {
    const bookingWithDefaults = { ...updatedBooking, pool_heat: updatedBooking.pool_heat || 'not-asked' };
    const { id, status, ...updateData } = bookingWithDefaults;

    const response = await fetch(`${API_URL}/rentals?id=eq.${id}`, {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update booking: ${response.status} ${errorText}`);
    }

    if (bookingWithDefaults.hidden) {
      setBookings(prev => prev.filter(b => b.id !== bookingWithDefaults.id));
    } else {
      setBookings(prev => prev.map(b => b.id === bookingWithDefaults.id ? bookingWithDefaults : b));
      if (selectedBooking?.id === bookingWithDefaults.id) setSelectedBooking(bookingWithDefaults);
    }
  };

  const handleDeleteBooking = async (id: string) => {
    const response = await fetch(`${API_URL}/rentals?id=eq.${id}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) throw new Error('Failed to delete booking');
    setBookings(prev => prev.filter(b => b.id !== id));
    setIsDetailsSheetOpen(false);
  };

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsDetailsSheetOpen(true);
  };

  const handleShare = () => {
    const upcoming = bookings
      .filter(b => b.status === 'upcoming' && b.stay_type === 'guest' && !b.hidden)
      .sort((a, b) => a.start_date.localeCompare(b.start_date));

    const formatStartDate = (dateStr: string) => {
      const d = parseLocalDate(dateStr);
      const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
      const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${weekday} ${monthDay}`;
    };

    const formatEndDate = (dateStr: string) =>
      parseLocalDate(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const formatGuestInfo = (b: Booking) =>
      `${b.guest_name}${b.phone_number ? ` ${b.phone_number}` : ''} staying ${formatStartDate(b.start_date)} to ${formatEndDate(b.end_date)}`;

    let body = '';
    if (upcoming.length === 0) {
      body = 'No upcoming guests scheduled.';
    } else if (upcoming.length === 1) {
      body = `Next guest at 1935 E. Andreas is ${formatGuestInfo(upcoming[0])}.`;
    } else {
      body = `Next guest at 1935 E. Andreas is ${formatGuestInfo(upcoming[0])}, followed by ${formatGuestInfo(upcoming[1])}.`;
    }
    body += ' Latest info at https://stayzzz.vercel.app';

    const recipients = '4157864282,4422184858,7609698962';
    const smsUrl = `sms:/open?addresses=${recipients}&body=${encodeURIComponent(body)}`;
    window.location.href = smsUrl;
  };

  return (
    <div className="min-h-screen bg-[#eeeeee] pb-20">
      <Toaster />

      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Home className="w-6 h-6" style={{ color: '#000000' }} />
              <h1>Andreas Palms</h1>
            </div>
            <ButtonPrimary onClick={() => setIsAddDialogOpen(true)}>
              Add Booking
            </ButtonPrimary>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-gray-100 min-h-screen px-[0px] py-[16px] p-[16px] flex justify-center max-w-[800px] mx-auto">
        <Tabs defaultValue="list" className="w-full">
          <div className="text-center mt-[0px] mr-[0px] mb-[8px] ml-[0px] flex items-center justify-center gap-2">
            <span className="text-gray-600 text-[18px] font-medium">
              Today is {new Date().toLocaleDateString('en-US', {
                timeZone: 'America/Los_Angeles',
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-4 w-[85%] mx-auto">
            {isSearchOpen ? (
              <div className="flex items-center bg-white rounded-full px-3 h-[40px] flex-1 gap-2 shadow-sm">
                <button onClick={closeSearch} className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close search">
                  <XCircle className="w-5 h-5" />
                </button>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by guest name..."
                  className="flex-1 bg-transparent outline-none text-[16px] text-gray-800 placeholder:text-gray-400"
                />
              </div>
            ) : (
              <>
                <button
                  onClick={openSearch}
                  className="h-[40px] w-[40px] rounded-full bg-white flex items-center justify-center shadow-sm shrink-0 hover:bg-gray-50 transition-colors"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5 text-gray-600" />
                </button>
                <TabsList className="grid grid-cols-2 flex-1 bg-[#E5E5E5] h-[40px]">
                  <TabsTrigger value="list" className="gap-2">
                    <Home className="w-4 h-4" />
                    Bookings
                  </TabsTrigger>
                  <TabsTrigger value="calendar" className="gap-2">
                    <Calendar className="w-4 h-4" />
                    Calendar
                  </TabsTrigger>
                </TabsList>
                <button
                  onClick={handleShare}
                  className="h-[40px] w-[40px] rounded-full bg-white flex items-center justify-center shadow-sm shrink-0 hover:bg-gray-50 transition-colors"
                  aria-label="Share upcoming guests"
                >
                  <Share className="w-5 h-5 text-gray-600" />
                </button>
              </>
            )}
          </div>

          {isSearchOpen ? (
            <div className="mt-0">
              {filteredBookings.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No guests found matching "{searchQuery}"</div>
              ) : (
                <BookingList bookings={filteredBookings} onBookingClick={handleBookingClick} onUpdateBooking={handleUpdateBooking} />
              )}
            </div>
          ) : (
            <>
              <TabsContent value="list" className="mt-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-gray-500">Loading bookings...</div>
                  </div>
                ) : (
                  <BookingList bookings={bookings} onBookingClick={handleBookingClick} onUpdateBooking={handleUpdateBooking} />
                )}
              </TabsContent>

              <TabsContent value="calendar" className="mt-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-gray-500">Loading bookings...</div>
                  </div>
                ) : (
                  <CalendarView bookings={bookings} onBookingClick={handleBookingClick} />
                )}
              </TabsContent>
            </>
          )}
          {(() => {
            const currentYear = new Date().getFullYear();
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const qualifyingStays = bookings.filter(b => {
              if (b.stay_type !== 'guest' || b.hidden) return false;
              const end = new Date(b.end_date);
              end.setHours(0, 0, 0, 0);
              if (end < today) return false;
              const start = new Date(b.start_date);
              return start.getFullYear() === currentYear;
            });
            const totalNights = qualifyingStays.reduce((sum, b) => {
              return sum + Math.ceil((new Date(b.end_date).getTime() - new Date(b.start_date).getTime()) / (1000 * 60 * 60 * 24));
            }, 0);
            return (
              <p className="text-center text-gray-400 text-[12px] mt-4 mb-2">
                {qualifyingStays.length} guest {qualifyingStays.length === 1 ? 'stay' : 'stays'}, totalling {totalNights} {totalNights === 1 ? 'night' : 'nights'} remaining in {currentYear}              </p>
            );
          })()}
        </Tabs>
      </div>

      {pendingAlerts.length > 0 && (
        <AlertsModal alerts={pendingAlerts} onClose={() => setPendingAlerts([])} />
      )}

      <AddBookingDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onAddBooking={handleAddBooking} />

      {selectedBooking && (
        <BookingDetailsSheet
          open={isDetailsSheetOpen}
          onOpenChange={setIsDetailsSheetOpen}
          booking={selectedBooking}
          onUpdateBooking={handleUpdateBooking}
          onDeleteBooking={handleDeleteBooking}
        />
      )}

      <ButtonFab onClick={handleRefresh} disabled={isRefreshing} icon={RefreshCw} isAnimating={isRefreshing} label="refresh_booking" />
    </div>
  );
}
