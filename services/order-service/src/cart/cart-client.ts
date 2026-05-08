import { Injectable } from '@nestjs/common';
import { Cart, CartClient } from './cart-client.interface';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class HttpCartClient implements CartClient {
    private readonly cartUrl: string;

    constructor(private readonly configService: ConfigService, private readonly jwtService: JwtService) {
        this.cartUrl = this.configService.get<string>('CART_URL', 'http://localhost:3003');
    }

    private mintToken(userId: string) {
        const payload = { sub: userId };
        return this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_SECRET'),
            expiresIn: '30s'
        });
    }

    async getCart(userId: string): Promise<Cart> {
        const token = this.mintToken(userId);

        const response = await fetch(`${this.cartUrl}/cart`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch cart: ${response.statusText}`);
        }

        return response.json() as Promise<Cart>;
    }

    async clearCart(userId: string): Promise<void> {
        const token = this.mintToken(userId);

        const response = await fetch(`${this.cartUrl}/cart`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to clear cart: ${response.statusText}`);
        }
    }
}