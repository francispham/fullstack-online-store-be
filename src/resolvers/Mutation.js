const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Mutations = {
  async createItem(parent, args, context, info) {
    // TODO: Check if the user login


    const item = await context.db.mutation.createItem({
      data: {
        ...args
      }
    }, info); 
    // 'info' is required to get back the 'actual query' from
    // the frontend so 'context' can pass it into the backend
    // => Specify what data gets returned from the db when we create it.
    console.log('item:', item)
    return item;
  },

  updateItem(parent, args, context, info) {
    // First take a Copy of the Updates
    const updates = { ...args };
    // Remove the ID from the Updates
    delete updates.id;
    // Run the Update Method
    return context.db.mutation.updateItem(
      {
        data: updates,
        where: {
          id: args.id,
        },
      },
      info
    );
  },

  async deleteItem(parent, args, context, info) {
    const where = { id: args.id };
    // 1. Find the Item
    const item = await context.db.query.item({ where }, `{ id title }`);
    // 2. Check if they own that item, or have the permissions
    
    // 3. Delete it
    return context.db.mutation.deleteItem({ where }, info);
  },

  async signup(parent, args, context, info) {
    // Lowercase the Emails
    args.email = args.email.toLowerCase();
    // Hash their Passwords
    const password = await bcrypt.hash(args.password, 10);
    // Create the User in the Database
    const user = await context.db.mutation.createUser({
      data: {
        ...args,
        password,
        permissions: { set: ['USER']},
      },
    }, info);
    // Create the JWT Token for them
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // Set the JWT as a Cookie on the Response
    context.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365, // 1 Year Cookie
    });
    // Finally Return the User to the Browser
    return user;
  },
};

module.exports = Mutations;
