"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DeliveryPersonModal } from "./delivery-person-modal"
import { AssignOrderModal } from "./assign-order-modal"
import { Search, Plus, Edit, Eye, Phone, Mail, MapPin, Clock, Package } from "lucide-react"
import type { DeliveryPerson } from "@/types/admin"

export function DeliveryManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState<DeliveryPerson | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null)

  // Mock delivery personnel data
  const mockDeliveryPersons: DeliveryPerson[] = [
    {
      id: "1",
      name: "Carlos Silva",
      email: "carlos.silva@pizzaexpress.com",
      phone: "(11) 99999-1111",
      vehicleType: "motorcycle",
      vehiclePlate: "ABC-1234",
      status: "available",
      currentLocation: "Centro - São Paulo/SP",
      totalDeliveries: 245,
      averageRating: 4.8,
      averageDeliveryTime: 25,
      createdAt: "2023-06-15T10:00:00Z",
      lastActiveAt: "2024-01-21T14:30:00Z",
      currentOrders: [],
    },
    {
      id: "2",
      name: "João Santos",
      email: "joao.santos@pizzaexpress.com",
      phone: "(11) 99999-2222",
      vehicleType: "motorcycle",
      vehiclePlate: "DEF-5678",
      status: "busy",
      currentLocation: "Jardins - São Paulo/SP",
      totalDeliveries: 189,
      averageRating: 4.6,
      averageDeliveryTime: 28,
      createdAt: "2023-08-20T09:00:00Z",
      lastActiveAt: "2024-01-21T15:45:00Z",
      currentOrders: ["1001", "1002"],
    },
    {
      id: "3",
      name: "Maria Oliveira",
      email: "maria.oliveira@pizzaexpress.com",
      phone: "(11) 99999-3333",
      vehicleType: "bicycle",
      vehiclePlate: "BIC-001",
      status: "available",
      currentLocation: "Vila Madalena - São Paulo/SP",
      totalDeliveries: 156,
      averageRating: 4.9,
      averageDeliveryTime: 22,
      createdAt: "2023-09-10T11:00:00Z",
      lastActiveAt: "2024-01-21T16:00:00Z",
      currentOrders: [],
    },
    {
      id: "4",
      name: "Pedro Costa",
      email: "pedro.costa@pizzaexpress.com",
      phone: "(11) 99999-4444",
      vehicleType: "motorcycle",
      vehiclePlate: "GHI-9012",
      status: "offline",
      currentLocation: "Pinheiros - São Paulo/SP",
      totalDeliveries: 98,
      averageRating: 4.5,
      averageDeliveryTime: 30,
      createdAt: "2023-11-05T08:00:00Z",
      lastActiveAt: "2024-01-20T18:00:00Z",
      currentOrders: [],
    },
  ]

  const { data: deliveryPersons = mockDeliveryPersons, isLoading } = useQuery({
    queryKey: ["delivery-persons"],
    queryFn: async () => {
      return mockDeliveryPersons
    },
  })

  // Filter delivery persons
  const filteredDeliveryPersons = deliveryPersons
    .filter((person) => {
      const matchesSearch =
        person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.phone.includes(searchTerm)

      const matchesStatus = statusFilter === "all" || person.status === statusFilter

      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      // Sort by status priority: available > busy > offline
      const statusPriority = { available: 3, busy: 2, offline: 1 }
      return statusPriority[b.status] - statusPriority[a.status]
    })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800"
      case "busy":
        return "bg-yellow-100 text-yellow-800"
      case "offline":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "available":
        return "Disponível"
      case "busy":
        return "Ocupado"
      case "offline":
        return "Offline"
      default:
        return "Desconhecido"
    }
  }

  const getVehicleIcon = (vehicleType: string) => {
    switch (vehicleType) {
      case "motorcycle":
        return "🏍️"
      case "bicycle":
        return "🚲"
      case "car":
        return "🚗"
      default:
        return "🛵"
    }
  }

  const getVehicleLabel = (vehicleType: string) => {
    switch (vehicleType) {
      case "motorcycle":
        return "Moto"
      case "bicycle":
        return "Bicicleta"
      case "car":
        return "Carro"
      default:
        return "Veículo"
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Entregadores</h1>
          <p className="text-gray-600">Gerencie sua equipe de entrega</p>
        </div>

        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Entregador
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Entregadores</p>
                <p className="text-2xl font-bold">{deliveryPersons.length}</p>
              </div>
              <div className="text-2xl">🏍️</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Disponíveis</p>
                <p className="text-2xl font-bold text-green-600">
                  {deliveryPersons.filter((p) => p.status === "available").length}
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Em Entrega</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {deliveryPersons.filter((p) => p.status === "busy").length}
                </p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <Package className="w-4 h-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tempo Médio</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round(
                    deliveryPersons.reduce((sum, p) => sum + p.averageDeliveryTime, 0) / deliveryPersons.length,
                  )}
                  min
                </p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nome, email ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="available">Disponíveis</SelectItem>
                <SelectItem value="busy">Ocupados</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Persons List */}
      <div className="grid gap-4">
        {filteredDeliveryPersons.map((person) => (
          <Card key={person.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{person.name}</h3>
                    <Badge className={getStatusColor(person.status)}>{getStatusLabel(person.status)}</Badge>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <span>{getVehicleIcon(person.vehicleType)}</span>
                      <span>{getVehicleLabel(person.vehicleType)}</span>
                      <span className="text-gray-400">•</span>
                      <span>{person.vehiclePlate}</span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{person.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{person.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{person.currentLocation}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Última atividade: {new Date(person.lastActiveAt).toLocaleString("pt-BR")}</span>
                    </div>
                  </div>

                  {person.currentOrders.length > 0 && (
                    <div className="mt-3 p-2 bg-yellow-50 rounded-lg">
                      <div className="text-sm text-yellow-800">
                        <strong>Pedidos em andamento:</strong> {person.currentOrders.join(", ")}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-sm text-gray-600">Entregas</div>
                      <div className="text-lg font-bold text-primary">{person.totalDeliveries}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Avaliação</div>
                      <div className="text-lg font-bold text-primary">⭐ {person.averageRating}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Tempo Médio</div>
                      <div className="text-lg font-bold text-primary">{person.averageDeliveryTime}min</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedDeliveryPerson(person)}>
                      <Eye className="w-4 h-4 mr-1" />
                      Detalhes
                    </Button>
                    {person.status === "available" && (
                      <Button size="sm" onClick={() => setShowAssignModal(person.id)}>
                        <Package className="w-4 h-4 mr-1" />
                        Atribuir Pedido
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setSelectedDeliveryPerson(person)}>
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDeliveryPersons.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">Nenhum entregador encontrado com os filtros aplicados.</p>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      {(selectedDeliveryPerson || showAddModal) && (
        <DeliveryPersonModal
          deliveryPerson={selectedDeliveryPerson}
          isOpen={!!selectedDeliveryPerson || showAddModal}
          onClose={() => {
            setSelectedDeliveryPerson(null)
            setShowAddModal(false)
          }}
        />
      )}

      {showAssignModal && (
        <AssignOrderModal
          deliveryPersonId={showAssignModal}
          isOpen={!!showAssignModal}
          onClose={() => setShowAssignModal(null)}
        />
      )}
    </div>
  )
}
