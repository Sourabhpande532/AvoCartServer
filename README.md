# E-Commerce App

---

Build a complete e-commerce application with a React frontend and Node/Express + MongoDB backend that supports product browsing, filtering/sorting, cart & wishlist flows, address/checkout, and order history.

---

## Demo Link

[Live Demo](https://avo-cart-client.vercel.app/)

---

## Quick Start

```
git clone https://github.com/Sourabhpande532/AvoCartClient.git
cd AvoCartClient
npm install
npm run dev  # or 'npm start' / 'yarn dev'

```

---

## Technologies

- React JS
- React Router
- Node Js
- Express Js
- Mongo DB
- RESTful APIs

---

## Demo Video

Watch a walkthrough (5-7 minutes) of all major features of this app:<br>
[Drive Video Link](https://drive.google.com/file/d/1NNU6ChnTuG-kULwX14hQ2lhDyn_oo_RT/view)

---

## Features

**Home & Product Browsing**

- Home page with featured categories and smooth navigation to product listings.
- Product listing page with filters(category,rating slider) & price sorting (low ↔ high)

**Product Experience**

- Product cards showing image, name, price, rating, and quick actions (Add to Cart / Wishlist)
- Detailed product page with full information and related products

**Cart & Wishlist**

- Cart and Wishlist pages to add/remove items, update quantity, and move items between them

**User Profile**

- Profile page with address management and order history tracking

**General Features**

- Global search in navbar, loading states, and user alerts for actions
- Fully responsive UI for desktop and mobile experience

---

## APIs Reference

### GET /api/products

Retrieve all product with support for filtering,sorting.

Sample Response:

```
[
  { _id, title, price, category, rating, stockInCount, images,sizes,discount,deliveryCharge },
  ...
]

```

### GET /api/products/:productId

Fetch Detailed information for a single product.

Sample Response:

```
{
  _id, title, description, price, category, rating, stockInCount, images,sizes, discount,deliveryCharge
}

```

### GET /api/categories

Retrieve all product categories.

Sample Response:

```
[
  { _id, image, description }
]

```

### GET /api/categores/:categoryId

Get all products under a specific category.

Sample Response:

```
{
  _id,
  name,
  products: [{ _id, title, price }]
}

```

### POST /api/cart

Add a product to the user’s cart (protected route).

Sample Response:

```

{ _id, userId, productId, qty,size }

```

### GET /api/cart

Fetch all items in user’s cart by model-referencing.

Sample Response:

```
[
  { _id, product, qty, size }
]

```

## PUT /api/cart/:id

Update quantity of a cart item.

Sample Response:

```
{ _id, productId, qty }

```

## DELETE /api/cart/:id

Remove an item from the cart.

Sample Response:

```
{ success: true }

```

## POST /api/wishlist

Add a product to the wishlist.

Sample Response:

```
{ _id, userId, productId }

```

### GET /api/wishlist

Retrieve all wishlist items.

Sample Response:

```
[
  { _id, product },...
]

```

### DELETE /api/wishlist/:id

Remove a product from the wishlist.

Sample Response:

```
{ success: true }
```

### POST /api/address

Add a new delivery address.

Sample Response:

```
{ _id, name, street, city, state, zip }
```

### GET /api/address

Retrieve all saved addresses for the user.

Sample Response:

```
[
  { _id, name, street, city, state, zip }
]
```

### PUT /api/address/:id

Update an existing address.

Sample Response:

```
{ _id, name, street, city, state, zip }
```

### DELETE /api/address/:id

Delete an address.

Sample Response:

```
{ success: true }
```

### POST /api/orders

Create a new order from cart items.

Sample Response:

```
{ _id, userId, items, totalAmount, status }
```

### GET /api/orders

Fetch all orders for the logged-in user.

Sample Response:

```
[
  { _id, items, totalAmount, status, createdAt }
]

```

---

## Deployment & Links

- Frontend GitHub: https://github.com/Sourabhpande532/AvoCartClient

- Backend GitHub: https://github.com/Sourabhpande532/AvoCartServer

---

## Environment Setup

**Backend(/server/.env)**

```
# Server
PORT=4000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/anvaya

# CORS
CLIENT_URL=http://localhost:3000

```

**Frontend**

```
# API Base URL
REACT_APP_BASE_URL=http://localhost:5000/api

```

## Contact

For bugs or feature requests, please reach out to [sourabhpande43@gmail.com](mailto:sourabhpande43@gmail.com)
