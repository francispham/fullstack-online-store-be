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
};

module.exports = Mutations;
