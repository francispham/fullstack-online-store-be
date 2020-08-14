const { forwardTo } = require('prisma-binding');

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
  }
};

module.exports = Query;
