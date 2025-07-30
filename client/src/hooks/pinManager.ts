// pinManager.ts
import SecureLS from "secure-ls";

// Initialize with AES encryption
const ls = new SecureLS({ encodingType: "aes" });

// Create dynamic key based on username
const getPinKey = (username: string): string => `vault_pin_${username}`;

// Set PIN (store as string)
export const setPin = (username: string, pin: number) => {
  const key = getPinKey(username);
  ls.set(key, pin.toString());
  console.log(`Successfully set ${pin} for ${username}`);
};

// Verify entered PIN
// Verify entered PIN
export function verifyPin(
  username: string,
  input: string,
): boolean | undefined {
  const key = getPinKey(username);
  const savedPin = ls.get(key); // Correctly read from SecureLS
  if (!savedPin) return undefined;
  return savedPin === input.toString();
}

// Check if a PIN is set
export const hasPin = (username: string): boolean => {
  const key = getPinKey(username);
  const value = ls.get(key);
  console.log("Checking PIN for:", username, "Key:", key, "Value:", value);
  return typeof value === "string" && value.trim() !== "";
};

// Clear the PIN
export const clearPin = (username: string) => {
  const key = getPinKey(username);
  ls.remove(key);
};
