
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, Car } from "lucide-react";
import { useNavigate } from "react-router-dom";

const RegisterChoice = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/login")}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="bg-viaja-gradient text-white px-4 py-2 rounded-lg font-bold text-lg">
            Viaja+ JF
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Escolha seu Perfil
          </h1>
          <p className="text-gray-600">
            Selecione como deseja se cadastrar no sistema
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card 
            className="cursor-pointer border-2 border-transparent hover:border-primary transition-all duration-300 hover:shadow-xl"
            onClick={() => navigate("/register/patient")}
          >
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-viaja-blue" />
              </div>
              <CardTitle className="text-xl text-viaja-blue">
                Quero me cadastrar como
              </CardTitle>
              <div className="text-2xl font-bold text-gray-800">
                PACIENTE
              </div>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-6">
                Para agendar e solicitar transporte para consultas médicas e exames
              </p>
              <Button className="w-full h-12 viaja-gradient text-white font-semibold rounded-lg">
                Cadastrar como Paciente
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer border-2 border-transparent hover:border-secondary transition-all duration-300 hover:shadow-xl"
            onClick={() => navigate("/register/driver")}
          >
            <CardHeader className="text-center pb-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Car className="w-10 h-10 text-viaja-green" />
              </div>
              <CardTitle className="text-xl text-viaja-green">
                Quero me cadastrar como
              </CardTitle>
              <div className="text-2xl font-bold text-gray-800">
                MOTORISTA
              </div>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-6">
                Para oferecer transporte seguro aos pacientes do município
              </p>
              <Button className="w-full h-12 bg-secondary text-white font-semibold rounded-lg hover:bg-secondary/90">
                Cadastrar como Motorista
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <Button
            variant="outline"
            onClick={() => navigate("/login")}
            className="border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            Já tenho conta - Fazer Login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RegisterChoice;
