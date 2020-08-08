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
    // TODO
    // 3. Delete it
    return context.db.mutation.deleteItem({ where }, info);
  },
};

module.exports = Mutations;
