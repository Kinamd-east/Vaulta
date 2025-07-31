import { useEffect, useState } from "react";

interface Transaction {
  _id: string;
  amount: number;
  from: string;
  txHash: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  createdAt?: string;
}

interface Asset {
  _id: string;
  symbol: string;
  name: string;
  balance: number;
  contractAddress: string;
  decimals: number;
  usdBalance: number;
  isNative: boolean;
}

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: "INFO" | "ALERT" | "TRANSACTION" | "SECURITY" | "PROMOTION";
  status: "UNREAD" | "READ";
  createdAt?: string;
}

interface Wallet {
  _id: string;
  type: string;
  name: string;
  totalBalance: number;
  balance: number;
  address: string;
  privateKeyHashed: string;
  passwordHash: string;
  privateKeyIv: string;
  encryptedMnemonic: string;
  isPhraseSaved: boolean;
  passwordHash: string;
  mnemonicIv: string;
  assets: Asset[];
  transactions: Transaction[];
  createdAt?: string;
  updatedAt?: string;
}

interface User {
  _id: string;
  username: string;
  email: string;
  passwordHash: string;
  transactions: Transaction[];
  wallets: Wallet[];
  notifications: Notification[];
  createdAt?: string;
  updatedAt?: string;
}

const useUserAuthentication = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/auth/getMe`,
          {
            method: "GET",
            credentials: "include", // 🔑 required for sending cookies/session
          },
        );

        if (!res.ok) throw new Error("Not authenticated");

        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, loading };
};

export default useUserAuthentication;
