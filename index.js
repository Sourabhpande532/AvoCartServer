const { initializeDatabase } = require( "./db/db.connect" );
const express = require( "express" );
const app = express();
const cors = require( "cors" );
initializeDatabase();

const corsOption = {
    origin: "*",
    credential: true,
    optionSuccessStatus: 200,
};

app.use( express.json() );
app.use( cors( corsOption ) );

// PRODUCT 
const Product = require( "./model/Product.js" );

// CREATE/ADD 
app.post( "/api/products", async ( req, res ) => {
    try {
        const p = await Product.create( req.body );
        res.json( { data: { product: p } } )
    } catch ( error ) {
        res.status( 500 ).json( { error: error.message } )
    }
} )

// RETRIVED/GET 
// app.get( "/api/products", async ( req, res ) => {
//     try {
//         const products = await Product.find().populate( 'category' );
//         res.json( { data: { products } } );
//     } catch ( err ) {
//         res.status( 500 ).json( { error: err.message } );
//     }
// } )

app.get( "/api/products/:productId", async ( req, res ) => {
    try {
        const product = await Product.findById( req.params.productId ).populate( 'category' );
        if ( !product ) return res.status( 404 ).json( { message: 'Product not found' } );
        res.json( { data: { product } } );
    } catch ( err ) {
        res.status( 500 ).json( { error: err.message } );
    }
} )

app.get('/api/products', async (req, res) => {
  try {
    const query = {};
    if (req.query.category) query.category = req.query.category;
    if (req.query.search) query.title = { $regex: req.query.search, $options: 'i' };
    const products = await Product.find(query).populate('category');
    res.json({ data: { products } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update New fields in db 
app.put( "/api/products/add-fields", async ( req, res ) => {
    try {
        const result = await Product.updateMany(
            {}, //empty filter = select all product 
            {
                $set: {
                    discount: 25,
                    deliveryCharge: 199
                }
            }
        );
        res.json( {
            message: "All products update successfully",
            modifiedCount: result.modifiedCount
        } )
    } catch ( error ) {
        console.error( error );
        res.status( 500 ).json( { error: "Something went wrong" } )
    }
} )


const Category = require( "./model/Category.js" );
// CATEGORIES ADDED 
app.post( "/api/categories", async ( req, res ) => {
    try {
        const c = await Category.create( req.body );
        res.json( { data: { category: c } } )
    } catch ( error ) {
        res.status( 500 ).json( { error: error.message } )
    }
} )

app.get( "/api/categories", async ( req, res ) => {
    try {
        const categories = await Category.find();
        res.json( { data: { categories } } );
    } catch ( err ) {
        res.status( 500 ).json( { error: err.message } );
    }
} )

app.get( "/api/categories/:categoryId", async ( req, res ) => {
    try {
        const category = await Category.findById( req.params.categoryId );
        if ( !category ) return res.status( 404 ).json( { message: 'Category not found' } );
        res.json( { data: { category } } );
    } catch ( err ) {
        res.status( 500 ).json( { error: err.message } );
    }
} )

// CART ITEM 
const CartItem = require( "./model/CartItem.js" );

/* OPTIONAL ADDING use wheneve fill
   if you want to increate qty:++ then use this 
app.post( "/api/add/cart", async ( req, res ) => {
    try {
        const items = await CartItem.create( req.body );
        res.json( { data: { cart: items } } )
    } catch ( error ) {
        res.status( 500 ).json( { error: "internal error" } )
    }
} ) */

app.get( "/api/cart", async ( req, res ) => {
    const userId = req.query.userId || "default";
    // res.send( `User Id received: ${ userId }`)
    const items = await CartItem.find( { userId } ).populate( "product" );
    res.json( { data: { cart: items } } )
} )

// CREATING 
app.post( "/api/cart", async ( req, res ) => {
    // get data from frontend & USING Post request add product to cart  
    const { userId = 'default', productId } = req.body;

    let item = await CartItem.findOne( { userId, product: productId } );
    // If product already exists => Just increse Quantity 
    if ( item ) {
        item.qty += 1;
        await item.save();
    }
    // If product is not in cart, create a new entry
    else {
        item = await CartItem.create( { userId, product: productId, qty: 1 } );
    }
    // Updated cart:.find({ userId }) - get everything belonging to that user e.g ramesh,or suresh
    const items = await CartItem.find( { userId } ).populate( 'product' );
    res.json( { data: { cart: items } } );
} )

/* REF: Understand->https://stackblitz.com/edit/vitejs-vite-rrspmzx7?file=src%2Fapp.jsx,src%2Fmain.jsx,src%2Fcomponent%2FStudentDetails.jsx&terminal=dev */


// UPADATE 
app.put( '/api/cart/:id', async ( req, res ) => {
    const { qty } = req.body;
    const item = await CartItem.findById( req.params.id );
    if ( !item ) return res.status( 404 ).json( { message: 'Not found' } );
    item.qty = qty;
    await item.save();
    res.json( { data: { item } } );
} );

// DELETE 
app.delete( '/api/cart/:id', async ( req, res ) => {
    try {
        const cartItem = await CartItem.findByIdAndDelete( req.params.id );
        if ( !cartItem ) return res.status( 404 ).json( { message: "item not found" } )
        res.json( { message: "Deleted", cart: cartItem } )
    } catch ( error ) {
        console.error( "cannot delte via id", error.message );
        res.status( 500 ).json( { success: false, message: "Internal Error", err: error.message } )
    }
} );

// WISHLIST 
const WishlistItem = require( "./model/WishlistItem.js" )

app.get( "/api/wishlist", async ( req, res ) => {
    const userId = req.query.userId || 'default';
    const items = await WishlistItem.find( { userId } ).populate( 'product' );
    res.json( { data: { wishlist: items } } );
} )

app.post( '/api/wishlist', async ( req, res ) => {
    //NOTE: renaming here product: productId
    const { userId = 'default', productId } = req.body;
    // This checks if the product is already in the user’s wishlist
    const exists = await WishlistItem.findOne( { userId, product: productId } );
    if ( exists ) {
        const items = await WishlistItem.find( { userId } ).populate( 'product' );
        return res.json( { data: { wishlist: items } } );
    }
    // If the product doesn’t exist already, this line adds it add new wishlist item.
    await WishlistItem.create( { userId, product: productId } );
    // After adding, it fetches the new full wishlist again — now including the newly added product.
    const items = await WishlistItem.find( { userId } ).populate( 'product' );
    res.json( { data: { wishlist: items } } );
} );

// DELETED 
app.delete( '/api/wishlist/:id', async ( req, res ) => {
    await WishlistItem.findByIdAndDelete( req.params.id );
    res.json( { message: 'Deleted' } );
} );



// ADDRESS 
const Address = require( "./model/Address.js" );
app.get( '/api/addresses', async ( req, res ) => {
    const userId = req.query.userId || 'default';
    const addresses = await Address.find( { userId } );
    res.json( { data: { addresses } } );
} );

// CREATE 
app.post( '/api/addresses', async ( req, res ) => {
    const { userId = 'default' } = req.body;
    const addr = await Address.create( { ...req.body, userId } );
    const addresses = await Address.find( { userId } );
    res.json( { data: { addresses } } );
} );

// UPADATE
app.put( '/api/addresses/:id', async ( req, res ) => {
    const addr = await Address.findByIdAndUpdate( req.params.id, req.body, { new: true } );
    res.json( { data: { address: addr } } );
} );

// DELETE 
app.delete( '/api/addresses/:id', async ( req, res ) => {
    await Address.findByIdAndDelete( req.params.id );
    res.json( { message: 'Deleted' } );
} );

// ORDERED 

const Order = require( "./model/Order.js" );

app.get( '/api/orders', async ( req, res ) => {
    const userId = req.query.userId || 'default';
    const orders = await Order.find( { userId } ).populate( 'items.product' );
    res.json( { data: { orders } } );
} );

app.post( '/api/orders', async ( req, res ) => {
    const { userId = 'default', items, total, address } = req.body;
    const order = await Order.create( { userId, items, total, address } );
    res.json( { data: { order } } );
} );

app.get( "/", ( req, res ) => {
    res.send( "Hello, Welcome to express routes." );
} );

const PORT = process.env.PORT || 4000;
app.listen( PORT, () => {
    console.log( `The server is running on http://localhost:${ PORT }` );
} );