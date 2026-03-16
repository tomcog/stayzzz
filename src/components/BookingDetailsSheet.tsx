import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetTitle } from './ui/sheet';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Calendar, Phone, Edit2, Trash2, Save, SaveOff, X, Link, Wrench, Globe, EyeOff, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Booking } from '../App';
import { parseLocalDate } from '../utils/dateUtils';
import { formatPhoneNumber } from '../utils/formatters';
import { POOL_HEAT_STATUSES } from '../utils/statusConfig';

interface BookingDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking;
  onUpdateBooking: (booking: Booking) => Promise<void>;
  onDeleteBooking: (id: string) => void;
}

export function BookingDetailsSheet({ open, onOpenChange, booking, onUpdateBooking, onDeleteBooking }: BookingDetailsSheetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedBooking, setEditedBooking] = useState(booking);

  useEffect(() => { setEditedBooking(booking); setIsEditing(false); }, [booking]);

  const hasChanges = JSON.stringify(editedBooking) !== JSON.stringify(booking);

  const fieldChanged = (field: keyof Booking) =>
    editedBooking[field] !== booking[field];

  const formatDate = (dateString: string) =>
    parseLocalDate(dateString).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  const handleSave = async () => {
    if (editedBooking.stay_type === 'unresolved') { toast.error('Please select a stay type first'); return; }
    if ((editedBooking.stay_type === 'guest' || editedBooking.stay_type === 'owner') && !editedBooking.guest_name) { toast.error('Please enter a name'); return; }
    if (editedBooking.stay_type === 'service' && !editedBooking.service_requested) { toast.error('Please enter the service requested'); return; }
    if (!editedBooking.start_date || !editedBooking.end_date) { toast.error('Please select dates'); return; }
    if (parseLocalDate(editedBooking.end_date) <= parseLocalDate(editedBooking.start_date)) { toast.error('Check-out must be after check-in'); return; }
    try {
      await onUpdateBooking(editedBooking);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save booking:', error);
    }
  };

  const handleDelete = () => {
    onDeleteBooking(booking.id);
  };

  const handleHide = async () => {
    await onUpdateBooking({ ...booking, hidden: true });
    onOpenChange(false);
  };

  const displayName = booking.stay_type === 'service'
    ? (booking.service_requested || 'Service')
    : booking.stay_type === 'unresolved'
    ? 'Not Available'
    : (booking.guest_name || (booking.stay_type === 'owner' ? 'Owner' : 'Guest'));

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) setIsEditing(false); onOpenChange(o); }}>
      <SheetContent side="bottom" className="h-screen overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-0" aria-describedby={undefined}>
        <SheetTitle className="sr-only">Booking Details</SheetTitle>

        {!isEditing ? (
          <div className="flex flex-col h-full">
            <div className="flex-1 px-4 py-6 flex flex-col gap-4">

              {/* Unresolved banner */}
              {booking.stay_type === 'unresolved' && (
                <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                  <p className="text-sm text-yellow-800">This booking needs attention. Tap Edit to set the stay type.</p>
                </div>
              )}

              {/* Name heading with close button */}
              <div className="flex items-center gap-3">
                <button onClick={() => onOpenChange(false)} className="shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
                <h2 className="text-[20px] font-bold uppercase m-0 leading-tight flex-1">{displayName}</h2>
                <button onClick={() => setIsEditing(true)} className="shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                  <Edit2 className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Detail rows */}
              <div className="flex flex-col gap-4">

                {/* Check-in */}
                <div className="flex gap-3 items-start">
                  <Calendar className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[16px] text-[#4a5565] leading-6">Check-in</p>
                    <p className="text-[16px] text-black leading-6">{formatDate(booking.start_date)}</p>
                  </div>
                </div>

                {/* Check-out */}
                <div className="flex gap-3 items-start">
                  <Calendar className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[16px] text-[#4a5565] leading-6">Check-out</p>
                    <p className="text-[16px] text-black leading-6">{formatDate(booking.end_date)}</p>
                  </div>
                </div>

                {/* Phone */}
                {booking.phone_number && (
                  <div className="flex gap-3 items-start">
                    <Phone className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[16px] text-[#4a5565] leading-6">Phone</p>
                      <a href={`tel:${booking.phone_number}`} className="text-[16px] leading-6 hover:underline" style={{ color: '#118AB2' }}>
                        {formatPhoneNumber(booking.phone_number)}
                      </a>
                    </div>
                  </div>
                )}

                {/* Booking link */}
                {booking.booking_url && (
                  <div className="flex gap-3 items-start">
                    <Link className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[16px] text-[#4a5565] leading-6">Booking link</p>
                      <a href={booking.booking_url} target="_blank" rel="noopener noreferrer" className="text-[16px] leading-6 hover:underline break-all" style={{ color: '#118AB2' }}>
                        {booking.booking_url}
                      </a>
                    </div>
                  </div>
                )}

                {/* Service provider */}
                {booking.stay_type === 'service' && booking.provider_name && (
                  <div className="flex gap-3 items-start">
                    <Wrench className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[16px] text-[#4a5565] leading-6">Provider</p>
                      <p className="text-[16px] text-black leading-6">{booking.provider_name}</p>
                    </div>
                  </div>
                )}
                {booking.stay_type === 'service' && booking.provider_contact && (
                  <div className="flex gap-3 items-start">
                    <Phone className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[16px] text-[#4a5565] leading-6">Provider contact</p>
                      <a href={`tel:${booking.provider_contact}`} className="text-[16px] leading-6 hover:underline" style={{ color: '#118AB2' }}>
                        {formatPhoneNumber(booking.provider_contact)}
                      </a>
                    </div>
                  </div>
                )}
                {booking.stay_type === 'service' && booking.provider_url && (
                  <div className="flex gap-3 items-start">
                    <Globe className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[16px] text-[#4a5565] leading-6">Provider website</p>
                      <a href={booking.provider_url} target="_blank" rel="noopener noreferrer" className="text-[16px] leading-6 hover:underline break-all" style={{ color: '#118AB2' }}>
                        {booking.provider_url}
                      </a>
                    </div>
                  </div>
                )}
                {booking.stay_type === 'service' && (booking.service_date || booking.service_time) && (
                  <div className="flex gap-3 items-start">
                    <Calendar className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[16px] text-[#4a5565] leading-6">Service date/time</p>
                      <p className="text-[16px] text-black leading-6">{[booking.service_date, booking.service_time].filter(Boolean).join(' at ')}</p>
                    </div>
                  </div>
                )}

                {/* Pool heat — guest only, inline dropdown */}
                {booking.stay_type === 'guest' && (
                  <div className="w-[160px]">
                    <Label htmlFor="view-poolHeat" className="text-[14px]">Pool heat</Label>
                    <Select
                      value={booking.pool_heat || 'not-asked'}
                      onValueChange={async (value) => {
                        try {
                          await onUpdateBooking({ ...booking, pool_heat: value as Booking['pool_heat'] });
                        } catch (error) {
                          console.error('Failed to update pool heat:', error);
                        }
                      }}
                    >
                      <SelectTrigger id="view-poolHeat" variant="underline" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(POOL_HEAT_STATUSES).map((status) => (
                          <SelectItem key={status.code} value={status.code}>{status.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Total rent — guest only */}
                {booking.stay_type === 'guest' && booking.total_rent != null && (
                  <div>
                    <p className="text-[16px] text-[#4a5565] leading-6">Total rent</p>
                    <p className="text-[16px] text-black leading-6">${booking.total_rent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                )}

                {/* Notes */}
                {booking.notes && (
                  <div>
                    <p className="text-[16px] text-[#4a5565] leading-6 mb-1">Notes</p>
                    <p className="text-[16px] text-black leading-6">{booking.notes}</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-1 px-4 py-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setEditedBooking(booking); setIsEditing(false); }}
                  className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${hasChanges ? 'bg-[#EE5A7B]/10 hover:bg-[#EE5A7B]/20' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  {hasChanges
                    ? <SaveOff className="w-4 h-4 text-[#EE5A7B]" />
                    : <ArrowLeft className="w-4 h-4 text-gray-500" />
                  }
                </button>
                <h2 className="text-[18px] font-semibold uppercase tracking-wide m-0 flex-1">Edit Booking</h2>
                {hasChanges && (
                  <button
                    onClick={handleSave}
                    className="shrink-0 w-8 h-8 rounded-full bg-cta/10 flex items-center justify-center hover:bg-cta/20 transition-colors"
                  >
                    <Save className="w-4 h-4 text-cta" />
                  </button>
                )}
              </div>

              {/* Type selector — only for unresolved */}
              {editedBooking.stay_type === 'unresolved' && (
                <div>
                  <Label htmlFor="edit-stayType" className="text-[14px]">What type of stay is this? *</Label>
                  <Select value="" onValueChange={(v) => setEditedBooking({ ...editedBooking, stay_type: v as Booking['stay_type'] })}>
                    <SelectTrigger id="edit-stayType" variant="underline" changed={fieldChanged('stay_type')} className="mt-1">
                      <SelectValue placeholder="Select stay type..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="guest">Guest</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="service">Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Name + Phone — guest */}
              {editedBooking.stay_type === 'guest' && (
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="edit-name" className="text-[14px]">Guest Name *</Label>
                    <Input id="edit-name" variant="underline" changed={fieldChanged('guest_name')} value={editedBooking.guest_name} onChange={(e) => setEditedBooking({ ...editedBooking, guest_name: e.target.value })} className="mt-1" />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="edit-phone" className="text-[14px]">Phone</Label>
                    <Input id="edit-phone" type="tel" variant="underline" changed={fieldChanged('phone_number')} value={editedBooking.phone_number} onChange={(e) => setEditedBooking({ ...editedBooking, phone_number: e.target.value })} className="mt-1" />
                  </div>
                </div>
              )}

              {/* Name — owner */}
              {editedBooking.stay_type === 'owner' && (
                <div>
                  <Label htmlFor="edit-name" className="text-[14px]">Owner Name *</Label>
                  <Input id="edit-name" variant="underline" changed={fieldChanged('guest_name')} value={editedBooking.guest_name} onChange={(e) => setEditedBooking({ ...editedBooking, guest_name: e.target.value })} className="mt-1" />
                </div>
              )}

              {/* Dates */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="edit-startDate" className="text-[14px]">Check-in *</Label>
                  <div className="relative mt-1">
                    <label htmlFor="edit-startDate" className="absolute left-1 top-1/2 -translate-y-1/2 cursor-pointer">
                      <Calendar className="w-4 h-4 text-gray-400" />
                    </label>
                    <Input id="edit-startDate" type="date" variant="underline" changed={fieldChanged('start_date')} value={editedBooking.start_date} onChange={(e) => setEditedBooking({ ...editedBooking, start_date: e.target.value })} className="pl-6" />
                  </div>
                </div>
                <div className="flex-1">
                  <Label htmlFor="edit-endDate" className="text-[14px]">Check-out *</Label>
                  <div className="relative mt-1">
                    <label htmlFor="edit-endDate" className="absolute left-1 top-1/2 -translate-y-1/2 cursor-pointer">
                      <Calendar className="w-4 h-4 text-gray-400" />
                    </label>
                    <Input id="edit-endDate" type="date" variant="underline" changed={fieldChanged('end_date')} value={editedBooking.end_date} onChange={(e) => setEditedBooking({ ...editedBooking, end_date: e.target.value })} className="pl-6" />
                  </div>
                </div>
              </div>

              {/* Guest fields */}
              {editedBooking.stay_type === 'guest' && (
                <>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <Label htmlFor="edit-totalRent" className="text-[14px]">Total rent</Label>
                      <Input id="edit-totalRent" type="number" inputMode="decimal" step="0.01" min="0" variant="underline" changed={fieldChanged('total_rent')} value={editedBooking.total_rent ?? ''} onChange={(e) => setEditedBooking({ ...editedBooking, total_rent: e.target.value ? parseFloat(e.target.value) : undefined })} placeholder="0.00" className="mt-1" />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="edit-poolHeat" className="text-[14px]">Pool heat</Label>
                      <Select value={editedBooking.pool_heat || 'not-asked'} onValueChange={(v) => setEditedBooking({ ...editedBooking, pool_heat: v as Booking['pool_heat'] })}>
                        <SelectTrigger id="edit-poolHeat" variant="underline" changed={fieldChanged('pool_heat')} className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.values(POOL_HEAT_STATUSES).map((status) => (
                            <SelectItem key={status.code} value={status.code}>{status.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit-bookingUrl" className="text-[14px]">Booking info</Label>
                    <Input id="edit-bookingUrl" type="url" variant="underline" changed={fieldChanged('booking_url')} value={editedBooking.booking_url} onChange={(e) => setEditedBooking({ ...editedBooking, booking_url: e.target.value })} className="mt-1" />
                  </div>
                </>
              )}

              {/* Service fields */}
              {editedBooking.stay_type === 'service' && (
                <>
                  <div>
                    <Label htmlFor="edit-serviceRequested" className="text-[14px]">Service requested *</Label>
                    <Input id="edit-serviceRequested" variant="underline" changed={fieldChanged('service_requested')} value={editedBooking.service_requested || ''} onChange={(e) => setEditedBooking({ ...editedBooking, service_requested: e.target.value })} placeholder="e.g., Pool cleaning" className="mt-1" />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label htmlFor="edit-providerName" className="text-[14px]">Provider name</Label>
                      <Input id="edit-providerName" variant="underline" changed={fieldChanged('provider_name')} value={editedBooking.provider_name || ''} onChange={(e) => setEditedBooking({ ...editedBooking, provider_name: e.target.value })} className="mt-1" />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="edit-providerContact" className="text-[14px]">Contact</Label>
                      <Input id="edit-providerContact" type="tel" variant="underline" changed={fieldChanged('provider_contact')} value={editedBooking.provider_contact || ''} onChange={(e) => setEditedBooking({ ...editedBooking, provider_contact: e.target.value })} className="mt-1" />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label htmlFor="edit-serviceDate" className="text-[14px]">Date</Label>
                      <div className="relative mt-1">
                        <label htmlFor="edit-serviceDate" className="absolute left-1 top-1/2 -translate-y-1/2 cursor-pointer">
                          <Calendar className="w-4 h-4 text-gray-400" />
                        </label>
                        <Input id="edit-serviceDate" type="date" variant="underline" changed={fieldChanged('service_date')} value={editedBooking.service_date || ''} onChange={(e) => setEditedBooking({ ...editedBooking, service_date: e.target.value })} className="pl-6" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="edit-serviceTime" className="text-[14px]">Time</Label>
                      <Input id="edit-serviceTime" type="time" variant="underline" changed={fieldChanged('service_time')} value={editedBooking.service_time || ''} onChange={(e) => setEditedBooking({ ...editedBooking, service_time: e.target.value })} className="mt-1" />
                    </div>
                  </div>
                </>
              )}

              {/* Notes */}
              <div>
                <Label htmlFor="edit-notes" className="text-[14px]">Notes</Label>
                <Textarea id="edit-notes" variant="underline" changed={fieldChanged('notes')} value={editedBooking.notes || ''} onChange={(e) => setEditedBooking({ ...editedBooking, notes: e.target.value })} rows={3} className="mt-1" />
              </div>

              {/* Hide & Delete */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="flex items-center gap-2 text-[14px] text-gray-400 hover:text-gray-600 transition-colors">
                      <EyeOff className="w-4 h-4" />Hide
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Hide Booking?</AlertDialogTitle>
                      <AlertDialogDescription>This booking will be hidden from the app. You can unhide it from the database.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleHide}>Hide</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="flex items-center gap-2 text-[14px] text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />Delete
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Booking?</AlertDialogTitle>
                      <AlertDialogDescription>Are you sure you want to delete this booking? This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
