import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '../types/pedido.types';

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (materialId: number) => void;
  updateQuantity: (materialId: number, cantidad: number) => void;
  clearCart: () => void;
  getTotalM3: () => number;
  getTotalMonto: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) => i.material_id === item.material_id
          );

          if (existingIndex >= 0) {
            // Actualizar cantidad si ya existe
            const updatedItems = [...state.items];
            const newCantidad = updatedItems[existingIndex].cantidad_m3 + item.cantidad_m3;
            updatedItems[existingIndex] = {
              ...updatedItems[existingIndex],
              cantidad_m3: newCantidad,
              subtotal: newCantidad * updatedItems[existingIndex].precio_unitario,
            };
            return { items: updatedItems };
          } else {
            // Agregar nuevo item
            return { items: [...state.items, item] };
          }
        }),

      removeItem: (materialId) =>
        set((state) => ({
          items: state.items.filter((item) => item.material_id !== materialId),
        })),

      updateQuantity: (materialId, cantidad) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.material_id === materialId
              ? {
                  ...item,
                  cantidad_m3: cantidad,
                  subtotal: cantidad * item.precio_unitario,
                }
              : item
          ),
        })),

      clearCart: () => set({ items: [] }),

      getTotalM3: () => {
        const state = get();
        return state.items.reduce((total, item) => total + item.cantidad_m3, 0);
      },

      getTotalMonto: () => {
        const state = get();
        return state.items.reduce((total, item) => total + item.subtotal, 0);
      },

      getItemCount: () => {
        const state = get();
        return state.items.length;
      },
    }),
    {
      name: 'zambrana-cart-storage',
    }
  )
);
