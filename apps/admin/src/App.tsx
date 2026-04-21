import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from '@/pages/auth/LoginPage'
import ProductsPage from '@/pages/products/ProductsPage'
import CategoriesPage from '@/pages/categories/CategoriesPage'
import ProtectedRoute from '@/components/ProtectedRoute'
import AdminLayout from '@/layouts/AdminLayout'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/products" element={
        <ProtectedRoute>
          <AdminLayout>
            <ProductsPage />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/categories" element={
        <ProtectedRoute>
          <AdminLayout>
            <CategoriesPage />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/" element={<Navigate to="/products" replace />} />
    </Routes>
  )
}

export default App