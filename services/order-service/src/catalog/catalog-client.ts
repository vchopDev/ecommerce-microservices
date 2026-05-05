import { Injectable } from "@nestjs/common";
import { CatalogClient, Product } from "./catalog-client.interface";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class HttpCatalogClient implements CatalogClient {
    private readonly catalogUrl: string;

    constructor(private readonly configService: ConfigService) {
        this.catalogUrl = this.configService.get<string>('CATALOG_URL', 'http://localhost:3002');
    }

    async getProduct(productId: string): Promise<Product> {
        const response = await fetch(`${this.catalogUrl}/products/${productId}`);

        if (!response.ok) {
            throw new Error(`Failed to fetch product ${productId}: ${response.statusText}`);
        }

        return response.json() as Promise<Product>;
    }
}