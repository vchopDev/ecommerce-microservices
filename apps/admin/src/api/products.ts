import { api } from './client'
import type { Category } from './categories'

export interface Product {
    id: string
    name: string
    description?: string
    price: number
    stock: number
    images: string[]
    primaryCategoryId: Category | string
    categoryIds: (Category | string)[]
    isActive: boolean
    createdAt: string
    updatedAt: string
}

export interface CreateProductDto {
    name: string
    description?: string
    price: number
    stock: number
    images?: string[]
    primaryCategoryId: string
    categoryIds?: string[]
    isActive?: boolean
}

export interface UpdateProductDto {
    name?: string
    description?: string
    price?: number
    stock?: number
    images?: string[]
    primaryCategoryId?: string
    categoryIds?: string[]
    isActive?: boolean
}

export interface ProductsResponse {
    data: Product[]
    total: number
    page: number
    limit: number
}

export interface ProductsQuery {
    page?: number
    limit?: number
    categoryId?: string
    minPrice?: number
    maxPrice?: number
    inStock?: boolean
}

export const productsApi = {
    findAll: (query?: ProductsQuery) => {
        const params = new URLSearchParams()
        if (query?.page) params.append('page', String(query.page))
        if (query?.limit) params.append('limit', String(query.limit))
        if (query?.categoryId) params.append('categoryId', query.categoryId)
        if (query?.minPrice !== undefined) params.append('minPrice', String(query.minPrice))
        if (query?.maxPrice !== undefined) params.append('maxPrice', String(query.maxPrice))
        if (query?.inStock) params.append('inStock', String(query.inStock))
        const qs = params.toString()
        return api.get<ProductsResponse>(`/products${qs ? `?${qs}` : ''}`)
    },

    findById: (id: string) =>
        api.get<Product>(`/products/${id}`),

    create: (dto: CreateProductDto) =>
        api.post<Product>('/products', dto),

    update: (id: string, dto: UpdateProductDto) =>
        api.patch<Product>(`/products/${id}`, dto),

    remove: (id: string) =>
        api.delete<void>(`/products/${id}`),
}