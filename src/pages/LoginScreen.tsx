
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const LoginScreen = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [credentials, setCredentials] = useState({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar se é login do admin
    if (credentials.email === "adm@adm.com" && credentials.password === "adm@2025") {
      navigate("/admin/dashboard");
      return;
    }
    
    setLoading(true);

    try {
      // Tentar fazer login com Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        if (error.message === "Invalid login credentials") {
          toast({
            title: "Erro de Login",
            description: "E-mail ou senha incorretos.",
            variant: "destructive",
          });
        } else if (error.message === "Email not confirmed") {
          toast({
            title: "E-mail não confirmado",
            description: "Verifique sua caixa de entrada e confirme seu e-mail antes de fazer login.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro de Login",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      if (data.user) {
        // Buscar perfil do usuário para verificar tipo e status
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('user_type, status')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          toast({
            title: "Erro",
            description: "Erro ao carregar dados do usuário.",
            variant: "destructive",
          });
          return;
        }

        // Verificar se o perfil foi aprovado
        if (profile.status !== 'approved') {
          toast({
            title: "Conta Pendente",
            description: "Sua conta ainda está aguardando aprovação da prefeitura.",
            variant: "destructive",
          });
          await supabase.auth.signOut();
          return;
        }

        // Redirecionar baseado no tipo de usuário
        if (profile.user_type === 'patient') {
          navigate("/patient");
        } else if (profile.user_type === 'driver') {
          navigate("/driver");
        } else {
          toast({
            title: "Erro",
            description: "Tipo de usuário não reconhecido.",
            variant: "destructive",
          });
        }

        toast({
          title: "Login realizado com sucesso!",
          description: `Bem-vindo(a) ao Viaja+ JF!`,
        });
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Erro de Login",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="bg-viaja-gradient text-white px-4 py-2 rounded-lg font-bold text-lg">
            Viaja+ JF
          </div>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-gray-800">
              Fazer Login
            </CardTitle>
            <p className="text-gray-600">
              Entre com suas credenciais para acessar o sistema
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Digite seu e-mail"
                  value={credentials.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="h-12 rounded-lg"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite sua senha"
                  value={credentials.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className="h-12 rounded-lg"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 viaja-gradient text-white text-lg font-semibold rounded-lg hover:opacity-90 transition-opacity"
                disabled={loading}
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600 mb-4">Ainda não tem conta?</p>
              <Button
                variant="outline"
                onClick={() => navigate("/register")}
                className="w-full h-12 border-2 border-primary text-primary font-semibold rounded-lg hover:bg-primary hover:text-white transition-colors"
              >
                Criar Nova Conta
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginScreen;
