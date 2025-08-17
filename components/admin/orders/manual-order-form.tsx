'use client';

import React from 'react';
import { ManualOrderFormRefactored } from './manual-order/manual-order-form-refactored';

// Types for backward compatibility
export interface ManualOrderFormProps {
  onOrderCreated?: (orderId: string) => void;
}

/**
 * Legacy wrapper for the refactored Manual Order Form component.
 * This maintains backward compatibility while using the new modular architecture.
 * 
 * The original 1941-line component has been refactored into:
 * - Modular hooks for state management
 * - Smaller, focused components
 * - Better separation of concerns
 * - Improved maintainability
 */
export function ManualOrderForm({ onOrderCreated }: ManualOrderFormProps) {
  return <ManualOrderFormRefactored onOrderCreated={onOrderCreated} />;
}

// Re-export the refactored component for direct usage
export { ManualOrderFormRefactored };