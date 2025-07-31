import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import useUserAuthentication from "@/hooks/useUserAuthentication";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useParams } from "react-router";

const SendCrypto = () => {
  const navigate = useNavigate();
  const { user } = useUserAuthentication();
  const { id } = useParams();
  const [isSendingPin, setIsSendingPin] = useState(false);
  const [wallet, setWallet] = useState({
    balance: "",
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [pin, setPin] = useState("");
  const [form, setForm] = useState({
    addressTo: "",
    amountInEth: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleConfirm = async () => {
    setIsSendingPin(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/wallet/send-crypto/${id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            pinCode: pin,
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        toast(data.message);
        setIsSendingPin(false);
        return;
      }

      toast("Transfer complete!");
      navigate("/");
    } catch (err) {
      toast("Transfer failed");
    } finally {
      setIsSendingPin(false);
    }
  };

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/wallet/get-wallet/${id}`,
          {
            credentials: "include",
          },
        );

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to fetch wallet");
        }

        const data = await res.json();
        setWallet(data.wallet); // assume it's already in ETH
      } catch (err: any) {
        console.error("Error fetching balance:", err.message);
      }
    };

    fetchWallet();
  }, [id]);

  const handleSendPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (parseFloat(form.amountInEth) > parseFloat(wallet?.balance ?? "0")) {
      toast("Value exceeding wallet balance");
      setError("Value exceeding wallet balance");
      setLoading(false);
      return;
    }
    if (form.addressTo === "") {
      toast("Address is required");
      setError("Address is required");
      setLoading(false);
      return;
    }

    if (parseFloat(form.amountInEth) === 0) {
      toast("Amount has to be higher than 0");
      setError("Amount has to be higher than 0");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/wallet/confirm-transaction/${id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            addressTo: form.addressTo,
            amountInEth: form.amountInEth,
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.message);
        toast(data.message);
        setLoading(false);
        return;
      }

      setStep(2); // go to OTP step
      toast("Verification code sent!");
      setLoading(false);
    } catch (err: any) {
      toast("Failed to initiate transfer");
      setError("Failed to initiate transfer");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      {step === 1 ? (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="w-full max-w-sm"
        >
          <Card className="bg-black/4 backdrop-blur-md shadow-2xl border-white/10 text-black">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4 text-center">
                Send Crypto
              </h2>
              <form className="space-y-4" onSubmit={handleSendPin}>
                <Input
                  type="text"
                  name="addressTo"
                  placeholder="0x....3de3"
                  value={form.addressTo}
                  onChange={handleChange}
                  className="bg-white/5 text-black placeholder-white/90 border-white/20"
                  required
                />
                <Input
                  type="number"
                  name="amountInEth"
                  placeholder="0.2"
                  value={form.amountInEth}
                  onChange={handleChange}
                  className="bg-white/5 text-black placeholder-white/90 border-white/20"
                  required
                />
                <p className="text-sm text-black font-light">
                  Wallet Balance: {wallet?.balance}
                </p>
                <Button type="submit" className="w-full mt-2 cursor-pointer">
                  {loading ? "Please Wait" : "Send"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="w-full max-w-sm"
        >
          <Card className="bg-black/4 backdrop-blur-md shadow-2xl border-white/10 text-black">
            <CardContent className="p-6 flex flex-col items-center gap-2">
              <h2 className="text-2xl font-bold mb-4 text-center">
                Confirm your email
              </h2>
              <p className="text-gray-500 text-sm font-light">
                Check your email for a code.{" "}
                {user?.email
                  ? `${user?.email.slice(0, 3).toLowerCase()}...@${user?.email
                      .split("@")[1]
                      .toLowerCase()}`
                  : ""}
              </p>
              <InputOTP
                maxLength={6}
                value={pin}
                onChange={setPin}
                onComplete={handleConfirm}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              <Button className="cursor-pointer" onClick={() => navigate("/")}>
                Cancel
              </Button>
              {error && <p style={{ color: "red" }}>{error}</p>}
              {isSendingPin && <p style={{ color: "black" }}>Please Wait...</p>}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default SendCrypto;
