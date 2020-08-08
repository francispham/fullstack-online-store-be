const { forwardTo } = require('prisma-binding');

const Query = {
  /* 
  * Using 'forwardTo' when the Query is exactly the same in both
  * Prisma & Public Query, or no Need for Authentication or Filter
  items: forwardTo('db'),
  */ 
  async items(parent, args, context, info) {
    const items = await context.db.query.items();
    return items;
  },
  // Query a Single Item
  item: forwardTo('db'),
};

module.exports = Query;
