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
  updateProductAmount: ({
    productId,
    amount,
  }: UpdateProductAmount) => Promise<void>;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  //funcoes auxiliares para manipular o carrinho de compras
  const localStore = {
    _cart: localStorage.getItem('@RocketShoes:cart'),
    init() {
      if (this._cart) return JSON.parse(this._cart);
      return [];
    },
    sync(val: Product[]) {
      val.sort((a, b) => a.id - b.id);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(val));
      setCart(val);
    },
    update(product: Product) {
      this.sync([...cart.filter(({ id }) => id !== product.id), product]);
    },
  };

  const [cart, setCart] = useState<Product[]>(() => localStore.init());

  const hasStock = async (item: Product) => {
    const res = await api.get(`/stock/${item.id}`);
    const product: Stock = res.data;
    return product.amount >= item.amount;
  };

  const addProduct = async (productId: number) => {
    try {
      let product = cart.find(({ id }) => id === productId);
      if (product) {
        await updateProductAmount({
          productId,
          amount: product.amount + 1,
        });
        return;
      }
      const res = await api.get(`/products/${productId}`);
      if (res.data.hasOwnProperty('id')) {
        const product = { ...res.data, amount: 1 };
        localStore.update(product);
      } else {
        throw new Error();
      }
    } catch (error) {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      if (!cart.find(({ id }) => id === productId)) throw new Error();
      localStore.sync(cart.filter(({ id }) => id !== productId));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount < 1)
        throw new Error('Erro na alteração de quantidade do produto');
      let find = cart.find(({ id }) => id === productId);
      if (find) {
        const product = { ...find, amount: amount };
        const stock = await hasStock(product);
        if (!stock) throw new Error('Quantidade solicitada fora de estoque');
        localStore.update(product);
      } else {
        throw new Error('Erro na alteração de quantidade do produto');
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
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
