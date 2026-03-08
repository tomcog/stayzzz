export const formatPhoneNumber = (value: string | undefined | null): string => {
  if (!value) return '';
  const cleaned = value.replace(/\D/g, '');
  const match = cleaned.match(/^(1|)?(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return [match[2], match[3], match[4]].join('-');
  }
  return value;
};
