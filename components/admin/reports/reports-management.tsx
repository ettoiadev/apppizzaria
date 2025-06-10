"use client"

import React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { SalesChart } from "./sales-chart"
import { OrdersChart } from "./orders-chart"
import { TopProductsChart } from "./top-products-chart"
import { DeliveryPerformanceChart } from "./delivery-performance-chart"
import { ReportFilters } from "./report-filters"
import { ExportReports } from "./export-reports"
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Clock, Star, Package, Bike } from "lucide-react"

export function ReportsManagement() {
  const [dateRange, setDateRange] = useState("7d")
  const [reportType, setReportType] = useState("overview")

  // Mock data for reports
  const mockStats = {
    totalSales: 12450.75,
    salesGrowth: 12.5,
    totalOrders: 156,
    ordersGrowth: 8.3,
    totalCustomers: 89,
    customersGrowth: 15.2,
    avgDeliveryTime: 28,
    deliveryTimeChange: -5.1,
    avgOrderValue: 79.81,
    orderValueGrowth: 4.2,
    customerSatisfaction: 4.7,
    satisfactionChange: 0.3,
    totalDeliveries: 142,
    deliveriesGrowth: 6.8,
    activeDeliveryPersons: 8,
    deliveryPersonsChange: 2,
  }

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? "text-green-600" : "text-red-600"
  }

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? TrendingUp : TrendingDown
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios e Análises</h1>
          <p className="text-gray-600">Acompanhe o desempenho do seu negócio</p>
        </div>

        <ExportReports dateRange={dateRange} reportType={reportType} />
      </div>

      {/* Filters */}
      <ReportFilters
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        reportType={reportType}
        onReportTypeChange={setReportType}
      />

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vendas Totais</p>
                <p className="text-2xl font-bold">
                  R$ {mockStats.totalSales.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <div className="flex items-center mt-1">
                  {React.createElement(getGrowthIcon(mockStats.salesGrowth), {
                    className: `w-4 h-4 ${getGrowthColor(mockStats.salesGrowth)}`,
                  })}
                  <span className={`text-sm ml-1 ${getGrowthColor(mockStats.salesGrowth)}`}>
                    {mockStats.salesGrowth > 0 ? "+" : ""}
                    {mockStats.salesGrowth}%
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Pedidos</p>
                <p className="text-2xl font-bold">{mockStats.totalOrders}</p>
                <div className="flex items-center mt-1">
                  {React.createElement(getGrowthIcon(mockStats.ordersGrowth), {
                    className: `w-4 h-4 ${getGrowthColor(mockStats.ordersGrowth)}`,
                  })}
                  <span className={`text-sm ml-1 ${getGrowthColor(mockStats.ordersGrowth)}`}>
                    {mockStats.ordersGrowth > 0 ? "+" : ""}
                    {mockStats.ordersGrowth}%
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Novos Clientes</p>
                <p className="text-2xl font-bold">{mockStats.totalCustomers}</p>
                <div className="flex items-center mt-1">
                  {React.createElement(getGrowthIcon(mockStats.customersGrowth), {
                    className: `w-4 h-4 ${getGrowthColor(mockStats.customersGrowth)}`,
                  })}
                  <span className={`text-sm ml-1 ${getGrowthColor(mockStats.customersGrowth)}`}>
                    {mockStats.customersGrowth > 0 ? "+" : ""}
                    {mockStats.customersGrowth}%
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tempo Médio de Entrega</p>
                <p className="text-2xl font-bold">{mockStats.avgDeliveryTime}min</p>
                <div className="flex items-center mt-1">
                  {React.createElement(getGrowthIcon(mockStats.deliveryTimeChange), {
                    className: `w-4 h-4 ${getGrowthColor(mockStats.deliveryTimeChange)}`,
                  })}
                  <span className={`text-sm ml-1 ${getGrowthColor(mockStats.deliveryTimeChange)}`}>
                    {mockStats.deliveryTimeChange > 0 ? "+" : ""}
                    {mockStats.deliveryTimeChange}%
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
                <p className="text-2xl font-bold">R$ {mockStats.avgOrderValue.toFixed(2)}</p>
                <div className="flex items-center mt-1">
                  {React.createElement(getGrowthIcon(mockStats.orderValueGrowth), {
                    className: `w-4 h-4 ${getGrowthColor(mockStats.orderValueGrowth)}`,
                  })}
                  <span className={`text-sm ml-1 ${getGrowthColor(mockStats.orderValueGrowth)}`}>
                    {mockStats.orderValueGrowth > 0 ? "+" : ""}
                    {mockStats.orderValueGrowth}%
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Satisfação do Cliente</p>
                <p className="text-2xl font-bold">{mockStats.customerSatisfaction}</p>
                <div className="flex items-center mt-1">
                  {React.createElement(getGrowthIcon(mockStats.satisfactionChange), {
                    className: `w-4 h-4 ${getGrowthColor(mockStats.satisfactionChange)}`,
                  })}
                  <span className={`text-sm ml-1 ${getGrowthColor(mockStats.satisfactionChange)}`}>
                    {mockStats.satisfactionChange > 0 ? "+" : ""}
                    {mockStats.satisfactionChange}
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Entregas Realizadas</p>
                <p className="text-2xl font-bold">{mockStats.totalDeliveries}</p>
                <div className="flex items-center mt-1">
                  {React.createElement(getGrowthIcon(mockStats.deliveriesGrowth), {
                    className: `w-4 h-4 ${getGrowthColor(mockStats.deliveriesGrowth)}`,
                  })}
                  <span className={`text-sm ml-1 ${getGrowthColor(mockStats.deliveriesGrowth)}`}>
                    {mockStats.deliveriesGrowth > 0 ? "+" : ""}
                    {mockStats.deliveriesGrowth}%
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                <Bike className="w-6 h-6 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Entregadores Ativos</p>
                <p className="text-2xl font-bold">{mockStats.activeDeliveryPersons}</p>
                <div className="flex items-center mt-1">
                  <span className="text-sm text-gray-600">
                    {mockStats.deliveryPersonsChange > 0 ? "+" : ""}
                    {mockStats.deliveryPersonsChange} este mês
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-pink-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesChart dateRange={dateRange} />
        <OrdersChart dateRange={dateRange} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopProductsChart dateRange={dateRange} />
        <DeliveryPerformanceChart dateRange={dateRange} />
      </div>
    </div>
  )
}
