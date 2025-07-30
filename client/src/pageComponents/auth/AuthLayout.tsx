import { Outlet } from "react-router";
import { Navigate } from "react-router";
import useUserAuthentication from "../../hooks/useUserAuthentication";

const AuthLayout = () => {
  const { user, loading } = useUserAuthentication();

  if (loading) return <h1>Loading...</h1>;
  return !user ? (
    <div>
      <Outlet />
    </div>
  ) : (
    <Navigate to="/" />
  );
};

export default AuthLayout;
