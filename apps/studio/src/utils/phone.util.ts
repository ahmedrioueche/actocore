import { COUNTRY_CODES } from '@/constants/country-codes';

export function formatPhoneDigitsForInput(digits: string): string {
  return digits.replace(/\D/g, '');
}

export function getExampleNumber(countryCode: string): string {
  return (
    COUNTRY_CODES.find((c) => c.code === countryCode)?.example ??
    '000 000 0000'
  );
}

export function parsePhoneNumber(countryCode: string, phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `${countryCode}${digits}`;
}
