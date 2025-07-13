
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, Users, Car } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const RegistrationSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userType = location.state?.userType || "patient";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-viaja-gradient text-white px-4 py-2 rounded-lg font-bold text-lg inline-block">
            Viaja+ JF
          </div>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              Cadastro Enviado!
            </CardTitle>
          </CardHeader>

          <CardContent className="text-center space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  {userType === "driver" ? (
                    <Car className="w-6 h-6 text-viaja-green" />
                  ) : (
                    <Users className="w-6 h-6 text-viaja-blue" />
                  )}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-800">
                    Cadastro de {userType === "driver" ? "Motorista" : "Paciente"}
                  </p>
                  <p className="text-sm text-gray-600">
                    Dados enviados com sucesso
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <span className="font-semibold text-yellow-800">
                    Aguarde Aprovação
                  </span>
                </div>
                <p className="text-sm text-yellow-700 text-center">
                  Seu cadastro está sendo analisado pela Prefeitura. 
                  Você receberá uma notificação quando for aprovado.
                </p>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <strong>Próximos passos:</strong>
                </p>
                <ul className="text-left space-y-1">
                  <li>• Análise dos documentos enviados</li>
                  <li>• Verificação dos dados pessoais</li>
                  <li>• Aprovação pela equipe municipal</li>
                  <li>• Liberação do acesso ao sistema</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <strong>Tempo estimado:</strong> 2-5 dias úteis
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Em caso de dúvidas, entre em contato com a Secretaria de Saúde
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => navigate("/login")}
                className="w-full h-12 viaja-gradient text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
              >
                Ir para Login
              </Button>
              
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="w-full h-12 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Voltar ao Início
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegistrationSuccess;
