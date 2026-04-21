import { catalogApi } from './client'

export interface Category {
    id: string
    name: string
    description?: string
    parentId?: Category | string | null
    createdAt: string
    updatedAt: string
}

export interface CreateCategoryDto {
    name: string
    description?: string
    parentId?: string
}

export interface UpdateCategoryDto {
    name?: string
    description?: string
    parentId?: string
}

export const categoriesApi = {
    findAll: () =>
        catalogApi.get<Category[]>('/categories'),

    findById: (id: string) =>
        catalogApi.get<Category>(`/categories/${id}`),

    create: (dto: CreateCategoryDto) =>
        catalogApi.post<Category>('/categories', dto),

    update: (id: string, dto: UpdateCategoryDto) =>
        catalogApi.patch<Category>(`/categories/${id}`, dto),

    remove: (id: string) =>
        catalogApi.delete<void>(`/categories/${id}`),
}