import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { SiEthereum } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const CreateWallet = () => {
  const [selectedChain, setSelectedChain] = useState<"ethereum" | "solana">(
    "ethereum",
  );
  const [walletName, setWalletName] = useState("");
  const [isCreatingWallet, setisCreatingWallet] = useState(false);
  const [walletPassword, setWalletPassword] = useState("");
  const navigate = useNavigate();
  const [walletConfirmPassword, setWalletConfirmPassword] = useState("");
  const [walletCreated, setWalletCreated] = useState(false);

  const handleChainSelect = (chain: "ethereum" | "solana") => {
    setSelectedChain(chain);
  };

  const handleCreateWallet = async () => {
    if (walletName === "") {
      toast.error("Wallet name can't be empty");
      return;
    }

    if (walletPassword === "") {
      toast.error("Your wallet needs to be secured with a password...");
      return;
    }

    if (walletPassword.length < 8) {
      toast.error("Password should be more than 8 characters");
      return;
    }

    if (walletConfirmPassword !== walletPassword) {
      toast.error("Your passwords don't match...");
      return;
    }
    setisCreatingWallet(true);
    const walletInfo = {
      name: walletName,
      chain: selectedChain,
      password: walletPassword,
    };

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/wallet/create`,
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
        toast.error(errorData.message);
        throw new Error(errorData.message || "Wallet creation failed");
        setisCreatingWallet(false);
      }

      // Redirect to dashboard or home after successful signup
      setisCreatingWallet(false);
      setWalletCreated(true);
    } catch (err: any) {
      setisCreatingWallet(false);
    }
    console.log(`${walletName} should be created for the ${selectedChain}`);
  };

  if (isCreatingWallet) return <h1> Creating Wallet....... </h1>;

  if (walletCreated) {
    return (
      <div className="flex flex-col items-center justify-center mt-12 space-y-4">
        <h2 className="text-2xl font-bold text-center text-green-600">
          🎉 Wallet Created Successfully!
        </h2>
        <p className="text-gray-500 text-center">
          Your {selectedChain} wallet named <strong>{walletName}</strong> has
          been created. You can view your wallet info in the settings.
        </p>
        <div className="flex flex-row gap-2 items-center">
          <Button onClick={() => setWalletCreated(false)}>
            Create Another Wallet
          </Button>
          <Button onClick={() => navigate("/")}>Go to home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto">
      <div className="flex flex-col gap-1">
        <label className="text-sm text-gray-600 font-medium">Wallet Name</label>
        <Input
          placeholder="Enter a name for your wallet"
          value={walletName}
          onChange={(e) => setWalletName(e.target.value)}
          className="border border-gray-300 rounded-md p-2"
        />
        <Input
          placeholder="Wallet Password"
          type="password"
          value={walletPassword}
          onChange={(e) => setWalletPassword(e.target.value)}
          className="border border-gray-300 rounded-md p-2"
        />
        <Input
          placeholder="Confirm Password"
          type="password"
          value={walletConfirmPassword}
          onChange={(e) => setWalletConfirmPassword(e.target.value)}
          className="border border-gray-300 rounded-md p-2"
        />
      </div>
      <div className="flex flex-col md:flex-row gap-6">
        <Card
          onClick={() => handleChainSelect("ethereum")}
          className={`flex-1 cursor-pointer transition-transform hover:scale-105 bg-white text-black border-2 ${
            selectedChain === "ethereum"
              ? "border-purple-600 shadow-purple-400 shadow-md"
              : "border-transparent"
          }`}
        >
          <CardContent className="p-6 flex flex-col items-center justify-center gap-4">
            <SiEthereum className="text-purple-600 w-6 h-6" />
            <div className="text-xl font-semibold">Ethereum</div>
            <p className="text-sm text-gray-500 text-center">
              Create or import an Ethereum wallet.
            </p>
          </CardContent>
        </Card>

        {/* Solana Card */}
        {/*<Card
          onClick={() => handleChainSelect("solana")}
          className={`flex-1 cursor-pointer transition-transform hover:scale-105 bg-white text-black border-2 ${
            selectedChain === "solana"
              ? "border-green-500 shadow-green-300 shadow-md"
              : "border-transparent"
          }`}
        >
          <CardContent className="p-6 flex flex-col items-center justify-center gap-4">
            <SiSolana className="text-green-400 w-6 h-6" />
            <div className="text-xl font-semibold">Solana</div>
            <p className="text-sm text-gray-500 text-center">
              Create or import a Solana wallet.
            </p>
          </CardContent>
        </Card>*/}
      </div>
      <Button className="cursor-pointer" onClick={handleCreateWallet}>
        Create Wallet
      </Button>
    </div>
  );
};

export default CreateWallet;
