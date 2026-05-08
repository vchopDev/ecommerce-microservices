export interface CartItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl: string;
}

export interface Cart {
    userId: string;
    items: CartItem[];
    updatedAt: Date;
};

export interface CartClient {
    getCart(userId: string): Promise<Cart>;
    clearCart(userId: string): Promise<void>;
};

export const CART_CLIENT = 'CART_CLIENT';