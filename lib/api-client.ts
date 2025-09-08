// API Client for frontend-backend integration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface ApiResponse<T> {
  data: T;
  error?: string;
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // <-- Always send cookies for JWT
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'An error occurred');
      }
      
      return { data: data.data || data };
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Brands API
  async getBrands() {
    return this.request<Brand[]>('/api/brands');
  }

  async getBrand(id: string) {
    return this.request<Brand>(`/api/brands/${id}`);
  }

  async createBrand(brand: Omit<Brand, 'id' | '_id' | 'createdAt' | 'updatedAt'>) {
    return this.request<Brand>('/api/brands', {
      method: 'POST',
      body: JSON.stringify(brand),
    });
  }

  async updateBrand(id: string, brand: Partial<Brand>) {
    return this.request<Brand>(`/api/brands/${id}`, {
      method: 'PUT',
      body: JSON.stringify(brand),
    });
  }

  async deleteBrand(id: string) {
    return this.request<void>(`/api/brands/${id}`, {
      method: 'DELETE',
    });
  }

  // Products API
  async getProducts() {
    return this.request<Product[]>('/api/products');
  }

  async getProduct(id: string) {
    return this.request<Product>(`/api/products/${id}`);
  }

  async createProduct(product: any) {
    const formData = new FormData();
    formData.append('name', product.name);
    if (product.description) formData.append('description', product.description);
    if (product.specification) formData.append('specification', product.specification);
    formData.append('brandId', product.brandId);
    if (Array.isArray(product.categoryIds)) {
      product.categoryIds.forEach((id: string) => formData.append('categoryIds', id));
    }
    if (Array.isArray(product.functionIds)) {
      product.functionIds.forEach((id: string) => formData.append('functionIds', id));
    }
    formData.append('isPOR', String(!!product.isPOR));
    formData.append('price', String(product.price));
    //formData.append('sku', product.sku || '');
    formData.append('status', product.status);
    //formData.append('stockLevel', String(product.stockLevel));
    if (Array.isArray(product.images)) {
      product.images.forEach((img: File) => formData.append('images', img));
    }
    if (typeof product.mainImageIndex === 'number') {
      formData.append('mainImageIndex', String(product.mainImageIndex));
    }
    return this.request<Product>('/api/products', {
      method: 'POST',
      body: formData,
      // Don't set Content-Type, browser will set multipart/form-data
    });
  }

  async updateProduct(id: string, product: any) {
    const formData = new FormData();
    if (product.name) formData.append('name', product.name);
    if (product.description) formData.append('description', product.description);
    if (product.specification) formData.append('specification', product.specification);
    if (product.brandId) formData.append('brandId', product.brandId);
    if (Array.isArray(product.categoryIds)) {
      product.categoryIds.forEach((id: string) => formData.append('categoryIds', id));
    }
    if (Array.isArray(product.functionIds)) {
      product.functionIds.forEach((id: string) => formData.append('functionIds', id));
    }
    if (product.isPOR !== undefined) formData.append('isPOR', String(!!product.isPOR));
    if (product.price !== undefined) formData.append('price', String(product.price));
    //if (product.sku) formData.append('sku', product.sku);
    if (product.status) formData.append('status', product.status);
    //if (product.stockLevel !== undefined) formData.append('stockLevel', String(product.stockLevel));
    if (Array.isArray(product.images)) {
      product.images.forEach((img: File) => formData.append('images', img));
    }
    if (typeof product.mainImageIndex === 'number') {
      formData.append('mainImageIndex', String(product.mainImageIndex));
    }
    if (Array.isArray(product.removeImageIndexes) && product.removeImageIndexes.length) {
      formData.append('removeImageIndexes', JSON.stringify(product.removeImageIndexes));
    }
    return this.request<Product>(`/api/products/${id}`, {
      method: 'PUT',
      body: formData,
      // Don't set Content-Type, browser will set multipart/form-data
    });
  }

  async deleteProduct(id: string) {
    return this.request<void>(`/api/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Dealers API
  async getDealers() {
    return this.request<Dealer[]>('/api/dealers');
  }

  async getDealer(id: string) {
    return this.request<Dealer>(`/api/dealers/${id}`);
  }

  async createDealer(dealer: Omit<Dealer, 'id' | '_id' | 'createdAt' | 'updatedAt'>) {
    return this.request<Dealer>('/api/dealers', {
      method: 'POST',
      body: JSON.stringify(dealer),
    });
  }

  async updateDealer(id: string, dealer: Partial<Dealer>) {
    return this.request<Dealer>(`/api/dealers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dealer),
    });
  }

  async deleteDealer(id: string) {
    return this.request<void>(`/api/dealers/${id}`, {
      method: 'DELETE',
    });
  }

  // Quotations API
  async getQuotations() {
    return this.request<Quotation[]>('/api/quotations');
  }

  async getQuotation(id: string) {
    return this.request<Quotation>(`/api/quotations/${id}`);
  }

  async createQuotation(quotation: Omit<Quotation, 'id' | '_id' | 'createdAt' | 'updatedAt'>) {
    return this.request<Quotation>('/api/quotations', {
      method: 'POST',
      body: JSON.stringify(quotation),
    });
  }

  async updateQuotation(id: string, quotation: Partial<Quotation>) {
    return this.request<Quotation>(`/api/quotations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(quotation),
    });
  }

  async deleteQuotation(id: string) {
    return this.request<void>(`/api/quotations/${id}`, {
      method: 'DELETE',
    });
  }

  // Supporting entities
  async getProductCategories() {
    return this.request<ProductCategory[]>('/api/product-categories');
  }

  async getProductFunctions() {
    return this.request<ProductFunction[]>('/api/product-function');
  }

  async getAreaRoomTypes() {
    return this.request<AreaRoomType[]>('/api/area-room-types');
  }
}

// Type definitions for API responses
interface Brand {
  _id: string;
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

interface Product {
  _id: string;
  id: string;
  name: string;
  description?: string;
  specification?: string;
  brandId: string;
  categoryId?: string;
  functionId?: string;
  price: number;
  isPOR: boolean;
  imageUrl?: string;
  //sku?: string;
  status: 'active' | 'inactive';
  //stockLevel: number;
  createdAt: string;
  updatedAt: string;
}

interface Dealer {
  _id: string;
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  status: 'Active' | 'Inactive';
  dealerType: 'Authorized' | 'Premium' | 'Standard';
  territory?: string;
  logo?: string;
  createdAt: string;
  updatedAt: string;
}

interface Quotation {
  _id: string;
  id: string;
  quotationNumber: string;
  dealerId: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';
  createdDate: string;
  validUntil: string;
  items: QuotationItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface QuotationItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface ProductCategory {
  _id: string;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface ProductFunction {
  _id: string;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface AreaRoomType {
  _id: string;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export const apiClient = new ApiClient();
