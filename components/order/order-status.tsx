"use client"

import { motion } from "framer-motion"
import { CheckCircle, Clock, Truck, Package } from "lucide-react"

interface OrderStatusProps {
  status: string
}

const statusSteps = [
  { key: "RECEIVED", label: "Pedido Recebido", icon: CheckCircle },
  { key: "PREPARING", label: "Preparando", icon: Package },
  { key: "ON_THE_WAY", label: "Saiu para Entrega", icon: Truck },
  { key: "DELIVERED", label: "Entregue", icon: CheckCircle },
]

export function OrderStatus({ status }: OrderStatusProps) {
  const currentStepIndex = statusSteps.findIndex((step) => step.key === status)

  return (
    <div className="bg-white rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-6">Status do Pedido</h2>

      <div className="relative">
        <div className="flex justify-between">
          {statusSteps.map((step, index) => {
            const isCompleted = index <= currentStepIndex
            const isCurrent = index === currentStepIndex
            const Icon = step.icon

            return (
              <div key={step.key} className="flex flex-col items-center relative">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{
                    scale: isCurrent ? 1.1 : 1,
                    opacity: isCompleted ? 1 : 0.5,
                  }}
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                    isCompleted ? "bg-primary text-white" : "bg-gray-200 text-gray-400"
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </motion.div>
                <span className={`text-sm text-center ${isCompleted ? "text-gray-900 font-medium" : "text-gray-500"}`}>
                  {step.label}
                </span>

                {index < statusSteps.length - 1 && (
                  <div
                    className={`absolute top-6 left-12 w-full h-0.5 ${
                      index < currentStepIndex ? "bg-primary" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {status === "PREPARING" && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="text-blue-800 font-medium">Sua pizza está sendo preparada com carinho!</span>
          </div>
          <p className="text-blue-700 text-sm mt-1">Tempo estimado: 20-30 minutos</p>
        </div>
      )}

      {status === "ON_THE_WAY" && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">Seu pedido saiu para entrega!</span>
          </div>
          <p className="text-green-700 text-sm mt-1">O entregador está a caminho do seu endereço</p>
        </div>
      )}
    </div>
  )
}
