const express = require('express');
const app = express();
const fs = require('fs');
const db = require('./database.js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const signature = '@!3$%%^&1ed^&*!l@#^&***()R0441';
const bodyParser = require('body-parser');

//db queries
let createUser = (user) =>
  db.query(`INSERT into users (email, password, username, firstname, lastname) VALUES ('${user.email}', '${user.password}', '${user.username}', '${user.firstname}', '${user.lastname}') RETURNING id;`)

let getMyRecipesFromDB = (id) =>
  db.query(`SELECT * from recipes WHERE id = ${id};`)

let getAllRecipes = (req, res) =>
  db.query(`SELECT * from recipes`)
  .then(recipes => res.send(recipes))

let getMyCookBooksFromDB = (id) =>
  db.query(`SELECT * from cookbooks WHERE id = ${id};`)

let searchTerms = (req, res) =>
  db.query(`SELECT title from recipes;`)
  .then(terms => res.send(terms))
  .catch(err => res.send(err))

let postRecipeToDB = (recipe) =>
  db.query(`INSERT INTO "public"."recipes"("title", "ver", "prepmins", "cookmins",
  "descr", "user_id", "ingredients", "directions", "servings")
  VALUES('${recipe.title}', ${recipe.ver}, ${recipe.prepmins}, ${recipe.cookmins}, '${recipe.descr}', ${recipe.user_id},
  '${recipe.ingredients}', '${recipe.directions}', ${recipe.servings})
  RETURNING "id", "title", "ver", "derived_id", "prepmins", "cookmins", "createdon",
  "descr", "tag", "user_id", "ingredients", "directions", "servings", "image_url";`)
  
//authorization
let createToken = (userId) => {
  console.log(userId);
  let tokenPayload = {userId: userId};
  tokenPayload.token = jwt.sign({userId: userId}, signature, {expiresIn: '7d'});
  return JSON.stringify(tokenPayload)
}

let validateCredentials = (res, email, password) => {
  let userId
  let userQuery = db.query(`SELECT email, password, id from users WHERE email = '${email}';`)
  .then(users => {userId = users[0].id; return users[0]})
  .then(user => bcrypt.compare(password, user.password))
  .then(response => response ? userId : error)
  .then(userId => createToken(userId))
  .then(token => { console.log(token); return res.send(token)})
  .catch(error => res.send(error));
}

let tokenValidator = (token) =>
  jwt.verify(token, signature)

//handlers
let signIn = (req, res) => {
  let credentials = req.body;
  let {email, password} = credentials;
  validateCredentials(res, email, password);
}
let postUser = (req, res) => {
  let credentials = req.body;
  bcrypt.hash(credentials.password, 10)
  .then(hash => Object.assign({}, credentials, {password: hash}))
  .then(user => createUser(user))
  .then(arrayWithIdObject => arrayWithIdObject[0].id)
  .then(id => createToken(id))
  .then(token => res.send(token))
  .catch(error => res.send(error));
}

let getMyRecipes = (req, res) => {
  let authorization = req.headers.authorization;
  let payload = jwt.verify(authorization, signature);
  return (
    getMyRecipesFromDB(payload.userId)
    .then(recipes => res.send(recipes))
  )
}

let getMyCookBooks = (req, res) => {
  let authorization = req.headers.authorization;
  let payload = jwt.verify(authorization, signature);
  return(
      getMyCookBooksFromDB(payload.userId)
      .then(cookbooks => res.send(cookbooks))
  )
}

let postRecipe = (req, res) => {
  let recipe = req.body
  let token = req.headers.authorization;
  tokenValidator(token);
  return (
    postRecipeToDB(recipe)
    .then(response => res.send(response))
    .catch(err => res.send(err))
  )
}
//Middleware
app.use(bodyParser.json());
app.get('/recipes', getMyRecipes)
app.post('/recipes', postRecipe)
app.get('/all-recipes', getAllRecipes)
app.get('/cookbooks', getMyCookBooks)
app.post('/users', postUser)
app.post('/signin', signIn)
app.get('/search', searchTerms)


app.listen(3000, () => console.log('Recipes running on 3000'))
