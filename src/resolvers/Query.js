const { forwardTo } = require('prisma-binding');

const { hasPermission } = require('../utils');

const Query = {
  /* 
  async items(parent, args, context, info) {
    const items = await context.db.query.items();
    return items;
  },
  */ 
  // Using 'forwardTo' when the Query is exactly the same in both
  // Prisma & Public Query, or no Need for Authentication or Filter
  items: forwardTo('db'),
  // Query a Single Item
  item: forwardTo('db'),
  // Query for Pagination
  itemsConnection: forwardTo('db'),
  // Query for Login Current User
  me(parent, args, context, info) {
    // Check if there is a Current User ID
    if(!context.request.userId) {
      return null;
    };
    return context.db.query.user({
      where: { id: context.request.userId },
    }, info);
  },
  async users(parent, args, context, info) {
    // 1. Check if they are Logged in
    if (!context.request.userId) {
      throw new Error('You Must Login')
    };

    // 2. Check if the User has the Permissions to Query All the Users
    hasPermission(context.request.user, ['ADMIN', 'PERMISSIONUPDATE']);

    // 3. If they do, Query All the Users!
    return context.db.query.users({}, info);
  },
  async order(parent, args, context, info) {
    // 1. Make sure they are logged in
    if (!context.request.userId) {
      throw new Error('Please SignIn');
    };
    // 2. Query the Current Order
    const order = await context.db.query.order({
      where: { id: args.id },
    }, info);
    // 3. Check if the user have the Permission to see this Order
    const ownsOrder = order.user.id === context.request.userId;
    const hasPermissionToSeeOrder = context.request.user.permissions.includes('ADMIN');
    if (!ownsOrder || !hasPermission) {
      throw new Error('You Cant see the Order');
    };
    // 4. Return the Order
    return order;
  },
  async orders(parent, args, context, info) {
    const { userId } = context.request;
    if(!userId) {
      throw new Error('Please Sign In');
    };
    return context.db.query.orders({
      where: {
        user: { id: userId }
      }
    }, info);
  },
};

module.exports = Query;
