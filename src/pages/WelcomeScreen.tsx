
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Shield, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const WelcomeScreen = () => {
  const navigate = useNavigate();
  const cityInitials = "JF"; // Juiz de Fora - MG, pode ser dinâmico

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="bg-viaja-gradient text-white px-4 py-2 rounded-lg font-bold text-xl">
            Viaja+ {cityInitials}
          </div>
          <div className="text-sm text-gray-600">
            Juiz de Fora - MG
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Bem-vindo ao Viaja+
          </h1>
          
          <p className="text-xl text-gray-600 mb-12">
            Transporte gratuito e seguro para consultas médicas e exames de saúde
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button 
              size="lg" 
              className="viaja-gradient text-white px-8 py-4 text-lg rounded-full hover:opacity-90 transition-opacity"
              onClick={() => navigate("/login")}
            >
              Fazer Login
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-primary text-primary px-8 py-4 text-lg rounded-full hover:bg-primary hover:text-white transition-colors"
              onClick={() => navigate("/register")}
            >
              Criar Conta
            </Button>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-viaja-blue" />
                </div>
                <h3 className="text-2xl font-bold text-viaja-blue mb-4">Gratuito</h3>
                <p className="text-gray-600 leading-relaxed">
                  Transporte 100% gratuito para consultas médicas, exames e tratamentos de saúde.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-viaja-green" />
                </div>
                <h3 className="text-2xl font-bold text-viaja-green mb-4">Seguro</h3>
                <p className="text-gray-600 leading-relaxed">
                  Motoristas qualificados e veículos seguros para seu transporte com total segurança.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-viaja-orange" />
                </div>
                <h3 className="text-2xl font-bold text-viaja-orange mb-4">Pontual</h3>
                <p className="text-gray-600 leading-relaxed">
                  Agendamento fácil e motoristas pontuais para não atrasar suas consultas.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
