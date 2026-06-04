import { Phone } from "lucide-react";
import React from "react";
import { COUNTRY_CODES } from "@/constants/country-codes";
import useScreen from "@/hooks/useScreen";
import {
  formatPhoneDigitsForInput,
  getExampleNumber,
  parsePhoneNumber,
} from "@/utils/phone.util";
import CustomSelect from "./CustomSelect";

interface PhoneNumberInputProps {
  // Value props
  countryCode: string;
  phoneNumber: string;

  // Change handlers
  onCountryCodeChange: (code: string) => void;
  onPhoneNumberChange: (digits: string) => void;

  // Optional props
  id?: string;
  name?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;

  // Layout customization
  countryCodeWidth?: string;
  showIcon?: boolean;
}

const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
  countryCode,
  phoneNumber,
  onCountryCodeChange,
  onPhoneNumberChange,
  id = "phoneNumber",
  name = "phoneNumber",
  required = false,
  placeholder,
  disabled = false,
  className = "",
  countryCodeWidth = "w-24 md:w-32",
  showIcon = true,
}) => {
  const { isMobile } = useScreen();
  // Format country code options with flags
  const countryCodeOptions = COUNTRY_CODES.map((country) => ({
    value: country.code,
    label: country.code,
    flag: country.flag,
  }));

  // Handle phone number input change
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow digits
    const digitsOnly = value.replace(/\D/g, "");
    onPhoneNumberChange(digitsOnly);
  };

  // Get placeholder text
  const placeholderText = placeholder || getExampleNumber(countryCode);

  return (
    <div className={`flex gap-2 ${className}`}>
      {/* Country Code Selector */}
      <div className={`${countryCodeWidth} flex-shrink-0`}>
        <CustomSelect
          title=""
          options={countryCodeOptions}
          selectedOption={countryCode}
          onChange={onCountryCodeChange}
          className="text-sm"
          marginTop="mt-0"
          disabled={disabled}
          showIcon={!isMobile}
        />
      </div>

      {/* Phone Number Input */}
      <div className="flex-1">
        <div className="relative">
          {showIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-text-secondary" />
            </div>
          )}
          <input
            id={id}
            name={name}
            type="tel"
            required={required}
            disabled={disabled}
            value={formatPhoneDigitsForInput(phoneNumber)}
            onChange={handlePhoneChange}
            placeholder={placeholderText}
            className={`${
              showIcon ? "pl-10" : "pl-4"
            } w-full px-4 py-3 border border-border rounded-lg bg-surface text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
          />
        </div>
      </div>
    </div>
  );
};

// Cache the location fetch to avoid redundant network calls
let _cachedCountryCode: string | null = null;
let _fetchPromise: Promise<string | null> | null = null;

// Helper hook for managing phone number state
export const usePhoneNumber = (initialCountryCode = "+213") => {
  const [countryCode, setCountryCode] = React.useState(
    _cachedCountryCode || initialCountryCode,
  );
  const [phoneNumber, setPhoneNumber] = React.useState("");

  React.useEffect(() => {
    // If we already have it in cache, and the state hasn't been modified externally,
    // apply it immediately if we haven't already.
    if (_cachedCountryCode) {
      setCountryCode((current) =>
        current === initialCountryCode ? _cachedCountryCode! : current,
      );
      return;
    }

    let mounted = true;

    if (!_fetchPromise) {
      _fetchPromise = fetch("https://get.geojs.io/v1/ip/country.json")
        .then((res) => res.json())
        .then((data) => {
          if (data && data.country) {
            const iso = data.country.toUpperCase();
            const matched = COUNTRY_CODES.find((c) => c.iso === iso);
            if (matched) {
              _cachedCountryCode = matched.code;
              return matched.code;
            }
          }
          return null;
        })
        .catch((err) => {
          console.error("Failed to detect location for phone prefix", err);
          return null;
        });
    }

    _fetchPromise.then((code) => {
      if (mounted && code) {
        setCountryCode((current) => {
          // Only update if the user hasn't actively changed the country code
          if (current === initialCountryCode) {
            return code;
          }
          return current;
        });
      }
    });

    return () => {
      mounted = false;
    };
  }, [initialCountryCode]);

  // Get the full formatted phone number
  const getFullPhoneNumber = () => {
    return parsePhoneNumber(countryCode, phoneNumber);
  };

  // Validate phone number
  const isValid = () => {
    return phoneNumber.trim().length >= 7 && phoneNumber.length <= 15;
  };

  // Reset phone number
  const reset = () => {
    setCountryCode(_cachedCountryCode || initialCountryCode);
    setPhoneNumber("");
  };

  return {
    countryCode,
    phoneNumber,
    setCountryCode,
    setPhoneNumber,
    getFullPhoneNumber,
    isValid,
    reset,
  };
};

export default PhoneNumberInput;
