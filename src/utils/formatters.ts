// Numbers pasted from Airbnb/Contacts often carry invisible bidi marks (e.g. U+202C).
const cleanPhoneInput = (value: string): string => value.replace(/\p{Cf}/gu, '').trim();

export const formatPhoneNumber = (value: string | undefined | null): string => {
  if (!value) return '';
  const trimmed = cleanPhoneInput(value);
  // International numbers (anything with a + prefix other than +1) keep their own
  // grouping — reformatting them as US numbers drops the country code.
  if (trimmed.startsWith('+') && !trimmed.startsWith('+1')) {
    return trimmed.replace(/\s+/g, ' ');
  }
  const cleaned = trimmed.replace(/\D/g, '');
  const match = cleaned.match(/^(1|)?(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return [match[2], match[3], match[4]].join('-');
  }
  return trimmed;
};

// Digits only, keeping a leading + so tel:/sms: links dial the right country.
export const toDialablePhone = (value: string | undefined | null): string => {
  if (!value) return '';
  const trimmed = cleanPhoneInput(value);
  const digits = trimmed.replace(/\D/g, '');
  return trimmed.startsWith('+') ? `+${digits}` : digits;
};
