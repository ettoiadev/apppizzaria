"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase-client";

// Estes componentes vêm de @/components/ui/... que o v0 já deve ter criado.
// Se ocorrer algum erro, verificaremos se os arquivos existem.
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [allowRegistration, setAllowRegistration] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function getRegistrationSetting() {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "allow_admin_registration")
        .single();
      
      if (!error && data) {
        setAllowRegistration(data.value === true);
      }
      setLoading(false);
    }
    getRegistrationSetting();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setError("Email ou senha inválidos.");
    } else {
      router.push("/admin/dashboard"); // Página para onde o admin vai após logar
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-[#e5385d]">
            Pizza Express Admin
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full bg-[#e5385d] hover:bg-[#c12f4d]" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            {loading ? <div className="h-5" /> : (
              allowRegistration && (
                <Link href="/admin/register" className="underline">
                  Não tem uma conta? Crie uma agora.
                </Link>
              )
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
