import db from './db'
const initialState = {
  recipes: db.recipes,
  categories: db.categories,
  ingredients: db.ingredients
};

const reducerRoutes = {
  default: (state, action) => state
}

const rootReducer = (state = initialState, action) => {
  let reducerAction = reducerRoutes[action.type] || reducerRoutes.default
  return reducerAction(state, action)
}

export default rootReducer;
