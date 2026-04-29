export interface CartItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl?: string;
}

export interface Cart {
    userId: string;
    items: CartItem[];
    updatedAt: string;
}