import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetTitle } from './ui/sheet';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Calendar, Phone, Edit2, Trash2, Save, X, Link, Wrench, Globe } from 'lucide-react';
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

  useEffect(() => { setEditedBooking(booking); }, [booking]);

  const formatDate = (dateString: string) => parseLocalDate(dateString).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const getStatusColor = () => {
    if (booking.status === 'completed') return 'bg-past';
    if (booking.stay_type === 'guest') return booking.status === 'current' ? 'bg-guest-current' : 'bg-guest-upcoming';
    if (booking.stay_type === 'unresolved') return 'bg-[#999999]';
    return booking.status === 'current' ? 'bg-owner-current' : 'bg-owner-upcoming';
  };

  const getStatusLabel = () => {
    switch (booking.status) {
      case 'current': return 'Currently Staying';
      case 'upcoming': return 'Upcoming';
      case 'completed': return 'Completed';
    }
  };

  const handleSave = async () => {
    if (editedBooking.stay_type === 'unresolved') { toast.error('Please select a stay type first'); return; }
    if ((editedBooking.stay_type === 'guest' || editedBooking.stay_type === 'owner') && !editedBooking.guest_name) { toast.error('Please enter a name'); return; }
    if (editedBooking.stay_type === 'service' && !editedBooking.service_requested) { toast.error('Please enter the service requested'); return; }
    if (!editedBooking.start_date || !editedBooking.end_date) { toast.error('Please select check-in and check-out dates'); return; }
    if (parseLocalDate(editedBooking.end_date) <= parseLocalDate(editedBooking.start_date)) { toast.error('Check-out date must be after check-in date'); return; }

    try {
      await onUpdateBooking(editedBooking);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save booking:', error);
    }
  };

  const handleDelete = () => {
    onDeleteBooking(booking.id);
    toast.success('Booking deleted successfully!');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-screen overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" aria-describedby={undefined}>
        <SheetTitle className="sr-only">Booking Details</SheetTitle>
        {!isEditing ? (
          <div className="space-y-6 px-4">
            {booking.stay_type === 'owner' && (
              <div className="p-4 bg-owner-light border border-owner-border rounded-lg">
                <p className="text-sm text-owner-text">This is an owner blocking. The property is unavailable for guest bookings during these dates.</p>
              </div>
            )}
            {booking.stay_type === 'service' && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">This is a service appointment. No guest bookings during this time.</p>
              </div>
            )}
            {booking.stay_type === 'unresolved' && (
              <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
                <p className="text-sm text-yellow-800">This booking needs to be classified. Tap Edit to set the stay type.</p>
              </div>
            )}

            <div>
              {/* Header with close button */}
              <div className="flex items-center gap-3 mb-[16px] mt-[8px]">
                <button onClick={() => onOpenChange(false)} className={`h-12 w-12 rounded-full shadow-lg flex items-center justify-center flex-shrink-0 ${booking.stay_type === 'guest' ? 'bg-black hover:bg-black/90' : 'bg-white hover:bg-gray-50'}`} aria-label="Close">
                  <X className={`w-5 h-5 ${booking.stay_type === 'guest' ? 'text-white' : 'text-gray-500'}`} />
                </button>
                {booking.stay_type === 'guest' && <h2 className="m-0">{booking.guest_name}</h2>}
                {booking.stay_type === 'owner' && (
                  <div className="flex flex-col">
                    <h2 className="m-0">{booking.guest_name || 'Owner'}</h2>
                    <Badge className={`${getStatusColor()} w-fit`}>{getStatusLabel()}</Badge>
                  </div>
                )}
                {booking.stay_type === 'service' && <h2 className="m-0">{booking.service_requested || 'Service'}</h2>}
                {booking.stay_type === 'unresolved' && <h2 className="m-0">Not available</h2>}
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div><p className="text-gray-600">Check-in</p><p>{formatDate(booking.start_date)}</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div><p className="text-gray-600">Check-out</p><p>{formatDate(booking.end_date)}</p></div>
                </div>

                {booking.stay_type === 'guest' && booking.phone_number && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-gray-600">Phone</p>
                      <a href={`tel:${booking.phone_number}`} className="hover:underline" style={{ color: '#118AB2' }}>{formatPhoneNumber(booking.phone_number)}</a>
                    </div>
                  </div>
                )}

                {booking.stay_type === 'guest' && booking.booking_url && (
                  <div className="flex items-start gap-3">
                    <Link className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-gray-600">Booking link</p>
                      <a href={booking.booking_url} target="_blank" rel="noopener noreferrer" className="hover:underline break-all" style={{ color: '#118AB2' }}>{booking.booking_url}</a>
                    </div>
                  </div>
                )}

                {booking.stay_type === 'guest' && (
                  <div className="flex items-end gap-4">
                    <div className="flex-1" style={{ maxWidth: '150px' }}>
                      <Label htmlFor="view-poolHeat">Pool heat</Label>
                      <Select
                        value={booking.pool_heat || 'not-asked'}
                        onValueChange={async (value) => {
                          const updatedBooking = { ...booking, pool_heat: value as Booking['pool_heat'] };
                          try {
                            await onUpdateBooking(updatedBooking);
                            toast.success('Pool heat status updated');
                          } catch (error) {
                            console.error('Failed to update pool heat:', error);
                          }
                        }}
                      >
                        <SelectTrigger id="view-poolHeat"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.values(POOL_HEAT_STATUSES).map((status) => (
                            <SelectItem key={status.code} value={status.code}>{status.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Service view fields */}
                {booking.stay_type === 'service' && booking.provider_name && (
                  <div className="flex items-start gap-3">
                    <Wrench className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div><p className="text-gray-600">Provider</p><p>{booking.provider_name}</p></div>
                  </div>
                )}
                {booking.stay_type === 'service' && booking.provider_contact && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-gray-600">Provider contact</p>
                      <a href={`tel:${booking.provider_contact}`} className="hover:underline" style={{ color: '#118AB2' }}>{formatPhoneNumber(booking.provider_contact)}</a>
                    </div>
                  </div>
                )}
                {booking.stay_type === 'service' && booking.provider_url && (
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-gray-600">Provider website</p>
                      <a href={booking.provider_url} target="_blank" rel="noopener noreferrer" className="hover:underline break-all" style={{ color: '#118AB2' }}>{booking.provider_url}</a>
                    </div>
                  </div>
                )}
                {booking.stay_type === 'service' && (booking.service_date || booking.service_time) && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-gray-600">Service date/time</p>
                      <p>{[booking.service_date, booking.service_time].filter(Boolean).join(' at ')}</p>
                    </div>
                  </div>
                )}
                {booking.stay_type === 'service' && booking.contact_phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-gray-600">Contact phone</p>
                      <a href={`tel:${booking.contact_phone}`} className="hover:underline" style={{ color: '#118AB2' }}>{formatPhoneNumber(booking.contact_phone)}</a>
                    </div>
                  </div>
                )}

                {booking.notes && (
                  <div>
                    <p className="text-gray-600 mb-2">Notes</p>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-md">{booking.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={() => setIsEditing(true)} variant="outline" className="flex-1 gap-2">
                <Edit2 className="w-4 h-4" />Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="flex-1 gap-2">
                    <Trash2 className="w-4 h-4" />Delete
                  </Button>
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
        ) : (
          <div className="space-y-4 px-4">
            <div className="flex items-center gap-3 mb-4 mt-2">
              <button onClick={() => onOpenChange(false)} className="h-12 w-12 rounded-full shadow-lg bg-white hover:bg-gray-50 flex items-center justify-center flex-shrink-0" aria-label="Close">
                <X className="w-5 h-5 text-gray-500" />
              </button>
              <h2 className="m-0">Edit Booking</h2>
            </div>

            {/* Stay type selector — only shown for unresolved bookings */}
            {editedBooking.stay_type === 'unresolved' && (
              <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
                <Label htmlFor="edit-stayType">What type of stay is this? *</Label>
                <Select value="" onValueChange={(v) => setEditedBooking({ ...editedBooking, stay_type: v as Booking['stay_type'] })}>
                  <SelectTrigger id="edit-stayType" className="mt-2"><SelectValue placeholder="Select stay type..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="guest">Guest</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Guest/Owner name */}
            {(editedBooking.stay_type === 'guest' || editedBooking.stay_type === 'owner') && (
              <div className="my-[16px] mx-[0px]">
                <Label htmlFor="edit-guestName">{editedBooking.stay_type === 'owner' ? 'Owner Name *' : 'Guest Name *'}</Label>
                <Input id="edit-guestName" value={editedBooking.guest_name} onChange={(e) => setEditedBooking({ ...editedBooking, guest_name: e.target.value })} className="py-[14px] px-[12px]" />
              </div>
            )}

            {/* Dates — shown for all types */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-startDate">Check-in *</Label>
                <Input id="edit-startDate" type="date" value={editedBooking.start_date} onChange={(e) => setEditedBooking({ ...editedBooking, start_date: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="edit-endDate">Check-out *</Label>
                <Input id="edit-endDate" type="date" value={editedBooking.end_date} onChange={(e) => setEditedBooking({ ...editedBooking, end_date: e.target.value })} />
              </div>
            </div>

            {/* Guest-specific fields */}
            {editedBooking.stay_type === 'guest' && (
              <>
                <div>
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input id="edit-phone" type="tel" value={editedBooking.phone_number} onChange={(e) => setEditedBooking({ ...editedBooking, phone_number: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="edit-bookingUrl">Booking link</Label>
                  <Input id="edit-bookingUrl" type="url" value={editedBooking.booking_url} onChange={(e) => setEditedBooking({ ...editedBooking, booking_url: e.target.value })} placeholder="https://..." />
                </div>
                <div className="flex items-end gap-4">
                  <div className="flex-1" style={{ maxWidth: '150px' }}>
                    <Label htmlFor="edit-poolHeat">Pool heat</Label>
                    <Select value={editedBooking.pool_heat || 'not-asked'} onValueChange={(v) => setEditedBooking({ ...editedBooking, pool_heat: v as Booking['pool_heat'] })}>
                      <SelectTrigger id="edit-poolHeat"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.values(POOL_HEAT_STATUSES).map((status) => (
                          <SelectItem key={status.code} value={status.code}>{status.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {/* Service-specific fields */}
            {editedBooking.stay_type === 'service' && (
              <>
                <div>
                  <Label htmlFor="edit-serviceRequested">Service requested *</Label>
                  <Input id="edit-serviceRequested" value={editedBooking.service_requested || ''} onChange={(e) => setEditedBooking({ ...editedBooking, service_requested: e.target.value })} placeholder="e.g., Pool cleaning, HVAC maintenance" />
                </div>
                <div>
                  <Label htmlFor="edit-providerName">Provider name</Label>
                  <Input id="edit-providerName" value={editedBooking.provider_name || ''} onChange={(e) => setEditedBooking({ ...editedBooking, provider_name: e.target.value })} placeholder="Provider or company name" />
                </div>
                <div>
                  <Label htmlFor="edit-providerContact">Provider contact</Label>
                  <Input id="edit-providerContact" type="tel" value={editedBooking.provider_contact || ''} onChange={(e) => setEditedBooking({ ...editedBooking, provider_contact: e.target.value })} placeholder="Phone number" />
                </div>
                <div>
                  <Label htmlFor="edit-providerUrl">Provider website</Label>
                  <Input id="edit-providerUrl" type="url" value={editedBooking.provider_url || ''} onChange={(e) => setEditedBooking({ ...editedBooking, provider_url: e.target.value })} placeholder="https://..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-serviceDate">Service date</Label>
                    <Input id="edit-serviceDate" type="date" value={editedBooking.service_date || ''} onChange={(e) => setEditedBooking({ ...editedBooking, service_date: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="edit-serviceTime">Service time</Label>
                    <Input id="edit-serviceTime" type="time" value={editedBooking.service_time || ''} onChange={(e) => setEditedBooking({ ...editedBooking, service_time: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-contactPhone">Contact phone</Label>
                  <Input id="edit-contactPhone" type="tel" value={editedBooking.contact_phone || ''} onChange={(e) => setEditedBooking({ ...editedBooking, contact_phone: e.target.value })} placeholder="Your contact number for the provider" />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea id="edit-notes" value={editedBooking.notes || ''} onChange={(e) => setEditedBooking({ ...editedBooking, notes: e.target.value })} rows={3} />
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={() => { setEditedBooking(booking); setIsEditing(false); }} variant="outline" className="flex-1 gap-2 !rounded-full">
                <X className="w-4 h-4" />Cancel
              </Button>
              <Button onClick={handleSave} className="flex-1 gap-2 !rounded-full">
                <Save className="w-4 h-4" />Save
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
