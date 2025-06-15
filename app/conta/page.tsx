"use client"

import { useState, useEffect } from "react"
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { User, Mail, Phone, MapPin, Edit, Save, X, CheckCircle, AlertCircle, Shield } from "lucide-react"

export default function AccountPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  })

  // Carregar dados do usuário
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      })
    }
  }, [user])

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Nome é obrigatório")
      return false
    }
    if (formData.name.trim().length < 2) {
      setError("Nome deve ter pelo menos 2 caracteres")
      return false
    }
    if (!formData.email.trim()) {
      setError("Email é obrigatório")
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Email inválido")
      return false
    }
    if (formData.phone && formData.phone.trim()) {
      const phoneNumbers = formData.phone.replace(/\D/g, "")
      if (phoneNumbers.length < 10 || phoneNumbers.length > 11) {
        setError("Telefone deve ter 10 ou 11 dígitos")
        return false
      }
    }
    return true
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      // Simular chamada da API
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setSuccess("Dados atualizados com sucesso!")
      setIsEditing(false)

      toast({
        title: "Dados atualizados",
        description: "Suas informações foram atualizadas com sucesso.",
      })
    } catch (error) {
      setError("Não foi possível atualizar os dados. Tente novamente.")
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os dados.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      })
    }
    setIsEditing(false)
    setError("")
    setSuccess("")
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (error) setError("")
    if (success) setSuccess("")
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3")
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dados da Conta</h1>
          <p className="text-gray-600">Gerencie suas informações pessoais</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Informações Pessoais
              </CardTitle>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} disabled={isLoading}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              ) : (
                <div className="space-x-2">
                  <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={isLoading}>
                    <Save className="w-4 h-4 mr-2" />
                    {isLoading ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Nome Completo
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  disabled={!isEditing || isLoading}
                  placeholder="Seu nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  disabled={!isEditing || isLoading}
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Telefone
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value)
                  handleInputChange("phone", formatted)
                }}
                disabled={!isEditing || isLoading}
                placeholder="(11) 99999-9999"
                maxLength={15}
              />
            </div>

            {/* Informações adicionais somente leitura */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Informações da Conta
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-600">ID da Conta</Label>
                  <p className="font-mono text-xs bg-gray-100 p-2 rounded">{user?.id}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Tipo de Conta</Label>
                  <p className="capitalize">{user?.role?.toLowerCase()}</p>
                </div>
              </div>
            </div>

            {/* Links para outras seções */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações Relacionadas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" asChild className="justify-start">
                  <a href="/seguranca">
                    <Shield className="w-4 h-4 mr-2" />
                    Alterar Senha
                  </a>
                </Button>
                <Button variant="outline" asChild className="justify-start">
                  <a href="/checkout">
                    <MapPin className="w-4 h-4 mr-2" />
                    Gerenciar Endereços
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  )
}
