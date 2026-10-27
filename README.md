# AvoCart — E-Commerce Backend API

---

A complete Node.js/Express + MongoDB backend for the AvoCart e-commerce application supporting product browsing, filtering/sorting, cart & wishlist flows, address management, checkout, OAuth 2.0 + JWT authentication, AI assistant, and order history.

---

## Demo Link

[Live Demo](https://avo-cart-client.vercel.app/)

---

## Quick Start

```bash
git clone https://github.com/Sourabhpande532/AvoCartServer.git
cd AvoCartServer
npm install
npm run dev
```

---

## Technologies

- Node.js & Express.js
- MongoDB & Mongoose
- Passport.js (Google & GitHub OAuth 2.0) & JWT Authentication
- RESTful APIs

---

## Demo Video

Watch a walkthrough (5-7 minutes) of all major features of this app:<br>
[Drive Video Link](https://drive.google.com/file/d/1NNU6ChnTuG-kULwX14hQ2lhDyn_oo_RT/view)

---

## Features

**Home & Product Browsing**

- Home page with featured categories and smooth navigation to product listings.
- Product listing page with filters (category, rating slider, price range) & price sorting (low ↔ high).

**Product Experience**

- Product cards showing image, name, price, rating, and quick actions (Add to Cart / Wishlist).
- Detailed product page with full information and related products.

**Cart & Wishlist**

- Cart and Wishlist endpoints to add/remove items, update quantity, and move items between them.

**User Profile**

- Profile endpoints with address management and order history tracking.

**General Features**

- Global search in navbar, loading states, and user alerts for actions.
- Fully responsive UI for desktop and mobile experience.

---

## APIs Reference

### GET /api/products

Retrieve all products with support for filtering and sorting.

Sample Response:

```json
[
  { "_id": "...", "title": "...", "price": 1999, "category": {}, "rating": 4.5, "countInStock": 15, "images": [], "discount": 25, "deliveryCharge": 199 }
]
```

### GET /api/products/:productId

Fetch detailed information for a single product.

Sample Response:

```json
{
  "_id": "...", "title": "...", "description": "...", "price": 1999, "category": {}, "rating": 4.5, "countInStock": 15, "images": [], "discount": 25, "deliveryCharge": 199
}
```

### GET /api/categories

Retrieve all product categories.

Sample Response:

```json
[
  { "_id": "...", "name": "Men", "image": "...", "description": "..." }
]
```

### GET /api/categories/:categoryId

Get category details by ID.

Sample Response:

```json
{
  "_id": "...",
  "name": "Men",
  "image": "...",
  "description": "..."
}
```

### POST /api/cart

Add a product to the user's cart (protected route).

Sample Response:

```json
{ "_id": "...", "userId": "...", "product": {}, "qty": 1, "size": "M" }
```

### GET /api/cart

Fetch all items in the user's cart.

Sample Response:

```json
[
  { "_id": "...", "product": {}, "qty": 1, "size": "M" }
]
```

### PUT /api/cart/:id

Update quantity of a cart item.

Sample Response:

```json
{ "_id": "...", "product": "...", "qty": 2 }
```

### DELETE /api/cart/:id

Remove an item from the cart.

Sample Response:

```json
{ "success": true }
```

### POST /api/wishlist

Add a product to the wishlist.

Sample Response:

```json
{ "_id": "...", "userId": "...", "product": {} }
```

### GET /api/wishlist

Retrieve all wishlist items.

Sample Response:

```json
[
  { "_id": "...", "product": {} }
]
```

### DELETE /api/wishlist/:id

Remove a product from the wishlist.

Sample Response:

```json
{ "success": true }
```

### POST /api/addresses

Add a new delivery address.

Sample Response:

```json
{ "_id": "...", "name": "...", "street": "...", "city": "...", "state": "...", "zip": "110001", "phone": "9876543210" }
```

### GET /api/addresses

Retrieve all saved addresses for the user.

Sample Response:

```json
[
  { "_id": "...", "name": "...", "street": "...", "city": "...", "state": "...", "zip": "110001", "phone": "9876543210" }
]
```

### PUT /api/addresses/:id

Update an existing address.

Sample Response:

```json
{ "_id": "...", "name": "...", "street": "...", "city": "...", "state": "...", "zip": "110001", "phone": "9876543210" }
```

### DELETE /api/addresses/:id

Delete an address.

Sample Response:

```json
{ "success": true }
```

### POST /api/orders

Create a new order from cart items.

Sample Response:

```json
{ "_id": "...", "userId": "...", "items": [], "total": 1599, "address": {} }
```

### GET /api/orders

Fetch all orders for the logged-in user.

Sample Response:

```json
[
  { "_id": "...", "items": [], "total": 1599, "address": {}, "createdAt": "..." }
]
```

---

## Deployment & Links

- Frontend GitHub: https://github.com/Sourabhpande532/AvoCartClient
- Backend GitHub: https://github.com/Sourabhpande532/AvoCartServer

---

## Environment Setup

**Backend (`/server/.env`)**

```env
PORT=4000
MONGO_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/avocart
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CLIENT_ID=your_github_client_id
CLIENT_SECRET=your_github_client_secret
CALLBACK_URL=http://localhost:4000/auth/google/callback
OPENROUTER_API_KEY=your_openrouter_api_key
```

**Frontend (`/client/.env`)**

```env
REACT_APP_API_URL=http://localhost:4000/api
REACT_APP_SERVER_URL=http://localhost:4000
```

## Contact

For bugs or feature requests, please reach out to [sourabhpande43@gmail.com](mailto:sourabhpande43@gmail.com)
