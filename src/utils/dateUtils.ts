export const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const getCurrentDatePacific = (): Date => {
  const now = new Date();
  const pacificDateString = now.toLocaleDateString('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const [month, day, year] = pacificDateString.split('/').map(Number);
  const pacificDate = new Date(year, month - 1, day);
  pacificDate.setHours(0, 0, 0, 0);
  return pacificDate;
};

export const calculateBookingStatus = (startDate: string, endDate: string): 'upcoming' | 'current' | 'completed' => {
  const now = getCurrentDatePacific();
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  if (now < start) return 'upcoming';
  else if (now >= start && now <= end) return 'current';
  else return 'completed';
};
