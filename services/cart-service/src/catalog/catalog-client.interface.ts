export interface ProductDetails {
    id: string;
    name: string;
    price: number;
    stock: number;
    isActive: boolean;
}

export interface CatalogClient {
    getProduct(productId: string): Promise<ProductDetails | null>;
}

export const CATALOG_CLIENT = 'CATALOG_CLIENT';