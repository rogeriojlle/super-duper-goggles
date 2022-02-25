import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  //funcoes auxiliares para manipular o carrinho de compras

  const localStore = {
    _cart: localStorage.getItem('@RocketShoes:cart'),
    get() {
      if (this._cart) return JSON.parse(this._cart);
      return [];
    },
    set(val: Product[]) {
      val.sort((a, b) => a.id - b.id);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(val));
      setCart(val);
    },
    updateProduct(product: Product) {
      this.set([...cart.filter(({ id }) => id !== product.id), product]);
    },
  };

  const [cart, setCart] = useState<Product[]>(() => localStore.get());

  const addProduct = async (productId: number) => {
    try {
      let product;
      product = cart.find(({ id }) => id === productId);
      if (!product) {
        const res = await api.get(`/products/${productId}`);
        if (res.data.id) {
          product = { ...res.data, amount: 0 };
        } else {
          throw res;
        }
      }
      product.amount++;
      localStore.updateProduct(product);
    } catch (error) {
      console.error(error);
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      localStore.set(cart.filter(({ id }) => id !== productId));
    } catch {
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      let product = cart.find(({ id }) => id === productId);
      if (product) {
        localStore.updateProduct({ ...product, amount });
      }
    } catch {
      // TODO
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
