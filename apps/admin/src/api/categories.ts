import { api } from './client'

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
        api.get<Category[]>('/categories'),

    findById: (id: string) =>
        api.get<Category>(`/categories/${id}`),

    create: (dto: CreateCategoryDto) =>
        api.post<Category>('/categories', dto),

    update: (id: string, dto: UpdateCategoryDto) =>
        api.patch<Category>(`/categories/${id}`, dto),

    remove: (id: string) =>
        api.delete<void>(`/categories/${id}`),
}