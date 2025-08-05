import React, { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { ethers } from "ethers";

const SeedPhraseInput = () => {
  const [words, setWords] = useState<string[]>(Array(12).fill(""));
  const [walletName, setWalletName] = useState("");
  const [walletPassword, setWalletPassword] = useState("");
  const [walletConfirmPassword, setWalletConfirmPassword] = useState("");
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [walletCreated, setWalletCreated] = useState(false);
  const [selectedChain, setSelectedChain] = useState("ethereum"); // can be updated dynamically
  const [showPassword, setShowPassword] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  const handleChange = (index: number, value: string) => {
    const cleaned = value.trim().replace(/\s/g, "");

    const updatedWords = [...words];
    updatedWords[index] = cleaned;
    setWords(updatedWords);

    // Move to next input if user types a full word or space
    if (value.endsWith(" ") && index < 11) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if ((e.key === " " || e.key === "Enter") && index < 11) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }

    if (e.key === "Backspace" && words[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text");
    const split = pasted.trim().toLowerCase().split(/\s+/);

    if (split.length === 12) {
      setWords(split.slice(0, 12));
      // Focus the last input
      inputRefs.current[11]?.focus();
      e.preventDefault();
    }
  };

  const handleCreateWallet = async () => {
    if (walletName.trim() === "") {
      toast.error("Wallet name can't be empty");
      return;
    }

    if (walletPassword.trim() === "") {
      toast.error("Your wallet needs to be secured with a password");
      return;
    }

    if (walletPassword.length < 8) {
      toast.error("Password should be at least 8 characters");
      return;
    }

    if (walletPassword !== walletConfirmPassword) {
      toast.error("Your passwords don't match");
      return;
    }

    if (words.some((word) => word.trim() === "")) {
      toast.error("All 12 seed words must be filled");
      return;
    }

    const mnemonic = words.join(" ").toLowerCase();

    // Validate mnemonic format
    if (!ethers.utils.isValidMnemonic(mnemonic)) {
      toast.error("Invalid seed phrase");
      return;
    }

    setIsCreatingWallet(true);

    const walletInfo = {
      name: walletName,
      chain: selectedChain,
      password: walletPassword,
      mnemonic,
    };

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/wallet/import-wallet`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(walletInfo),
        },
      );

      if (!res.ok) {
        const errorData = await res.json();
        toast.error(errorData.message || "Wallet creation failed");
        setIsCreatingWallet(false);
        return;
      }

      // Optional: Refresh user info
      await refetchUser();

      setIsCreatingWallet(false);
      setWalletCreated(true);
      toast.success("Wallet successfully imported!");
      navigate("/");
    } catch (err) {
      console.error("Wallet import failed:", err);
      toast.error("An error occurred while importing wallet");
      setIsCreatingWallet(false);
    }
  };

  return (
    <div style={{ maxWidth: "450px", margin: "0 auto" }}>
      <h2>Import Wallet</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        {words.map((word, index) => (
          <input
            key={index}
            value={word}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={index === 0 ? handlePaste : undefined}
            ref={(el) => (inputRefs.current[index] = el)}
            placeholder={`Word ${index + 1}`}
            style={{
              padding: "8px",
              fontSize: "16px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              textTransform: "lowercase",
            }}
          />
        ))}
      </div>

      <input
        type="text"
        value={walletName}
        onChange={(e) => setWalletName(e.target.value)}
        placeholder="Wallet Name"
        style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
      />

      <div style={{ position: "relative", marginBottom: "10px" }}>
        <input
          type={showPassword ? "text" : "password"}
          value={walletPassword}
          onChange={(e) => setWalletPassword(e.target.value)}
          placeholder="Wallet Password"
          style={{ width: "100%", padding: "8px" }}
        />
        <button
          onClick={() => setShowPassword(!showPassword)}
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>

      <input
        type={showPassword ? "text" : "password"}
        value={walletConfirmPassword}
        onChange={(e) => setWalletConfirmPassword(e.target.value)}
        placeholder="Confirm Password"
        style={{ width: "100%", padding: "8px", marginBottom: "20px" }}
      />

      <button
        onClick={handleCreateWallet}
        disabled={isCreatingWallet}
        style={{
          width: "100%",
          padding: "10px",
          backgroundColor: "#4f46e5",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        {isCreatingWallet ? "Importing..." : "Import Wallet"}
      </button>
    </div>
  );
};

export default SeedPhraseInput;
