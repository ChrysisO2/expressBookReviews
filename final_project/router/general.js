const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

const BASE_URL = "http://localhost:5000";

// Register a new user
public_users.post("/register", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(400).json({ message: "Unable to register user. Username and password are required." });
  }

  const userExists = users.some((user) => user.username === username);
  if (userExists) {
    return res.status(409).json({ message: "User already exists!" });
  }

  users.push({ username, password });
  return res.status(200).json({ message: "User successfully registered. Now you can login" });
});

// Task 10: Get the book list available in the shop using async-await with Axios
public_users.get('/', async function (req, res) {
  try {
    const response = await axios.get(`${BASE_URL}/books-data`);
    return res.status(200).send(JSON.stringify(response.data, null, 4));
  } catch (err) {
    return res.status(200).send(JSON.stringify(books, null, 4));
  }
});

// Helper data endpoint so Axios calls over HTTP without looping back into '/'
public_users.get('/books-data', function (req, res) {
  return res.status(200).json(books);
});

// Task 11: Get book details based on ISBN using async-await with Axios
public_users.get('/isbn/:isbn', async function (req, res) {
  const isbn = req.params.isbn;
  try {
    const response = await axios.get(`${BASE_URL}/books-data`);
    const book = response.data[isbn];

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    return res.status(200).json(book);
  } catch (err) {
    return res.status(500).json({ message: "Error retrieving book by ISBN", error: err.message });
  }
});

// Task 12: Get book details based on author using async-await with Axios
public_users.get('/author/:author', async function (req, res) {
  const author = req.params.author;
  try {
    const response = await axios.get(`${BASE_URL}/books-data`);
    const allBooks = response.data;
    const matchingBooks = [];

    Object.keys(allBooks).forEach((key) => {
      if (allBooks[key].author === author) {
        matchingBooks.push({ isbn: key, ...allBooks[key] });
      }
    });

    if (matchingBooks.length === 0) {
      return res.status(404).json({ message: "No books found for this author" });
    }

    return res.status(200).json({ booksbyauthor: matchingBooks });
  } catch (err) {
    return res.status(500).json({ message: "Error retrieving books by author", error: err.message });
  }
});

// Task 13: Get all books based on title using async-await with Axios
public_users.get('/title/:title', async function (req, res) {
  const title = req.params.title;
  try {
    const response = await axios.get(`${BASE_URL}/books-data`);
    const allBooks = response.data;
    const matchingBooks = [];

    Object.keys(allBooks).forEach((key) => {
      if (allBooks[key].title === title) {
        matchingBooks.push({ isbn: key, ...allBooks[key] });
      }
    });

    if (matchingBooks.length === 0) {
      return res.status(404).json({ message: "No books found with this title" });
    }

    return res.status(200).json({ booksbytitle: matchingBooks });
  } catch (err) {
    return res.status(500).json({ message: "Error retrieving books by title", error: err.message });
  }
});

// Get book review
public_users.get('/review/:isbn', function (req, res) {
  const isbn = req.params.isbn;
  const book = books[isbn];

  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  return res.status(200).json(book.reviews);
});

module.exports.general = public_users;