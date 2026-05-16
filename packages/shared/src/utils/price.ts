/**
 * @vizzo/shared — Price Utilities
 * Price computation rules from System Architecture:
 * - discount_price takes precedence over base_price when is_discounted === true
 * - All price totals are computed after fetching real-time prices
 */

import type { Product } from '../types/index.js';

/**
 * Returns the effective price for a product.
 * Uses discount_price when is_discounted and discount_price exists,
 * otherwise falls back to base_price.
 */
export function getEffectivePrice(product: Product): number {
  if (product.is_discounted && product.discount_price !== null) {
    return product.discount_price;
  }
  return product.base_price;
}

/**
 * Computes the cart total from an array of items with price and quantity.
 * Sum of price × quantity.
 */
export function computeCartTotal(
  items: Array<{ price: number; quantity: number }>
): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
