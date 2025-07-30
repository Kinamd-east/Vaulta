import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useState, useEffect } from "react";
import useUserAuthentication from "@/hooks/useUserAuthentication"; // update to your actual path
import { useNavigate } from "react-router";
import { setPin, hasPin } from "@/hooks/pinManager";
import { toast } from "sonner";

const SetPin = () => {
  const [pinInput, setPinInput] = useState("");
  const [error, setError] = useState("");
  const { user, loading } = useUserAuthentication();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user?.username) {
      if (hasPin(user.username)) {
        navigate("/"); // or wherever
      }
    }
  }, [loading, user]);

  const handleComplete = (value: string) => {
    if (!user?.username) {
      setError("User not authenticated");
      return;
    }

    // Save PIN securely
    setPin(user.username, value);
    console.log("✅ PIN saved for", user.username, "PIN:", value);

    // Redirect or show success
    toast("Pin Successfully set!!!");
    navigate("/"); // or wherever
  };

  return (
    <div className="space-y-4 p-4 max-w-sm mx-auto">
      <h2 className="text-xl font-bold">Set Your 4-Digit PIN</h2>

      <InputOTP
        maxLength={4}
        value={pinInput}
        onChange={setPinInput}
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
};

export default SetPin;
