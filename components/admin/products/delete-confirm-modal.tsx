"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface DeleteConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemName: string
  itemType: "product" | "category"
  onConfirm: () => void
}

export function DeleteConfirmModal({ open, onOpenChange, itemName, itemType, onConfirm }: DeleteConfirmModalProps) {
  const typeLabel = itemType === "product" ? "produto" : "categoria"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </div>
          <DialogDescription>
            Tem certeza que deseja excluir {itemType === "product" ? "o produto" : "a categoria"} "{itemName}"?
            {itemType === "category" && (
              <span className="block mt-2 text-red-600 font-medium">
                Atenção: Todos os produtos desta categoria também serão afetados.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Excluir {typeLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
