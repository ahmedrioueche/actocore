export interface CountryCodeOption {
  code: string;
  flag: string;
  iso: string;
  example: string;
}

export const COUNTRY_CODES: CountryCodeOption[] = [
  { code: '+1', flag: '🇺🇸', iso: 'US', example: '555 123 4567' },
  { code: '+33', flag: '🇫🇷', iso: 'FR', example: '6 12 34 56 78' },
  { code: '+213', flag: '🇩🇿', iso: 'DZ', example: '555 123 456' },
  { code: '+44', flag: '🇬🇧', iso: 'GB', example: '7911 123456' },
];
