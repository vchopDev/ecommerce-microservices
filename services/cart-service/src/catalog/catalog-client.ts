import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CatalogClient, ProductDetails } from './catalog-client.interface';

@Injectable()
export class HttpCatalogClient implements CatalogClient {
    private readonly catalogUrl: string;

    constructor(private readonly configService: ConfigService) {
        this.catalogUrl = this.configService.get<string>('CATALOG_URL', 'http://localhost:3002');
    }

    async getProduct(productId: string): Promise<ProductDetails | null> {
        const response = await fetch(`${this.catalogUrl}/products/${productId}`);

        if (response.status === 404) {
            return null;
        }

        if (!response.ok) {
            throw new Error(`Catalog service error: ${response.status}`);
        }

        return response.json() as Promise<ProductDetails>;
    }
}