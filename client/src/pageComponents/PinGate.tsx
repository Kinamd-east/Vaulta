import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router";
import { verifyPin, hasPin } from "@/hooks/pinManager";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import useUserAuthentication from "@/hooks/useUserAuthentication";

const PinGate = () => {
  const [input, setInput] = useState("");
  const [pinValidated, setPinValidated] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();
  const { user, loading } = useUserAuthentication();

  useEffect(() => {
    if (!loading && user?.username) {
      const pinSession = sessionStorage.getItem("pin_verified");

      if (!hasPin(user.username)) {
        sessionStorage.setItem("pin_verified", "true");
        setPinValidated(true);
        navigate("/set-pin");
      } else if (pinSession === "true") {
        setPinValidated(true);
      }

      setChecking(false);
    }
  }, [loading, user]);

  const handleComplete = (value: string) => {
    if (!user?.username) return;

    const isCorrect = verifyPin(user.username, value);

    if (isCorrect) {
      sessionStorage.setItem("pin_verified", "true");
      setPinValidated(true);
      setError("");
    } else {
      setInput(""); // Reset OTP input
      setError("Incorrect PIN");
      sessionStorage.removeItem("pin_verified");
    }
  };

  if (loading || checking) {
    return (
      <div className="p-4 max-w-sm mx-auto text-center">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!pinValidated) {
    return (
      <div className="p-4 max-w-sm mx-auto text-center space-y-4">
        <h2 className="text-xl font-bold">Enter your PIN</h2>
        <InputOTP
          maxLength={4}
          value={input}
          onChange={setInput}
          onComplete={handleComplete}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
          </InputOTPGroup>
        </InputOTP>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    );
  }

  return <Outlet />;
};

export default PinGate;
