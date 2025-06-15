"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GeneralSettings } from "./general-settings"
import { AppearanceSettings } from "./appearance-settings"
import { DeliverySettings } from "./delivery-settings"
import { PaymentSettings } from "./payment-settings"
import { NotificationSettings } from "./notification-settings"
import { SecuritySettings } from "./security-settings"
import { AdminProfile } from "./admin-profile"
import { Settings, Palette, Truck, CreditCard, Bell, Shield, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function SettingsManagement() {
  const [activeTab, setActiveTab] = useState("general")
  const [settings, setSettings] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings")
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      } else {
        console.error("Failed to load settings")
      }
    } catch (error) {
      console.error("Error loading settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async (newSettings: any) => {
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSettings),
      })

      if (response.ok) {
        setSettings(newSettings)
        toast({
          title: "Sucesso",
          description: "Configurações salvas com sucesso",
        })
        return true
      } else {
        const data = await response.json()
        toast({
          title: "Erro",
          description: data.error || "Falha ao salvar configurações",
          variant: "destructive",
        })
        return false
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações",
        variant: "destructive",
      })
      return false
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600">Gerencie as configurações do sistema</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Geral</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Aparência</span>
          </TabsTrigger>
          <TabsTrigger value="delivery" className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            <span className="hidden sm:inline">Entrega</span>
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">Pagamento</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notificações</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Segurança</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <AdminProfile />
        </TabsContent>

        <TabsContent value="general">
          <GeneralSettings settings={settings} onSave={saveSettings} />
        </TabsContent>

        <TabsContent value="appearance">
          <AppearanceSettings settings={settings} onSave={saveSettings} />
        </TabsContent>

        <TabsContent value="delivery">
          <DeliverySettings settings={settings} onSave={saveSettings} />
        </TabsContent>

        <TabsContent value="payment">
          <PaymentSettings settings={settings} onSave={saveSettings} />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSettings settings={settings} onSave={saveSettings} />
        </TabsContent>

        <TabsContent value="security">
          <SecuritySettings settings={settings} onSave={saveSettings} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
