import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Settings as SettingsIcon, Save, Upload, User, FileText, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const { toast } = useToast();
  
  const [municipalityData, setMunicipalityData] = useState({
    cityName: "Juiz de Fora",
    initials: "JF",
    logo: ""
  });

  const [adminData, setAdminData] = useState({
    name: "Administrador Municipal",
    email: "adm@adm.com",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [termsData, setTermsData] = useState({
    termsOfUse: "Termos de uso do aplicativo Viaja+...",
    privacyPolicy: "Política de privacidade do aplicativo Viaja+...",
    welcomeMessage: "Bem-vindo ao Viaja+! O aplicativo de transporte público municipal que conecta pacientes e motoristas.",
    supportContact: "(32) 3690-8000"
  });

  const handleSaveMunicipality = () => {
    toast({
      title: "Configurações Salvas",
      description: "Os dados do município foram atualizados com sucesso.",
    });
  };

  const handleSaveAdmin = () => {
    if (adminData.newPassword && adminData.newPassword !== adminData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Perfil Atualizado",
      description: "Seus dados foram atualizados com sucesso.",
    });
  };

  const handleSaveTerms = () => {
    toast({
      title: "Textos Atualizados",
      description: "Os termos e textos do aplicativo foram salvos.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600">Gerencie as configurações do sistema e do município</p>
      </div>

      {/* Dados do Município */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Dados do Município
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cityName">Nome da Cidade</Label>
              <Input
                id="cityName"
                value={municipalityData.cityName}
                onChange={(e) => setMunicipalityData(prev => ({ ...prev, cityName: e.target.value }))}
                placeholder="Nome da cidade"
              />
            </div>
            <div>
              <Label htmlFor="initials">Iniciais (para logo)</Label>
              <Input
                id="initials"
                value={municipalityData.initials}
                onChange={(e) => setMunicipalityData(prev => ({ ...prev, initials: e.target.value }))}
                placeholder="Ex: JF"
                maxLength={5}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="logo">Logo do Município</Label>
            <div className="mt-2 flex items-center gap-4">
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Fazer Upload da Logo
              </Button>
              <span className="text-sm text-gray-500">Formatos aceitos: PNG, JPG (máx. 2MB)</span>
            </div>
          </div>

          <Button onClick={handleSaveMunicipality} className="w-full md:w-auto">
            <Save className="h-4 w-4 mr-2" />
            Salvar Dados do Município
          </Button>
        </CardContent>
      </Card>

      {/* Perfil do Administrador */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Perfil do Administrador
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="adminName">Nome</Label>
              <Input
                id="adminName"
                value={adminData.name}
                onChange={(e) => setAdminData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome completo"
              />
            </div>
            <div>
              <Label htmlFor="adminEmail">E-mail</Label>
              <Input
                id="adminEmail"
                type="email"
                value={adminData.email}
                onChange={(e) => setAdminData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="E-mail de acesso"
              />
            </div>
          </div>

          <Separator />
          
          <div>
            <h3 className="font-medium mb-3">Alterar Senha</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="currentPassword">Senha Atual</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={adminData.currentPassword}
                  onChange={(e) => setAdminData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="Senha atual"
                />
              </div>
              <div>
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={adminData.newPassword}
                  onChange={(e) => setAdminData(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Nova senha"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={adminData.confirmPassword}
                  onChange={(e) => setAdminData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirmar nova senha"
                />
              </div>
            </div>
          </div>

          <Button onClick={handleSaveAdmin} className="w-full md:w-auto">
            <Save className="h-4 w-4 mr-2" />
            Salvar Perfil
          </Button>
        </CardContent>
      </Card>

      {/* Termos e Textos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Termos e Textos do Aplicativo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="welcomeMessage">Mensagem de Boas-vindas</Label>
            <Textarea
              id="welcomeMessage"
              value={termsData.welcomeMessage}
              onChange={(e) => setTermsData(prev => ({ ...prev, welcomeMessage: e.target.value }))}
              placeholder="Mensagem exibida na tela inicial"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="supportContact">Contato de Suporte</Label>
            <Input
              id="supportContact"
              value={termsData.supportContact}
              onChange={(e) => setTermsData(prev => ({ ...prev, supportContact: e.target.value }))}
              placeholder="Telefone ou e-mail de suporte"
            />
          </div>

          <div>
            <Label htmlFor="termsOfUse">Termos de Uso</Label>
            <Textarea
              id="termsOfUse"
              value={termsData.termsOfUse}
              onChange={(e) => setTermsData(prev => ({ ...prev, termsOfUse: e.target.value }))}
              placeholder="Termos de uso do aplicativo"
              rows={6}
            />
          </div>

          <div>
            <Label htmlFor="privacyPolicy">Política de Privacidade</Label>
            <Textarea
              id="privacyPolicy"
              value={termsData.privacyPolicy}
              onChange={(e) => setTermsData(prev => ({ ...prev, privacyPolicy: e.target.value }))}
              placeholder="Política de privacidade"
              rows={6}
            />
          </div>

          <Button onClick={handleSaveTerms} className="w-full md:w-auto">
            <Save className="h-4 w-4 mr-2" />
            Salvar Textos
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;