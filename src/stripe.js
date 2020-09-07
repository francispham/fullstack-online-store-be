module.exports = require('stripe')(process.env.STRIPE_SECRET);

/* The about is the same as
const stripe = require('stripe');
const config = stripe(process.env.STRIPE_SECRET);
module.exports = config;
*/
