## Table of Contents

- [Features](#features)
- [Authentication](#authentication)
- [Endpoints](#endpoints)
  - [Auth](#auth-endpoints)
  - [Products](#products-endpoints)
  - [Cart](#cart-endpoints)
  - [Orders](#orders-endpoints)
  - [Admin](#admin-endpoints)
- [Data Models](#data-models)
- [Example API Requests](#example-api-requests)
- [Project Setup](#project-setup)
- [Environment Variables](#environment-variables)
- [License](#license)

## Features

- User registration & login (with JWT)
- Secure password hashing (bcryptjs)
- Products CRUD (admin)
- Shopping cart
- Place orders
- Password reset via email (SendGrid)
- Clean API error handling
- Pagination & search-ready endpoints

## Authentication

- **Signup:** `POST /api/auth/signup`
- **Login:**  `POST /api/auth/login`  
  → returns a **JWT** token
- **JWT token** must be sent as  
  `Authorization: Bearer <token>`  
  in all protected endpoints.
- **Logout:** Client-side (delete token)

## Endpoints

### Auth Endpoints

| Method | Route                 | Description                      | Body / Params                     |
|--------|-----------------------|-----------------------------------|------------------------------------|
| POST   | `/api/auth/signup`    | Register a new user               | `{ email, password, confirmPassword }` |
| POST   | `/api/auth/login`     | Authenticate, get JWT token       | `{ email, password }`             |
| POST   | `/api/auth/reset`     | Request password reset email      | `{ email }`                       |
| POST   | `/api/auth/new-password` | Set new password with token     | `{ password, userId, passwordToken }` |

### Products Endpoints

| Method | Route                               | Description                      | Auth         |
|--------|-------------------------------------|-----------------------------------|--------------|
| GET    | `/api/shop/products`                | List products (paginated)         | Optional     |
| GET    | `/api/shop/products/:productId`     | Get single product                | Optional     |

### Cart Endpoints

| Method | Route                        | Description                | Auth  |
|--------|------------------------------|----------------------------|-------|
| GET    | `/api/shop/cart`             | Get current user cart      | Yes   |
| POST   | `/api/shop/cart`             | Add product to cart        | Yes   |
| DELETE | `/api/shop/cart/:productId`  | Remove product from cart   | Yes   |

### Orders Endpoints

| Method | Route                     | Description                    | Auth  |
|--------|---------------------------|--------------------------------|-------|
| POST   | `/api/shop/orders`        | Place a new order (from cart)  | Yes   |
| GET    | `/api/shop/orders`        | Get user orders                | Yes   |
| GET    | `/api/shop/orders/:orderId` | Get a specific order         | Yes   |

### Admin Endpoints

| Method | Route                                  | Description                  | Auth  |
|--------|----------------------------------------|------------------------------|-------|
| GET    | `/api/admin/products`                  | List all products by admin   | Yes   |
| POST   | `/api/admin/add-product`               | Add new product              | Yes   |
| POST   | `/api/admin/edit-product`              | Edit product (by productId)  | Yes   |
| GET    | `/api/admin/edit-product/:productId`   | Get product for edit         | Yes   |
| DELETE | `/api/admin/product/:productId`        | Delete product               | Yes   |

## Data Models

### User

```json
{
  "email": "user@example.com",
  "password": "<hashed_password>",
  "cart": {
    "items": [
      { "productId": "<ObjectId>", "quantity": 2 }
    ]
  }
}
