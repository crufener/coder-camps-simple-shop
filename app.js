// Include express
const express = require('express');
const app = express();

const session = require('express-session');
const bodyParser = require('body-parser');

const port = 3000;

const mongoDb = require('mongodb');
const ObjectId = mongoDb.ObjectID;
const MongoClient = mongoDb.MongoClient;

// Set the body parser.
app.use(bodyParser.urlencoded({
    extended: true
}));

// Set the templating.
app.set('view engine', 'ejs');

app.use(express.static('public'));

// Setup the session for use by the express.
app.use(session({
    secret: 'this is my secret code...', // Used to keep the session hard to hack.
    resave: false,
    saveUninitialized: true
}));

var db;

MongoClient.connect('mongodb://crufener:jenniferr1@ds031597.mlab.com:31597/myshoppingcart', function(error, database) {
    // Check for error.
    if (error) {
        throw error;
        return;
    }

    // Start the server.
    db = database;


    app.listen(port, function() {
        console.log('- App started on port ' + port);
    })
});

// Route to home page.
app.get('/', function(request, response) {
    response.render('index.ejs');
});

// Handle routes for login.
app.get('/login', function(request, response) {
    response.render('login.ejs');
});

app.get('/error', function(request, response) {
    response.render('error.ejs');
});
/////////////////////////////////////////////////////

//login code

app.post ('/login', function (request, response) {
    console.log ('---------');
    console.log ('form data: ', request.body);

    db.collection ('users').findOne (
        {
            username: request.body.username,
            password: request.body.password
        },
        function (error, user) {
            console.log ('database result: ', user);
            console.log ('\n');

            // Check if we have a result of a user or not.
            if (!user) {
                // No user with sent credentials found.
                response.redirect ('/error');
            }
            else {
                // User found log user in system.

                // Save the user to the session.
                // app.set ('user', result);
                request.session.user = user;

                // Redirect to the profile page.
                if (user.admin) {
                    response.redirect ('/admin');
                }
                else {
                    response.redirect ('/profile');
                }
            }
        }
    );
});

// signup route
app.get('/signup', (req, res) => {
    res.render('signup');
});

//  POST signup route
app.post('/signup', (req, res) => {
    db.collection('users').insert({
        username: req.body.username,
        password: req.body.password,
        admin: "false"
    },
    function(err, user) {
        if(err) {
            console.log(`There was a problem!!!!!!!!!!!!
                ${err}`);
            res.render('error');
        }
        console.log(`Created the user with the values of:
            username: ${req.body.username}
            password: ${req.body.password}`);
        res.render('login');
    });
});

// Logout route
app.get ('/logout', function (request, response) {
    // Destroy the session clearing out it's data.
    request.session.destroy ();

    response.redirect ('/login');
});

// User profile page.
app.get ('/profile', function (request, response) {
    // Grab the user from the user.
    // var user = app.get ('user');
    var user = request.session.user;

    // Show the profile page with the user info.
    response.render ('profile.ejs', {user: user});
});

app.get ('/admin', function (request, response) {
    // Grab the user from the user.
    var user = request.session.user;

    console.log ('user: ', user);

    if (user && user.admin) {
        response.render ('admin.ejs', {user: user});
    }
    else {
        response.render ('error.ejs');
    }
});

//===============================================

// -----------------------------------------
// Products

// Route for displaying a list of products.
app.get('/product', function(request, response) {

    // Pull all of the product items from the database.
    db.collection('products').find().toArray(function(error, resultList) {
        // Throw error if found.
        if (error) {
            throw error;
            response.redirect('/error');
        } else {
            // Render out the product page.
            // console.log (resultList);

            // This is temporary.
            var item = resultList[0];
            console.log('item id: ', item._id);


            // Render the page once the query is done.
            response.render('product-list', {
                name: 'craig rufener',
                city: 'prineville',
                productList: resultList
            });
        }
    });
});

app.get('/cart/add/:id', function(request, response) {
    console.log('Item added by id: ' + request.params.id);


    // console.log ('Item: ', MongoClient);
    // console.log ('Item: ', new ObjectId (request.params.id));
    // var objectId = request.params.id;

    // Run a query to look for the product by id.
    db.collection('products').findOne(

        // The type of document to search for.
        {
            _id: new ObjectId(request.params.id)
                // name: objectId
        },

        // The fields of the found object to return.
        // An empty JS literal object will return
        // all of the object's fields.
        {},

        // Callback function to run when the query is done.
        function(error, resultList) {

            // Check for errors.
            if (error) {
                throw error;
                response.redirect('/error');
            }

            // Check if we have a shopping cart in the session.
            var cart = request.session.cart;

            // If no cart exists, create a new cart.
            if (!cart) {
                cart = {
                    total: 0,
                    itemList: []
                };

                // Save the cart to the session.
                request.session.cart = cart;
            }

            // Grab the item from the result list.
            var item = resultList;

            // Add to the cart quantity.
            cart.total = cart.total + item.price;

            // Add the product to the cart.
            cart.itemList.push(item);

            // Respond with a simple message.
            console.log('--------------');
            console.log('result list: ', resultList);
            console.log('cart: ', cart);
            console.log('');

            response.redirect('/cart');
        }
    );
});

// Remove an indvidual item from the cart.
app.get('/cart/remove/:index', function(request, response) {
    console.log('remove item by index: ', request.params.index);

    var cart = request.session.cart;

    var price = cart.itemList[0].price;
    cart.total = cart.total - price;

    // console.log ('- Testing..................', cart.total);
    // console.log ('- Testing..................', price);
    // console.log ('- Testing..................', cart.total);

    // Redirect to the cart.
    response.redirect('/cart');
});

app.get('/cart', function(request, response) {
    // Grab the shopping cart.
    var cart = request.session.cart;

    // Create the cart if none exists.
    if (!cart) {
        cart = {
            total: 0,
            itemList: []
        }

        // Save the cart to session.
        request.session.cart = cart;
    }

    // Render the cart page.
    // response.render ('cart.ejs', {cart: cart});

    // Render the cart page.
    response.render('cart.ejs', {
        cart: cart
    });

});




// Styling the base template
app.get('/template', function(req, res) {
    res.render('template.ejs');
});
