export interface Product {
    id: string;
    name: string;
    price: number;
    stock: number;
    isActive: boolean;
    images: string[];
}

export interface CatalogClient {
    getProduct(productId: string): Promise<Product>;
}

export const CATALOG_CLIENT = 'CATALOG_CLIENT';