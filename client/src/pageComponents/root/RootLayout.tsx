import { Navigate } from "react-router";
import BottomBar from "../BottomBar";
import PinGate from "../PinGate";
import useUserAuthentication from "../../hooks/useUserAuthentication";

const RootLayout = () => {
  const { user, loading } = useUserAuthentication();

  if (loading) return <h1>Loading...</h1>;

  return user ? (
    <div className="flex flex-col min-h-screen">
      <div className="m-2 flex-1 overflow-y-auto pb-24">
        <PinGate />
      </div>
      <BottomBar />
    </div>
  ) : (
    <Navigate to="/sign-up" />
  );
};

export default RootLayout;
