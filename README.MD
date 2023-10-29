# eCommerce REST API

**Final Project for CT449**

**Author**: Ly Dai Phat - B1705292

## Features

- User registration.
- User login and logout.
- `JWT-based authentication`.
- Product creation, update, deletion, and retrieval.
- Review creation, update, deletion, and retrieval.
- Cart creation, update, deletion, and retrieval. 
- Order creation, update, deletion, and retrieval.
- Image upload for products using `Cloud service`.

## Tech Stack

**Backend:**
- Express.js (Node.js)

**Image Upload:** 
- Cloudinary for uploading images

**Data Storage:** 
- MongoDB for data storage using `Mongoose Object Data Model`

**User Authentication:**
- JSON Web Tokens (JWT)

## API Reference

#### User Authentication
- `POST /api/v1/auth/register` - Register a new user.
- `POST /api/v1/auth/login` - Login with an existing user.
- `GET /api/v1/auth/logout` - Logout the current user.

#### User
- `GET /api/v1/users` - Get all users.
- `GET /api/v1/users/:id` - Get single user.
- `GET /api/v1/users/showMe` -  Show information about the current user.
- `PATCH /api/v1/users/updateUser` -  Update user profile.
- `PATCH /api/v1/users/updateUserPassword` -  Update user password.

#### Products (Including image upload to Cloudinary)
- `GET /api/v1/products` - Get all products.
- `POST /api/v1/products` - Create a new product.
- `GET /api/v1/products/:id` - Get a single product by ID.
- `PATCH /api/v1/products/:id` - Update a product by ID.
- `DELETE /api/v1/products/:id` - Delete a product by ID.
- `GET /api/v1/products/:id/reviews` - Get a single product review.

#### Cart (*Logign required)
- `GET /api/v1/carts` - Get the user's cart.
- `POST /api/v1/carts` - Add product to the user's cart.
- `DELETE /api/v1/carts` -  Remove a product from user's cart (requires the product ID in the request body).
- `DELETE /api/v1/carts/clear` -  Clear the user's cart.

#### Order
- `GET /api/v1/orders` - Get all orders.
- `POST /api/v1/orders` - Create a order.
- `GET /api/v1/orders/:id` - Get a single order.
- `PATCH /api/v1/orders/:id` - Update a order.
- `GET /api/v1/orders/showAllMyOrders` - Get all orders for the current user.

#### Product Reviews
- `GET /api/v1/reviews` - Get all reviews for a product.
- `POST /api/v1/reviews` - Create a new review for a product.
- `GET /api/v1/reviews/:id` - Get a single review by ID.
- `PATCH /api/v1/reviews/:id` - Update a review by ID.
- `DELETE /api/v1/reviews/:id` - Delete a review by ID.
