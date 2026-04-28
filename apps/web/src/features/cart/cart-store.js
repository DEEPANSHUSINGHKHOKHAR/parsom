import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const clampQuantity = (quantity, maxQuantity) => {
  const safeQty = Number.isFinite(Number(quantity)) ? Number(quantity) : 1;
  const parsedMax = Number.isFinite(Number(maxQuantity)) ? Number(maxQuantity) : 999;

  return Math.max(1, Math.min(safeQty, parsedMax));
};

const getItemKey = (productId, size) => `${productId}::${size}`;

const normalizeCartItem = (item) => {
  if (!item?.productId) {
    throw new Error('Product ID is required.');
  }

  if (!item?.name) {
    throw new Error('Product name is required.');
  }

  if (!item?.size) {
    throw new Error('Please select a size.');
  }

  const maxQuantity = Number.isFinite(Number(item?.maxQuantity))
    ? Number(item.maxQuantity)
    : 999;

  return {
    key: getItemKey(item.productId, item.size),
    productId: item.productId,
    slug: item.slug,
    name: item.name,
    image: item.image || '',
    size: item.size,
    quantity: clampQuantity(item.quantity ?? 1, maxQuantity),
    maxQuantity,
    status: item.status || 'active',
    price: Number(item.price ?? 0),
    originalPrice:
      item.originalPrice !== null && item.originalPrice !== undefined
        ? Number(item.originalPrice)
        : null,
  };
};

export const useCartStore = create(
  persist(
    (set, get) => ({
      cartItems: [],

      addItem: (incomingItem) => {
        const item = normalizeCartItem(incomingItem);

        set((state) => {
          const existingIndex = state.cartItems.findIndex(
            (cartItem) => cartItem.key === item.key
          );

          if (existingIndex === -1) {
            return {
              cartItems: [...state.cartItems, item],
            };
          }

          const nextItems = [...state.cartItems];
          const existingItem = nextItems[existingIndex];

          nextItems[existingIndex] = {
            ...existingItem,
            quantity: clampQuantity(
              existingItem.quantity + item.quantity,
              item.maxQuantity
            ),
            maxQuantity: item.maxQuantity,
            price: item.price,
            originalPrice: item.originalPrice,
            image: item.image,
            slug: item.slug,
            status: item.status,
          };

          return { cartItems: nextItems };
        });
      },

      removeItem: (key) =>
        set((state) => ({
          cartItems: state.cartItems.filter((item) => item.key !== key),
        })),

      updateQuantity: (key, quantity) =>
        set((state) => ({
          cartItems: state.cartItems.map((item) =>
            item.key === key
              ? {
                  ...item,
                  quantity: clampQuantity(quantity, item.maxQuantity),
                }
              : item
          ),
        })),

      clearCart: () => set({ cartItems: [] }),

      getItemCount: () =>
        get().cartItems.reduce((total, item) => total + item.quantity, 0),

      getSubtotal: () =>
        get().cartItems.reduce(
          (total, item) => total + Number(item.price) * Number(item.quantity),
          0
        ),
    }),
    {
      name: 'parsom-cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
);