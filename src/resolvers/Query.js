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
};

module.exports = Query;
