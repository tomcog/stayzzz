import { useState } from 'react';
import { Sheet, SheetContent, SheetTitle } from './ui/sheet';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { CalendarIcon, X, Save, SaveOff } from 'lucide-react';
import { Calendar as CalendarLucide } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Booking } from '../App';
import { cn } from './ui/utils';
import { POOL_HEAT_STATUSES } from '../utils/statusConfig';

interface AddBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddBooking: (booking: Omit<Booking, 'id' | 'status'>) => Promise<void>;
}

const emptyForm = {
  guest_name: '',
  phone_number: '',
  booking_url: '',
  notes: '',
  pool_heat: 'not-asked' as Booking['pool_heat'],
  service_requested: '',
  provider_name: '',
  provider_contact: '',
  provider_url: '',
  service_date: '',
  service_time: '',
  contact_phone: '',
};

export function AddBookingDialog({ open, onOpenChange, onAddBooking }: AddBookingDialogProps) {
  const [bookingType, setBookingType] = useState<'guest' | 'owner' | 'service'>('guest');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [formData, setFormData] = useState(emptyForm);

  const resetForm = () => { setBookingType('guest'); setDateRange(undefined); setFormData(emptyForm); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (bookingType === 'service') {
      if (!formData.service_requested) { toast.error('Please enter the service requested'); return; }
      if (!dateRange?.from || !dateRange?.to) { toast.error('Please select dates'); return; }
    } else {
      if (!formData.guest_name) { toast.error(bookingType === 'guest' ? 'Please enter the guest name' : 'Please enter the owner name'); return; }
      if (!dateRange?.from || !dateRange?.to) { toast.error('Please select check-in and check-out dates'); return; }
    }

    try {
      await onAddBooking({
        stay_type: bookingType,
        guest_name: bookingType === 'service' ? (formData.provider_name || formData.service_requested) : formData.guest_name,
        start_date: format(dateRange!.from!, 'yyyy-MM-dd'),
        end_date: format(dateRange!.to!, 'yyyy-MM-dd'),
        phone_number: formData.phone_number,
        booking_url: formData.booking_url,
        notes: formData.notes,
        pool_heat: formData.pool_heat,
        service_requested: formData.service_requested || undefined,
        provider_name: formData.provider_name || undefined,
        provider_contact: formData.provider_contact || undefined,
        provider_url: formData.provider_url || undefined,
        service_date: formData.service_date || undefined,
        service_time: formData.service_time || undefined,
        contact_phone: formData.contact_phone || undefined,
      });
      resetForm();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add booking');
    }
  };

  const namePlaceholder = bookingType === 'guest' ? 'Guest name' : bookingType === 'owner' ? 'Owner name' : 'Provider name';
  const nameLabel = bookingType === 'guest' ? 'Guest Name *' : bookingType === 'owner' ? 'Owner Name *' : 'Provider Name';

  const hasName = bookingType === 'service' ? !!formData.service_requested : !!formData.guest_name;
  const hasDates = !!dateRange?.from && !!dateRange?.to;
  const canSave = hasName && hasDates;
  const hasAnyChanges = hasName || hasDates || JSON.stringify(formData) !== JSON.stringify(emptyForm);

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <SheetContent side="bottom" className="h-screen overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-0" aria-describedby={undefined}>
        <SheetTitle className="sr-only">Add New Booking</SheetTitle>

        <form onSubmit={handleSubmit}>
          <div className="px-4 py-6 flex flex-col gap-4">

            {/* Header */}
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => { resetForm(); onOpenChange(false); }} className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${hasAnyChanges ? 'bg-[#EE5A7B]/10 hover:bg-[#EE5A7B]/20' : 'bg-gray-100 hover:bg-gray-200'}`}>
                {hasAnyChanges
                  ? <SaveOff className="w-4 h-4 text-[#EE5A7B]" />
                  : <X className="w-4 h-4 text-gray-500" />
                }
              </button>
              <h2 className="text-[18px] font-semibold uppercase tracking-wide m-0 flex-1">Add New Booking</h2>
              {canSave && (
                <button
                  type="submit"
                  className="shrink-0 w-8 h-8 rounded-full bg-cta/10 flex items-center justify-center hover:bg-cta/20 transition-colors"
                >
                  <Save className="w-4 h-4 text-cta" />
                </button>
              )}
            </div>

            {/* Row 1: Type + Name */}
            <div className="flex gap-4 items-end">
              <div className="w-[130px] shrink-0">
                <Label htmlFor="booking-type" className="text-[14px]">Type</Label>
                <Select value={bookingType} onValueChange={(v) => { setBookingType(v as 'guest' | 'owner' | 'service'); setFormData(emptyForm); }}>
                  <SelectTrigger id="booking-type" variant="underline" className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="guest">Guest</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label htmlFor="primaryName" className="text-[14px]">{nameLabel}</Label>
                <Input
                  id="primaryName"
                  variant="underline"
                  value={bookingType === 'service' ? formData.provider_name : formData.guest_name}
                  onChange={(e) => setFormData(bookingType === 'service'
                    ? { ...formData, provider_name: e.target.value }
                    : { ...formData, guest_name: e.target.value }
                  )}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Row 2: Stay Dates */}
            <div>
              <Label className="text-[14px]">Stay Dates *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal mt-1 h-9 text-[17px] bg-transparent border-0 border-b-2 border-gray-300 rounded-none shadow-none px-1 hover:bg-transparent", !dateRange && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    {dateRange?.from ? (
                      dateRange.to
                        ? <>{format(dateRange.from, "MMM d, yyyy")} – {format(dateRange.to, "MMM d, yyyy")}</>
                        : format(dateRange.from, "MMM d, yyyy")
                    ) : <span>Pick check-in and check-out dates</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
                </PopoverContent>
              </Popover>
            </div>

            {/* Guest-specific rows */}
            {bookingType === 'guest' && (
              <>
                {/* Row 3: Phone + Pool heat */}
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Label htmlFor="phone" className="text-[14px]">Phone</Label>
                    <Input id="phone" type="tel" variant="underline" value={formData.phone_number} onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })} className="mt-1" />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="poolHeat" className="text-[14px]">Pool heat</Label>
                    <Select value={formData.pool_heat} onValueChange={(v) => setFormData({ ...formData, pool_heat: v as Booking['pool_heat'] })}>
                      <SelectTrigger id="poolHeat" variant="underline" className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.values(POOL_HEAT_STATUSES).map((status) => (
                          <SelectItem key={status.code} value={status.code}>{status.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 4: Booking info */}
                <div>
                  <Label htmlFor="bookingUrl" className="text-[14px]">Booking info</Label>
                  <Input id="bookingUrl" type="url" variant="underline" value={formData.booking_url} onChange={(e) => setFormData({ ...formData, booking_url: e.target.value })} className="mt-1" />
                </div>
              </>
            )}

            {/* Owner-specific rows */}
            {bookingType === 'owner' && (
              <div>
                <Label htmlFor="ownerBookingUrl" className="text-[14px]">Booking info</Label>
                <Input id="ownerBookingUrl" type="url" variant="underline" value={formData.booking_url} onChange={(e) => setFormData({ ...formData, booking_url: e.target.value })} className="mt-1" />
              </div>
            )}

            {/* Service-specific rows */}
            {bookingType === 'service' && (
              <>
                <div>
                  <Label htmlFor="serviceRequested" className="text-[14px]">Service requested *</Label>
                  <Input id="serviceRequested" variant="underline" value={formData.service_requested} onChange={(e) => setFormData({ ...formData, service_requested: e.target.value })} placeholder="e.g., Pool cleaning, HVAC maintenance" className="mt-1" />
                </div>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Label htmlFor="providerContact" className="text-[14px]">Provider contact</Label>
                    <Input id="providerContact" type="tel" variant="underline" value={formData.provider_contact} onChange={(e) => setFormData({ ...formData, provider_contact: e.target.value })} placeholder="Phone number" className="mt-1" />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="providerUrl" className="text-[14px]">Website</Label>
                    <Input id="providerUrl" type="url" variant="underline" value={formData.provider_url} onChange={(e) => setFormData({ ...formData, provider_url: e.target.value })} placeholder="https://..." className="mt-1" />
                  </div>
                </div>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Label htmlFor="serviceDate" className="text-[14px]">Service date</Label>
                    <div className="relative mt-1">
                      <label htmlFor="serviceDate" className="absolute left-1 top-1/2 -translate-y-1/2 cursor-pointer">
                        <CalendarLucide className="w-4 h-4 text-gray-400" />
                      </label>
                      <Input id="serviceDate" type="date" variant="underline" value={formData.service_date} onChange={(e) => setFormData({ ...formData, service_date: e.target.value })} className="pl-6" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="serviceTime" className="text-[14px]">Service time</Label>
                    <Input id="serviceTime" type="time" variant="underline" value={formData.service_time} onChange={(e) => setFormData({ ...formData, service_time: e.target.value })} className="mt-1" />
                  </div>
                </div>
              </>
            )}

            {/* Notes — all types */}
            <div>
              <Label htmlFor="notes" className="text-[14px]">Notes</Label>
              <Textarea id="notes" variant="underline" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} className="mt-1" />
            </div>
          </div>

        </form>
      </SheetContent>
    </Sheet>
  );
}
