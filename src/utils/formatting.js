/**
 * Format a 10-digit phone number string into (XXX) XXX-XXXX format.
 * Strips leading country code '1' if 11 digits.
 */
export const formatPhone = (phone) => {
  let numericPhone = phone.replace(/\D/g, '');

  // Strip leading country code '1' if present (e.g. +1 auto-filled)
  if (numericPhone.length === 11 && numericPhone.startsWith('1')) {
    numericPhone = numericPhone.slice(1);
  }

  if (numericPhone.length !== 10) return phone;

  return `(${numericPhone.slice(0, 3)}) ${numericPhone.slice(3, 6)}-${numericPhone.slice(6)}`;
};

/**
 * Convert seconds to a human-readable time string.
 */
export const secondsToTimeString = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};
