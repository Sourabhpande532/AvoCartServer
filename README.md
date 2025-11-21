# PRD: Full-Stack E-commerce App (Frontend + Backend)

**Objective:**  
Build a complete e-commerce application with a React frontend and Node/Express + MongoDB backend that supports product browsing, filtering/sorting, cart & wishlist flows, address/checkout, and order history.

**Frontend (User Features):**  
- Home with featured categories → click a category → Product Listing (filters: category, rating slider, price sort low⇄high).  
- Product Cards with image, name, price, rating, Add to Cart, Add to Wishlist.  
- Product Detail page (full info + related products).  
- Cart & Wishlist pages: add/remove items, change quantity, move between cart & wishlist.  
- Profile page with Address Management and Order History.  
- Global search in navbar, loading states, and user alerts for actions.

**Backend (API & Data):**  
- Products: `GET /api/products` and `GET /api/products/:productId` (filtering/sorting done server/client).  
- Categories: `GET /api/categories` and `GET /api/categories/:categoryId`.  
- Cart: `POST /api/cart`, `GET /api/cart`, `PUT /api/cart/:id`, `DELETE /api/cart/:id`.  
- Wishlist: `POST /api/wishlist`, `GET /api/wishlist`, `DELETE /api/wishlist/:id`.  
- Address: `POST /api/address`, `GET /api/address`, `PUT /api/address/:id`, `DELETE /api/address/:id`.  
- Orders: `POST /api/orders`, `GET /api/orders`, plus update/delete endpoints.  
- Use Express, Mongoose, CORS, dotenv; secure DB URI in `.env`; validate inputs and use async/await + try/catch; test all endpoints via Postman.

**Deployment & Links:**  
- Frontend GitHub:   https://github.com/Sourabhpande532/AvoCartClient
  Live (Vercel):  https://avo-cart-client.vercel.app/
- Backend GitHub: https://github.com/Sourabhpande532/AvoCartServer 
  Live (Vercel):  https://avo-cart-server.vercel.app
- Recording URL: https://drive.google.com/file/d/1NNU6ChnTuG-kULwX14hQ2lhDyn_oo_RT/view?usp=sharing