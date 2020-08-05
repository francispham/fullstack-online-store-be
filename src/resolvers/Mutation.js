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
  }
};

module.exports = Mutations;
