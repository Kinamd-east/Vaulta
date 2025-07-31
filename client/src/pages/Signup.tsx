import { useState } from "react";
import { useNavigate } from "react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Important for session cookies
          body: JSON.stringify(form),
        },
      );

      if (!res.ok) {
        const errorData = await res.json();
        toast(errorData.message);
        throw new Error(errorData.message || "Signup failed");
        setLoading(false);
      }

      // Redirect to dashboard or home after successful signup
      setLoading(false);
      toast("Signup successful, redirecting user....");
      navigate("/");
    } catch (err: any) {
      setLoading(false);
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        <Card className="bg-black/4 backdrop-blur-md shadow-2xl border-white/10 text-black">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4 text-center">
              Create your account
            </h2>

            <form onSubmit={handleSignup}>
              <Input
                type="text"
                name="username"
                placeholder="Username"
                value={form.username}
                onChange={handleChange}
                required
              />
              <Input
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                className="bg-white/5 text-black placeholder-white/90 border-white/20"
                required
              />
              <Input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className="bg-white/5 text-black placeholder-white/90 border-white/20"
                required
              />
              <Button type="submit" className="w-full mt-2 cursor-pointer">
                {loading ? "Please wait..." : "Sign up"}
              </Button>
              {error && <p style={{ color: "red" }}>{error}</p>}
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Signup;
