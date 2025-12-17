import './App.css'
import {
  Login, 
  SignUp, 
  ForgotPassword
} from "./pages/AuthPages/index.js"
import {
  createBrowserRouter, 
  createRoutesFromElements, 
  Route, 
  RouterProvider
} from "react-router-dom"
import {AllProducts} from "./pages/ProductPages/AllProducts.jsx"
import {InventoryLayout} from "./pages/Layouts/RootLayout.jsx"
import { Dashboard } from './pages/DashboardPage/Dashboard.jsx'
import { ProductDetailsPage } from './pages/ProductPages/ProductDetails.jsx'
import { AllCategories } from "./pages/CategoryPages/AllCategories.jsx"
import { CategoryDetailsPage } from "./pages/CategoryPages/CategoryDetails.jsx"
import { AddNewCategory } from './pages/CategoryPages/AddNewCategory.jsx'
import { AllSuppliers } from './pages/suppliers/AllSuppliers';
import { AddNewSupplier } from './pages/suppliers/AddNewSupplier';
import { SupplierDetailsPage } from './pages/suppliers/SupplierDetailsPage';

function App() {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path='/'>
        {/* Auth Routes - Outside RootLayout */}
        <Route path='login' element={<Login/>} />
        <Route path='signup' element={<SignUp/>} />
        <Route path='forgetPassword' element={<ForgotPassword/>} />
         
        {/* Protected Routes - Inside RootLayout */}
        <Route element={<InventoryLayout />}>
          <Route index element={<AllProducts />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<AllProducts />} />
          <Route path="products/:id" element={<ProductDetailsPage />} />
          <Route path="categories" element={<AllCategories />} />
          <Route path="/categories/new" element={<AddNewCategory />} />
          <Route path="categories/:id" element={<CategoryDetailsPage />} /> 
          <Route path="orders" element={<div>Orders Page</div>} />
          <Route path="users" element={<div>Users Page</div>} />
          <Route path="profile" element={<div>Profile Page</div>} />
          <Route path="suppliers" element={<AllSuppliers />} />
          <Route path="/suppliers/new" element={<AddNewSupplier />} />
          <Route path="/suppliers/:supplierId" element={<SupplierDetailsPage />} />
        </Route>

      </Route>
    )
  )
  return(
    <>
    <RouterProvider router={router}/>
    </>
  )
}
export default App
