"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Shield, Save, UserPlus, Lock } from "lucide-react"

interface SecuritySettingsProps {
  settings: any
  onSave: (settings: any) => Promise<boolean>
}

export function SecuritySettings({ settings, onSave }: SecuritySettingsProps) {
  const [localSettings, setLocalSettings] = useState({
    allowAdminRegistration: settings?.allowAdminRegistration || false,
    requireStrongPasswords: settings?.requireStrongPasswords || true,
    sessionTimeout: settings?.sessionTimeout || 60,
    twoFactorEnabled: settings?.twoFactorEnabled || false,
    loginAttemptLimit: settings?.loginAttemptLimit || 5,
    ...settings,
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSettingChange = (key: string, value: any) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    const success = await onSave(localSettings)
    setIsLoading(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Controle de Acesso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="allowAdminRegistration">Permitir Cadastro de Administradores</Label>
              <p className="text-sm text-gray-600">Permite que novos administradores se cadastrem na página de login</p>
            </div>
            <Switch
              id="allowAdminRegistration"
              checked={localSettings.allowAdminRegistration}
              onCheckedChange={(checked) => handleSettingChange("allowAdminRegistration", checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="requireStrongPasswords">Exigir Senhas Fortes</Label>
              <p className="text-sm text-gray-600">
                Força o uso de senhas com pelo menos 8 caracteres, incluindo números e símbolos
              </p>
            </div>
            <Switch
              id="requireStrongPasswords"
              checked={localSettings.requireStrongPasswords}
              onCheckedChange={(checked) => handleSettingChange("requireStrongPasswords", checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Segurança de Sessão
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sessionTimeout">Timeout de Sessão (minutos)</Label>
            <input
              id="sessionTimeout"
              type="number"
              min="15"
              max="480"
              value={localSettings.sessionTimeout}
              onChange={(e) => handleSettingChange("sessionTimeout", Number.parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <p className="text-sm text-gray-600">Tempo limite para sessões inativas (15-480 minutos)</p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="loginAttemptLimit">Limite de Tentativas de Login</Label>
            <input
              id="loginAttemptLimit"
              type="number"
              min="3"
              max="10"
              value={localSettings.loginAttemptLimit}
              onChange={(e) => handleSettingChange("loginAttemptLimit", Number.parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <p className="text-sm text-gray-600">Número máximo de tentativas de login antes do bloqueio temporário</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Autenticação Avançada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="twoFactorEnabled">Autenticação de Dois Fatores</Label>
              <p className="text-sm text-gray-600">
                Adiciona uma camada extra de segurança com códigos SMS ou aplicativo
              </p>
            </div>
            <Switch
              id="twoFactorEnabled"
              checked={localSettings.twoFactorEnabled}
              onCheckedChange={(checked) => handleSettingChange("twoFactorEnabled", checked)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading}>
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  )
}
