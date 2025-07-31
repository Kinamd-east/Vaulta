import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";

const Signin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/auth/login`,
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
        throw new Error(errorData.message || "Signin failed");
        setLoading(false);
      }

      setLoading(false);
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
            <h2 className="text-2xl font-bold mb-4 text-center">Get back in</h2>
            <form className="space-y-4" onSubmit={handleSignin}>
              <Input
                type="email"
                name="email"
                placeholder="johndoe@gmail.com"
                value={form.email}
                onChange={handleChange}
                className="bg-white/5 text-black placeholder-white/90 border-white/20"
                required
              />
              <Input
                type="password"
                name="password"
                placeholder="**********"
                value={form.password}
                onChange={handleChange}
                className="bg-white/5 text-black placeholder-white/90 border-white/20"
                required
              />
              <Button type="submit" className="w-full mt-2 cursor-pointer">
                {loading ? "Please wait..." : "Sign In"}
              </Button>
              {error && <p style={{ color: "red" }}>{error}</p>}
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Signin;
