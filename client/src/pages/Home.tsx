import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router";
import * as Dialog from "@radix-ui/react-dialog";
import { hasPin } from "@/hooks/pinManager";
import { FiDownload, FiUpload } from "react-icons/fi";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import QRCode from "react-qr-code";

import { Badge } from "@/components/ui/badge";
import { BellIcon } from "@heroicons/react/24/solid";
import { BellIcon as BellOutline } from "@heroicons/react/24/outline";
import useUserAuthentication from "@/hooks/useUserAuthentication";
import clsx from "clsx";
import {
  Settings,
  ChevronDownCircle,
  PlusCircle,
  Download,
  Copy,
  Eye,
  EyeOff,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
const Home = () => {
  const [showSetPinBanner, setShowSetPinBanner] = useState(false);
  const [phraseBanner, setPhraseBanner] = useState(false);
  const [unreadNotis, setUnreadNotis] = useState(0);
  const [selectedNoti, setSelectedNoti] = useState(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showRevealPhrase, setShowRevealPhrase] = useState(false);
  const [mnemonicWords, setMnemonicWords] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [showNotifications, setShowNotifications] = useState(false);

  const [confirmationIndices, setConfirmationIndices] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);
  const [show, setShow] = useState(false);
  const [userInputs, setUserInputs] = useState<string[]>(["", "", ""]);

  const [form, setForm] = useState({
    password: "",
  });
  const [loadingPhrase, setLoadingPhrase] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);
  const [error, setError] = useState("");

  const { user, loading } = useUserAuthentication();
  const [selectedWallet, setSelectedWallet] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user?.username) {
      if (!selectedWallet || !selectedWallet._id) {
        return;
      }
      const result = hasPin(user.username);
      const unreadCount =
        user?.notifications?.filter((n) => n.status === "UNREAD").length || 0;
      setUnreadNotis(unreadCount);
      setCurrentUser(user);

      if (user.wallets?.length > 0 && !selectedWallet) {
        setSelectedWallet(user.wallets[0]); // default wallet
      }

      if (!result) {
        setShowSetPinBanner(true);
      }
    }
  }, [loading, user, selectedWallet]);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    if (!selectedWallet || !selectedWallet._id) {
      return;
    }
    const fetchWallet = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/wallet/get-wallet/${selectedWallet._id}`,
          {
            credentials: "include",
          },
        );

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to fetch wallet");
        }

        const data = await res.json();
        console.log(phraseBanner);
        setPhraseBanner(!data.wallet.isPhraseSaved);
      } catch (err: any) {
        console.error("Error fetching balance:", err.message);
      }
    };

    fetchWallet();
  }, [selectedWallet]);

  const copyToClipboard = () => {
    if (!selectedWallet) return;
    navigator.clipboard.writeText(selectedWallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleCopy = () => {
    if (!mnemonicWords) return;
    navigator.clipboard.writeText(mnemonicWords);
  };

  const handleOpenModal = () => {
    setPasswordModal(true);
    setShowSettings(false);
  };

  const handleRevealPhrase = async () => {
    if (!selectedWallet || !selectedWallet._id) {
      return;
    }
    setLoadingPhrase(true);
    if (form.password === "") {
      setLoadingPhrase(false);
      toast("Password cannot be empty");
      return;
    }
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/wallet/reveal-phrase/${selectedWallet?._id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ password: form.password }),
        },
      );
      const data = await res.json();

      if (!res.ok) {
        setLoadingPhrase(false);
        toast(data.message);
        console.log(res);
        throw new Error("Failed to fetch mnemonic phrase");
      }
      setPasswordModal(false);
      setMnemonicWords(data.mnemonic.split(" ")); // assuming it's space-separated
      setShowRevealPhrase(true);
      setLoadingPhrase(false);
    } catch (err) {
      // toast(err.message);
      console.error("Error revealing phrase:", err);
    }
  };

  const handleToggle = () => setShowPassword(!showPassword);
  const handleSetPin = () => {
    navigate("/set-pin");
  };

  return (
    <div className="min-h-screen bg-white text-black p-4 space-y-6">
      {showSetPinBanner && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded mb-4">
          <p className="font-medium">You haven't set a PIN yet!</p>
          <button
            onClick={handleSetPin}
            className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
          >
            Set PIN Now
          </button>
        </div>
      )}
      {phraseBanner === true ? (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded mb-4">
          <p className="font-medium">You haven't saved your seed phrase yet!</p>
          <button
            onClick={() => setPasswordModal(true)}
            className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
          >
            Reveal Phrase
          </button>
        </div>
      ) : (
        ""
      )}
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Vaulta</h1>
        <div className="flex items-center space-x-4">
          <Settings
            className="w-5 h-5 cursor-pointer"
            onClick={() => setShowSettings(true)}
          />
          <Dialog.Root open={showSettings} onOpenChange={setShowSettings}>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" />
              <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[90%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title className="text-xl font-semibold">
                    Settings
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button className="text-gray-500 hover:text-black cursor-pointer">
                      <X className="w-5 h-5" />
                    </button>
                  </Dialog.Close>
                </div>
                <button
                  onClick={handleOpenModal}
                  className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
                >
                  Reveal Phrase
                </button>
                {/* Settings content goes here */}
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          <Dialog.Root
            open={showNotifications}
            onOpenChange={setShowNotifications}
          >
            <Dialog.Trigger asChild>
              <button className="flex flex-row items-start justify-start">
                <div className="text-black">
                  {unreadNotis > 0 ? (
                    <BellIcon
                      className="w-6 h-6 text-black cursor-pointer"
                      onClick={handleRevealPhrase}
                    />
                  ) : (
                    <BellOutline className="w-6 h-6 text-black cursor-pointer" />
                  )}
                </div>
                <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums">
                  {unreadNotis}
                </Badge>
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" />
              <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[90%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title className="text-xl font-semibold">
                    Notifications
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button className="text-gray-500 hover:text-black cursor-pointer">
                      <X className="w-5 h-5" />
                    </button>
                  </Dialog.Close>
                </div>

                {/* Notification List Placeholder */}
                <div className="space-y-3 p-3">
                  {!loading && user ? (
                    user.notifications.length > 0 ? (
                      user.notifications.map((notis, index) => (
                        <div
                          key={index}
                          onClick={async () => {
                            try {
                              const res = await fetch(
                                `${import.meta.env.VITE_BACKEND_URL}/notifications/${notis._id}`,
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                },
                              );

                              if (!res.ok) {
                                const data = await res.json();
                                toast(data.message);
                                throw new Error(
                                  "Failed to mark notification as read",
                                );
                              }

                              // Update frontend state
                              setSelectedNoti(notis);
                              setShowDetails(true);
                              setShowNotifications(false);
                            } catch (err) {
                              console.error(
                                "Error marking notification as read:",
                                err,
                              );
                            }
                          }}
                          className={clsx(
                            "p-3 rounded-md border transition-all cursor-pointer",
                            notis.status === "UNREAD"
                              ? "bg-white border-black/10 shadow-sm"
                              : "bg-gray-100 border-transparent opacity-80",
                          )}
                        >
                          <div className="flex flex-row justify-between items-start">
                            <h2
                              className={clsx(
                                "text-sm",
                                notis.status === "UNREAD"
                                  ? "font-bold text-black"
                                  : "font-normal text-gray-600",
                              )}
                            >
                              {notis.title}
                            </h2>
                          </div>
                          <p
                            className={clsx(
                              "truncate",
                              notis.status === "UNREAD"
                                ? "text-black font-semibold"
                                : "text-gray-500 font-normal",
                            )}
                          >
                            {notis.message}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No notifications</p>
                    )
                  ) : (
                    <p className="text-sm text-gray-500">Loading...</p>
                  )}
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
          <Dialog.Root open={showDetails} onOpenChange={setShowDetails}>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" />
              <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[90%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title className="text-xl font-semibold">
                    Notification Details
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <button
                      onClick={() => setShowDetails(false)}
                      className="text-gray-500 hover:text-black cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </Dialog.Close>
                </div>

                {selectedNoti && (
                  <div className="space-y-2">
                    <h2 className="text-lg font-bold text-black">
                      {selectedNoti.title}
                    </h2>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {selectedNoti.message}
                    </p>
                  </div>
                )}
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>

      {currentUser?.wallets && currentUser?.wallets.length > 0 ? (
        <div>
          <Card className="bg-white text-black shadow-xl">
            <CardContent className="py-4">
              <div className="flex flex-row gap-1 items-center">
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex flex-row items-center gap-1 cursor-pointer">
                    <p className="text-sm">
                      {selectedWallet?.name || "Select Wallet"}
                    </p>
                    <ChevronDownCircle className="w-4 h-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Wallets</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {user?.wallets.map((wallet, idx) => (
                      <DropdownMenuItem
                        key={idx}
                        onClick={() => setSelectedWallet(wallet)}
                        className={clsx(
                          "cursor-pointer",
                          selectedWallet?.name === wallet.name &&
                            "font-bold text-indigo-600",
                        )}
                      >
                        {wallet.name}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => navigate("/create-wallet")}
                    >
                      Create Wallet <PlusCircle className="w-4 h-4 ml-2" />
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="flex items-center gap-2">
                  <h2
                    className="text-sm font-extralight dark:text-white text-gray-400 truncate max-w-[200px]"
                    title={selectedWallet?.address}
                  >
                    {selectedWallet?.address.slice(0, 6)}...
                    {selectedWallet?.address.slice(-4)}
                  </h2>
                  <button
                    onClick={copyToClipboard}
                    className="text-gray-500 hover:text-black dark:hover:text-white cursor-pointer"
                    title="Copy to clipboard"
                  >
                    <Copy size={18} />
                  </button>
                  {copied && (
                    <span className="text-sm text-green-500">Copied!</span>
                  )}
                </div>
              </div>
              <div className="text-3xl font-bold">
                {selectedWallet?.balance?.toLocaleString(undefined, {
                  minimumFractionDigits: 6,
                  maximumFractionDigits: 8,
                }) || "0.000000"}{" "}
                ETH
              </div>
              <div className="flex gap-4 mt-5">
                <Button
                  onClick={() =>
                    navigate(`/send-crypto/${selectedWallet?._id}`)
                  }
                  className="flex items-center gap-2 flex-1 bg-black text-white cursor-pointer transition-all 
                 hover:bg-white hover:text-black hover:shadow-xl hover:border-2 hover:border-black"
                >
                  {/* No color class on the icon itself; it inherits from the button */}
                  <FiUpload className="w-5 h-5" />
                  Send
                </Button>
                <Dialog.Root>
                  <Dialog.Trigger asChild>
                    <Button
                      className="flex-1 bg-black text-white cursor-pointer transition-all 
             hover:bg-white hover:text-black hover:border hover:shadow-xl 
             hover:border-2 hover:border-black flex items-center gap-2"
                    >
                      <FiDownload className="w-5 h-5" />
                      Receive
                    </Button>
                  </Dialog.Trigger>
                  <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[90%] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
                      <div className="flex justify-between items-center mb-4">
                        <Dialog.Title className="text-lg font-bold">
                          Receive Crypto
                        </Dialog.Title>
                        <Dialog.Close asChild>
                          <button className="text-gray-500 hover:text-black cursor-pointer">
                            <X className="w-5 h-5" />
                          </button>
                        </Dialog.Close>
                      </div>
                      <div className="flex flex-col items-center space-y-4">
                        {selectedWallet?.address ? (
                          <>
                            <div className="bg-white p-4 border rounded-lg">
                              <QRCode value={selectedWallet?.address} />
                            </div>
                            <p className="font-mono text-center text-sm break-all text-gray-600">
                              {selectedWallet?.address}
                            </p>
                          </>
                        ) : (
                          <p className="text-gray-500">No address available</p>
                        )}
                      </div>
                    </Dialog.Content>
                  </Dialog.Portal>
                </Dialog.Root>
              </div>
              {/*<div className="flex gap-2 text-sm text-green-400 mt-1">
                <span>+ ${selectedWallet?.change ?? "0.00"}</span>
                <span>+ {selectedWallet?.percentChange ?? "0.00"}%</span>
              </div>*/}
            </CardContent>
          </Card>

          {/* Assets */}
          {/*<div className="space-y-3">
            <h1 className="font-extrabold text-2xl underline p-3">Assets</h1>
            {selectedWallet.assets.map((asset, i) => (
              <Card
                key={i}
                className="bg-white shadow-xl text-black p-4 flex flex-row justify-between"
              >
                <div className="flex flex-col">
                  <span className="text-xl font-bold">{asset.name}</span>
                  <span className="text-sm text-gray-400">
                    ${asset.usdBalance || "0.00"}
                  </span>
                </div>
                <span className="text-black font-bold">
                  {asset.balance || "0.00"}
                </span>
              </Card>
            ))}
          </div>*/}
        </div>
      ) : (
        <div className="flex flex-col gap-8 items-center justify-center min-h-screen px-4">
          <h1 className="text-4xl font-bold text-center text-gray-800">
            Get Started
          </h1>

          <div className="flex flex-col md:flex-row gap-6 w-full max-w-2xl">
            {/* Create Wallet Card */}
            <Card
              className="flex-1 cursor-pointer transition-transform hover:scale-105 hover:shadow-2xl bg-white text-black"
              onClick={() => navigate("/create-wallet")}
            >
              <CardContent className="p-6 flex flex-col items-center justify-center gap-4">
                <PlusCircle className="w-10 h-10 text-indigo-600" />
                <div className="text-xl font-semibold">Create New Wallet</div>
                <p className="text-sm text-gray-500 text-center">
                  Generate a new secure wallet with a 12-word recovery phrase.
                </p>
              </CardContent>
            </Card>

            {/* Import Wallet Card */}
            <Card
              className="flex-1 cursor-pointer transition-transform hover:scale-105 hover:shadow-2xl bg-white text-black"
              onClick={() => console.log("Import wallet")}
            >
              <CardContent className="p-6 flex flex-col items-center justify-center gap-4">
                <Download className="w-10 h-10 text-green-600" />
                <div className="text-xl font-semibold">Import Wallet</div>
                <p className="text-sm text-gray-500 text-center">
                  Already have a wallet? Import using your seed phrase.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      <Dialog.Root open={showRevealPhrase} onOpenChange={setShowRevealPhrase}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[90%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <Dialog.Title className="text-xl font-bold">
              Your Recovery Phrase
            </Dialog.Title>

            {confirmationIndices.length === 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setShow((prev) => !prev)}
                    className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                    <span>{show ? "Hide" : "Reveal"} Mnemonic</span>
                  </button>

                  <button
                    onClick={handleCopy}
                    className="flex items-center space-x-1 text-sm text-gray-600 hover:text-black"
                  >
                    <Copy size={16} />
                    <span>Copy</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  {mnemonicWords.map((word, idx) => (
                    <div
                      key={idx}
                      className={`bg-gray-100 p-2 rounded font-mono text-sm text-black transition duration-200 ${
                        show ? "blur-none" : "blur-sm"
                      }`}
                    >
                      {idx + 1}. {word}
                    </div>
                  ))}
                </div>
              </div>
              // <div className="grid grid-cols-3 gap-2 text-center">
              //   {mnemonicWords.map((word, idx) => (
              //     <div
              //       key={idx}
              //       className="bg-gray-100 p-2 rounded font-mono text-sm text-black"
              //     >
              //       {idx + 1}. {word}
              //     </div>
              //   ))}
              // </div>
            )}

            <Button
              className="w-full bg-indigo-600 text-white mt-4"
              onClick={() => {
                // Pick random 3 indices to verify
                const indices = [...Array(12).keys()]
                  .sort(() => 0.5 - Math.random())
                  .slice(0, 3)
                  .sort((a, b) => a - b);
                setConfirmationIndices(indices);
              }}
            >
              I've Saved It
            </Button>

            {confirmationIndices.length > 0 && (
              <div className="space-y-3 mt-4">
                <h3 className="text-sm font-medium text-gray-700">
                  Confirm Words
                </h3>
                {confirmationIndices.map((index, i) => (
                  <Input
                    key={i}
                    placeholder={`Enter word #${index + 1}`}
                    value={userInputs[i]}
                    onChange={(e) => {
                      const newInputs = [...userInputs];
                      newInputs[i] = e.target.value;
                      setUserInputs(newInputs);
                    }}
                    className="bg-gray-50"
                  />
                ))}
                <Button
                  className="w-full mt-2"
                  onClick={async () => {
                    const valid = confirmationIndices.every(
                      (index, i) =>
                        mnemonicWords[index].toLowerCase() ===
                        userInputs[i].toLowerCase().trim(),
                    );
                    if (!valid) {
                      alert("Words don't match. Try again.");
                      return;
                    }

                    // Mark as saved in DB
                    await fetch(
                      `${import.meta.env.VITE_BACKEND_URL}/wallet/mark-phrase-saved/${selectedWallet._id}`,
                      {
                        method: "POST",
                        credentials: "include",
                      },
                    );
                    toast("Seed phrase successfully saved!!!");
                    setShowRevealPhrase(false);
                    setPhraseBanner(true);
                  }}
                >
                  Confirm
                </Button>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <Dialog.Root open={passwordModal} onOpenChange={setPasswordModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[90%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <Dialog.Title className="text-xl font-bold">
              Input your wallet password
            </Dialog.Title>

            <div className="relative w-full">
              <Input
                placeholder="********"
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                className="pr-10" // padding for icon space
              />

              <button
                type="button"
                onClick={handleToggle}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-black focus:outline-none"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <Button
              className="w-full bg-indigo-600 text-white mt-4"
              onClick={() => {
                handleRevealPhrase();
              }}
            >
              {loadingPhrase ? "Please wait!!!" : "Go!"}
            </Button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};

export default Home;
