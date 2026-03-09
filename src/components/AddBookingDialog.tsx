import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { CalendarIcon } from 'lucide-react';
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
      toast.success('Booking added successfully!');
      resetForm();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add booking');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto top-[5%] translate-y-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <DialogHeader className="text-left">
          <DialogTitle>Add New Booking</DialogTitle>
          <DialogDescription>Create a new guest, owner, or service booking for your rental property.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <Label htmlFor="booking-type">Booking type</Label>
            <Select value={bookingType} onValueChange={(v) => setBookingType(v as 'guest' | 'owner' | 'service')}>
              <SelectTrigger id="booking-type" className="mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="guest">Guest</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="service">Service</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {bookingType !== 'service' && (
            <div>
              <Label htmlFor="guestName">{bookingType === 'guest' ? 'Guest Name *' : 'Owner Name *'}</Label>
              <Input id="guestName" value={formData.guest_name} onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })} />
            </div>
          )}

          {bookingType === 'service' && (
            <>
              <div>
                <Label htmlFor="serviceRequested">Service requested *</Label>
                <Input id="serviceRequested" value={formData.service_requested} onChange={(e) => setFormData({ ...formData, service_requested: e.target.value })} placeholder="e.g., Pool cleaning, HVAC maintenance" />
              </div>
              <div>
                <Label htmlFor="providerName">Provider name</Label>
                <Input id="providerName" value={formData.provider_name} onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })} placeholder="Provider or company name" />
              </div>
              <div>
                <Label htmlFor="providerContact">Provider contact</Label>
                <Input id="providerContact" type="tel" value={formData.provider_contact} onChange={(e) => setFormData({ ...formData, provider_contact: e.target.value })} placeholder="Phone number" />
              </div>
              <div>
                <Label htmlFor="providerUrl">Provider website</Label>
                <Input id="providerUrl" type="url" value={formData.provider_url} onChange={(e) => setFormData({ ...formData, provider_url: e.target.value })} placeholder="https://..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="serviceDate">Service date</Label>
                  <Input id="serviceDate" type="date" value={formData.service_date} onChange={(e) => setFormData({ ...formData, service_date: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="serviceTime">Service time</Label>
                  <Input id="serviceTime" type="time" value={formData.service_time} onChange={(e) => setFormData({ ...formData, service_time: e.target.value })} />
                </div>
              </div>
              <div>
                <Label htmlFor="contactPhone">Contact phone</Label>
                <Input id="contactPhone" type="tel" value={formData.contact_phone} onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })} placeholder="Your contact number for the provider" />
              </div>
            </>
          )}

          <div>
            <Label>Dates *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>{format(dateRange.from, "LLL dd, y")} – {format(dateRange.to, "LLL dd, y")}</>
                    ) : format(dateRange.from, "LLL dd, y")
                  ) : <span>Pick dates</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
              </PopoverContent>
            </Popover>
          </div>

          {bookingType === 'guest' && (
            <>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" value={formData.phone_number} onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })} placeholder="+1 (555) 123-4567" />
              </div>

              <div>
                <Label htmlFor="bookingUrl">Booking link</Label>
                <Input id="bookingUrl" type="url" value={formData.booking_url} onChange={(e) => setFormData({ ...formData, booking_url: e.target.value })} placeholder="https://..." />
              </div>

              <div>
                <Label htmlFor="poolHeat">Pool heat</Label>
                <Select value={formData.pool_heat} onValueChange={(v) => setFormData({ ...formData, pool_heat: v as Booking['pool_heat'] })}>
                  <SelectTrigger id="poolHeat"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.values(POOL_HEAT_STATUSES).map((status) => (
                      <SelectItem key={status.code} value={status.code}>{status.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Any special requests or notes..." rows={3} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 rounded-[38px]">Cancel</Button>
            <Button type="submit" className="flex-1">Add Booking</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
