const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const { randomBytes } = require('crypto');

const { hasPermission } = require('../utils');
const { transport, makeEmail } = require('../mail');

const Mutations = {
  async createItem(parent, args, context, info) {
    // Check if the user login
    if(!context.request.userId) {
      throw new Error('You Must Login');
    };

    const item = await context.db.mutation.createItem({
      data: {
        // This is How to Create a Relationship between Item & User
        user: {
          connect: {
            id: context.request.userId,
          },
        },
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
    const item = await context.db.query.item({ where }, `{ id title user { id }}`);
    // 2. Check if they own that item, or have the permissions
    const ownsItem = item.user.id === context.request.userId;
    const hasPermissions = context.request.user.permissions.some(
      permission => ['ADMIN', 'ITEMDELETE'].includes(permission)
    );
    
    if (!ownsItem && !hasPermissions) {
      throw new Error("You don't have Permission to Delete this Item");
    };
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

  async signin(parent, { email, password }, context, info) {
    // 1. Check if there is a User with that Email
    const user = await context.db.query.user({ where: { email } });
    if (!user) {
      throw new Error(`No such User found for Email ${email}`);
    };
    // 2. Check if their password is correct
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error('Invalid Password!');
    };
    // 3. Generate the JWT Token
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // 4. Set the Cookie with the Token
    context.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    });
    // 5. Return the User
    return user;
  },

  signout(parent, args, context, info) {
    context.response.clearCookie('token');
    return { message: 'Goodbye' }
  },

  async requestReset(parent, args, context, info) {
    // 1. Check if this is a Real User
    const user = await context.db.query.user({ where: { email: args.email }});
    if (!user) {
      throw new Error(`No Such User Found for Email ${args.email}`);
    }
    // 2. Set a Reset Token and Expiry on that User
    const resetToken = (await promisify(randomBytes)(20)).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 Hour from now
    const res = await context.db.mutation.updateUser({
      where: { email: args.email },
      data: { resetToken, resetTokenExpiry },
    })
    // 3. Email them that Reset Token
    const mailRes = await transport.sendMail({
      from: 'francis@francispham.ca',
      to: user.email,
      subject: 'Your Password Reset Token',
      html: makeEmail(
        `Your Password Reset Token is Here! \n\n 
        <a href="${process.env.FRONTEND_URL}/reset?resetToken=${resetToken}">
        Click Here to Reset
        </a>`,
        ),
      })
      console.log('mailRes:', mailRes)
    // 4. Return the Message
    return { message: 'Thanks!!!'}
  },

  async resetPassword(parent, args, context, info) {
    // 1. Check if the Passwords match
    if (args.password !== args.confirmPassword) {
      throw new Error("Passwords Don't Match");
    };
    // 2. Check if it's a legit Reset Token & Expired
    const [user] = await context.db.query.users({ // Grab the First User
      where: {
        resetToken: args.requestToken,
        resetTokenExpiry_gte: Date.now() - 3600000,
      },
    });
    if (!user) {
      throw new Error('This Token is either Invalid or Expired!!')
    };
    // 3. Hash their New Password
    const password = await bcrypt.hash(args.password, 10);
    // 4. Save the New Password to the User and remove the Old resetToken fields
    const updatedUser = await context.db.mutation.updateUser({
      where: { email: user.email },
      data: {
        password,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });
    // 5. Generate JWT
    const token = jwt.sign({ userId: updatedUser.id }, process.env.APP_SECRET);
    // 6. Set the JWT Cookie
    context.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    });
    // 7. Return the Updated User
    return updatedUser;
  },

  async updatePermissions(parent, args, context, info) {
    // 1. Check if they are logged in
    if(!context.request.userId) {
      throw new Error('You must be logged in!')
    };
    // 2. Query the Current User
    const currentUser = await context.db.query.user({
      where: {
        id: context.request.userId,
      },
    }, info);
    // 3. Check if they have Permissions to do this
    hasPermission(currentUser, ['ADMIN', 'PERMISSIONUPDATE']);
    // 4. Update the Permissions
    return context.db.mutation.updateUser({
      data: {
        permissions: {
          set: args.permissions,
        },
      },
      where: {
        id: args.userId
      }
    }, info);
  },

  async addToCart(parent, args, context, info) {
    // 1. Make sure they are signed in
    const { userId } =context.request;
    if (!userId) {
      throw new Error('You Must be Signed In');
    };
    // 2. Query the Users Current Cart
    const [existingCartItem] = await context.db.query.cartItems({
      where: {
        user: { id: userId },
        item: { id: args.id },
      },
    });
    // 3. Check if that Item is already in their Cart and Increment by 1 if it is
      if (existingCartItem) {
        return context.db.mutation.updateCartItem({
          where: { id: existingCartItem.id },
          data: { quantity: existingCartItem.quantity + 1 },
        }, info);
      };
    // 4. If it's not, Create a fresh CartItem for that User!
    return context.db.mutation.createCartItem({
      data: {
        user: {
          connect: { id: userId },
        },
        item: {
          connect: { id: args.id },
        },
      },
    }, info);
  },

  async removeFromCart(parent, args, context, info) {
    // 1. Find the Cart Item
    const cartItem = await context.db.query.cartItem({
      where: {
        id: args.id,
      },
    }, `{ id, user { id }}`);
    // 2. Make sure we found an Item
    if (!cartItem) throw new Error('No CartItem Found!');
    // 3. Make sure they own that Cart Item
    if (cartItem.user.id !== context.request.userId) {
      throw new Error('Cheating??');
    };
    // 4. Delete that Cart Item
    return context.db.mutation.deleteCartItem(
      {
        where: { id: args.id },
      }, info
    )
  }
};

module.exports = Mutations;
