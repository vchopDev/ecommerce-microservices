import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsApi, type Product, type CreateProductDto } from '@/api/products'
import { categoriesApi } from '@/api/categories'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { MultiSelect } from '@/components/ui/multi-select'

const productSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    description: z.string().optional(),
    price: z.number().min(0, 'Price must be 0 or more'),
    stock: z.number().min(0, 'Stock must be 0 or more'),
    primaryCategoryId: z.string().min(1, 'Primary category is required'),
    categoryIds: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
})

type ProductFormValues = z.infer<typeof productSchema>

export default function ProductsPage() {
    const queryClient = useQueryClient()
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
    const [page, setPage] = useState(1)

    const { data, isLoading } = useQuery({
        queryKey: ['products', page],
        queryFn: () => productsApi.findAll({ page, limit: 10 }),
    })

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: categoriesApi.findAll,
    })

    const { control, handleSubmit, reset, formState: { isSubmitting } } = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: '',
            description: '',
            price: 0,
            stock: 0,
            primaryCategoryId: '',
            categoryIds: [],
            isActive: true,
        },
    })

    const createMutation = useMutation({
        mutationFn: (dto: CreateProductDto) => productsApi.create(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] })
            toast.success('Product created successfully')
            handleClose()
        },
        onError: (error: Error) => {
            toast.error(error.message)
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, dto }: { id: string; dto: CreateProductDto }) =>
            productsApi.update(id, dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] })
            toast.success('Product updated successfully')
            handleClose()
        },
        onError: (error: Error) => {
            toast.error(error.message)
        },
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => productsApi.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] })
            toast.success('Product deleted successfully')
            setDeletingProduct(null)
        },
        onError: (error: Error) => {
            toast.error(error.message)
        },
    })

    const handleOpen = (product?: Product) => {
        if (product) {
            setEditingProduct(product)
            reset({
                name: product.name,
                description: product.description ?? '',
                price: product.price,
                stock: product.stock,
                primaryCategoryId: typeof product.primaryCategoryId === 'object'
                    ? (product.primaryCategoryId as any).id
                    : product.primaryCategoryId as string,
                categoryIds: product.categoryIds.map(c =>
                    typeof c === 'object' ? (c as any).id : c
                ),
                isActive: product.isActive,
            })
        } else {
            setEditingProduct(null)
            reset({
                name: '',
                description: '',
                price: 0,
                stock: 0,
                primaryCategoryId: '',
                categoryIds: [],
                isActive: true,
            })
        }
        setIsFormOpen(true)
    }

    const handleClose = () => {
        setIsFormOpen(false)
        setEditingProduct(null)
        reset()
    }

    const onSubmit = async (values: ProductFormValues) => {
        if (editingProduct) {
            updateMutation.mutate({ id: editingProduct.id, dto: values })
        } else {
            createMutation.mutate(values)
        }
    }

    const getCategoryName = (product: Product) => {
        if (typeof product.primaryCategoryId === 'object' && product.primaryCategoryId) {
            return (product.primaryCategoryId as any).name
        }
        return categories?.find(c => c.id === product.primaryCategoryId)?.name ?? '—'
    }

    const totalPages = data ? Math.ceil(data.total / 10) : 1

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {data?.total ?? 0} products total
                    </p>
                </div>
                <Button onClick={() => handleOpen()} data-testid="add-product-button">
                    <Plus className="h-4 w-4 mr-2" />
                    Add product
                </Button>
            </div>

            {isLoading ? (
                <p className="text-gray-500">Loading...</p>
            ) : (
                <>
                    <div className="bg-white rounded-lg border">
                        <Table data-testid="products-table">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Stock</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-24">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                                            No products yet. Create your first one.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data?.data.map((product) => (
                                        <TableRow key={product.id}>
                                            <TableCell className="font-medium">{product.name}</TableCell>
                                            <TableCell className="text-gray-500">
                                                {getCategoryName(product)}
                                            </TableCell>
                                            <TableCell>${product.price.toFixed(2)}</TableCell>
                                            <TableCell>{product.stock}</TableCell>
                                            <TableCell>
                                                <Badge variant={product.isActive ? 'default' : 'secondary'}>
                                                    {product.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleOpen(product)}
                                                        data-testid="edit-product-button"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-red-600 hover:text-red-700"
                                                        onClick={() => setDeletingProduct(product)}
                                                        data-testid="delete-product-button"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4" data-testid="pagination">
                            <p className="text-sm text-gray-500">
                                Page {page} of {totalPages}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => p - 1)}
                                    disabled={page === 1}
                                    data-testid="pagination-prev"
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={page === totalPages}
                                    data-testid="pagination-next"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={isFormOpen} onOpenChange={handleClose}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {editingProduct ? 'Edit product' : 'Add product'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <FieldGroup className="py-4">
                            <Controller
                                control={control}
                                name="name"
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor="name">Name</FieldLabel>
                                        <Input
                                            {...field}
                                            id="name"
                                            placeholder="MacBook Pro"
                                            data-testid="product-name-input"
                                        />
                                        <FieldError errors={[fieldState.error]} />
                                    </Field>
                                )}
                            />
                            <Controller
                                control={control}
                                name="description"
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor="description">Description</FieldLabel>
                                        <Input
                                            {...field}
                                            id="description"
                                            placeholder="Optional description"
                                            data-testid="product-description-input"
                                        />
                                        <FieldError errors={[fieldState.error]} />
                                    </Field>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <Controller
                                    control={control}
                                    name="price"
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldLabel htmlFor="price">Price ($)</FieldLabel>
                                            <Input
                                                {...field}
                                                id="price"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                onChange={e => field.onChange(parseFloat(e.target.value))}
                                                data-testid="product-price-input"
                                            />
                                            <FieldError errors={[fieldState.error]} />
                                        </Field>
                                    )}
                                />
                                <Controller
                                    control={control}
                                    name="stock"
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid}>
                                            <FieldLabel htmlFor="stock">Stock</FieldLabel>
                                            <Input
                                                {...field}
                                                id="stock"
                                                type="number"
                                                min="0"
                                                onChange={e => field.onChange(parseInt(e.target.value))}
                                                data-testid="product-stock-input"
                                            />
                                            <FieldError errors={[fieldState.error]} />
                                        </Field>
                                    )}
                                />
                            </div>
                            <Controller
                                control={control}
                                name="primaryCategoryId"
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel>Primary category</FieldLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger data-testid="product-primary-category-select">
                                                <SelectValue placeholder="Select a category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories?.map(c => (
                                                    <SelectItem key={c.id} value={c.id}>
                                                        {c.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FieldError errors={[fieldState.error]} />
                                    </Field>
                                )}
                            />
                            <Controller
                                control={control}
                                name="categoryIds"
                                render={({ field }) => (
                                    <Field>
                                        <FieldLabel>Additional categories</FieldLabel>
                                        <MultiSelect
                                            options={
                                                categories
                                                    ?.filter(c => !field.value?.includes(c.id))
                                                    .map(c => ({ value: c.id, label: c.name })) ?? []
                                            }
                                            value={field.value ?? []}
                                            onChange={field.onChange}
                                            placeholder="Select additional categories..."
                                        />
                                    </Field>
                                )}
                            />
                        </FieldGroup>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                data-testid="product-submit-button"
                            >
                                {editingProduct ? 'Save changes' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog
                open={!!deletingProduct}
                onOpenChange={() => setDeletingProduct(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete product</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{deletingProduct?.name}"?
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => deletingProduct && deleteMutation.mutate(deletingProduct.id)}
                            data-testid="confirm-delete-button"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}