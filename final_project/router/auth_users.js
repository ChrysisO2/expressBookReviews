const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username) => { // returns boolean
  // Check if username is a non-empty string and not already taken
  if (!username || typeof username !== "string") {
    return false;
  }
  return !users.some((user) => user.username === username);
};

const authenticatedUser = (username, password) => { // returns boolean
  // Check if username and password match a record in users
  return users.some((user) => user.username === username && user.password === password);
};

// Only registered users can login (mounted at /customer/login)
regd_users.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  if (authenticatedUser(username, password)) {
    const accessToken = jwt.sign(
      { data: password, username },
      "access",
      { expiresIn: 60 * 60 }
    );

    req.session.authorization = {
      accessToken,
      username
    };

    return res.status(200).json({ message: "User successfully logged in" });
  } else {
    return res.status(401).json({ message: "Invalid Login. Check username and password" });
  }
});

// Add or modify a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const review = req.query.review;
  const username = req.session.authorization && req.session.authorization.username;

  if (!username) {
    return res.status(403).json({ message: "User not logged in" });
  }

  if (!books[isbn]) {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
  }

  if (!review) {
    return res.status(400).json({ message: "Review query parameter is required" });
  }

  if (!books[isbn].reviews) {
    books[isbn].reviews = {};
  }

  // Adds a new review under username or modifies existing review by the same user
  books[isbn].reviews[username] = review;

  return res.status(200).json({
    message: `Review for ISBN ${isbn} by ${username} has been added/updated.`,
    reviews: books[isbn].reviews
  });
});

// Delete a book review belonging to the logged-in user
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const username = req.session.authorization && req.session.authorization.username;

  if (!username) {
    return res.status(403).json({ message: "User not logged in" });
  }

  if (!books[isbn]) {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
  }

  if (!books[isbn].reviews || !books[isbn].reviews[username]) {
    return res.status(404).json({ message: `No review found for user ${username} on ISBN ${isbn}` });
  }

  delete books[isbn].reviews[username];

  return res.status(200).json({
    message: `Review by ${username} for ISBN ${isbn} has been deleted.`,
    reviews: books[isbn].reviews
  });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;