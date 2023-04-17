import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
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
  const [cart, setCart] = useState<Product[]>(() => {

    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  
  const addProduct = async (productId: number) => {
    try {
      const findProduct: Product[] = cart.filter(item => item.id === productId)
      
      
      let product = {} as Product
      
      if (findProduct.length === 0) {
        const response = await api.get<Product>(`products/${productId}`)

        product = {
          id: productId,
          amount: 1,
          title: response.data.title,
          price: response.data.price,
          image: response.data.image
        }
        
        const data = cart.map(item => item)
        data.push(product)
        
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(data))
        setCart(data)

      } else {

        const data = {
          productId: findProduct[0].id,
          amount: findProduct[0].amount + 1
        }

        updateProductAmount( data )
        
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };  

  const removeProduct = (productId: number) => {
    try {
      const findProduct: Product[] = cart.filter(item => item.id === productId)
      
      if (findProduct.length === 0) {
        return toast.error('Erro na remoção do produto');
      }

      const cartWithoutProduct: Product[] = cart.filter(item => item.id !== productId)

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartWithoutProduct))
      setCart(cartWithoutProduct)
    } catch {
      toast.error('Erro ao remover o produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    if (amount < 1) {
      return
    }
    
    try {
      const findProduct: Product[] = cart.filter(item => item.id === productId)
      
      if(findProduct.length === 0 ){
        return toast.error('Erro na alteração de quantidade do produto'); 
      }

      const response = await api.get<Stock>(`stock/${productId}`)
      if (amount > 0 && response.data.amount === findProduct[0].amount) {
        return toast.error('Quantidade solicitada fora de estoque');
      }

      const cartUpdated: Product[] = cart.map(item => {
        if (item.id === productId) {
          return {
            id: findProduct[0].id,
            amount: amount,
            title: findProduct[0].title,
            price: findProduct[0].price,
            image: findProduct[0].image
          }
        } else{
          return item
        }
      })

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartUpdated))
      setCart(cartUpdated)
    } catch {
      toast.error('Erro na atualização do produto');
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
