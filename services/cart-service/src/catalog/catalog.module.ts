import { Module } from '@nestjs/common';
import { HttpCatalogClient } from './catalog-client';
import { CATALOG_CLIENT } from './catalog-client.interface';

@Module({
    providers: [
        {
            provide: CATALOG_CLIENT,
            useClass: HttpCatalogClient,
        },
    ],
    exports: [CATALOG_CLIENT],
})
export class CatalogModule { }