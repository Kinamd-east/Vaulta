import { Routes, Route } from "react-router";
import { Toaster } from "@/components/ui/sonner";
import "./index.css";
import RootLayout from "./pageComponents/root/RootLayout";
import AuthLayout from "./pageComponents/auth/AuthLayout";
import Signup from "./pages/Signup";
import SendCrypto from "./pages/SendCrypto";
import Home from "./pages/Home";
import Signin from "./pages/Signin";
import SetPin from "./pages/SetPin";
import CreateWallet from "./pages/CreateWallet";

const App = () => {
  return (
    <div>
      <Routes>
        {/*<Route path="/" element={<Home />} />*/}
        <Route element={<AuthLayout />}>
          <Route path="/sign-up" element={<Signup />} />
          <Route path="/sign-in" element={<Signin />} />
        </Route>
        <Route element={<RootLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/set-pin" element={<SetPin />} />
          <Route path="/send-crypto/:id" element={<SendCrypto />} />
          <Route path="/create-wallet" element={<CreateWallet />} />
        </Route>
      </Routes>
      <Toaster />
    </div>
  );
};

export default App;
