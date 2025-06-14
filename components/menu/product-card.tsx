"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import type { Product } from "@/types"
import { useState } from "react"

interface ProductCardProps {
  product: Product
  onClick: () => void
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  const handleImageError = () => {
    console.log("Image failed to load:", product.image)
    setImageError(true)
    setImageLoading(false)
  }

  const handleImageLoad = () => {
    setImageLoading(false)
    setImageError(false)
  }

  // Check if image URL is a blob URL (which won't work)
  const isValidImageUrl =
    product.image &&
    !product.image.startsWith("blob:") &&
    (product.image.startsWith("http") || product.image.startsWith("/"))

  const shouldShowImage = product.showImage !== false && isValidImageUrl && !imageError

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
      <div className="aspect-square overflow-hidden bg-gray-100 flex items-center justify-center" onClick={onClick}>
        {shouldShowImage ? (
          <img
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={handleImageError}
            onLoad={handleImageLoad}
            style={{ display: imageLoading ? "none" : "block" }}
          />
        ) : null}

        {imageLoading && shouldShowImage && (
          <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
            <span className="text-gray-400 text-sm">Carregando...</span>
          </div>
        )}

        {(!shouldShowImage || imageError) && !imageLoading && (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400 text-sm">Sem imagem</span>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div onClick={onClick}>
          <h3 className="font-semibold text-lg mb-2 line-clamp-1">{product.name}</h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-primary">R$ {product.price.toFixed(2)}</span>
            <Button size="sm" className="shrink-0">
              <Plus className="w-4 h-4 mr-1" />
              Adicionar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
