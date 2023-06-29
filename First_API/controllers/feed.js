const fs = require("fs");
const path = require("path");

const { validationResult } = require("express-validator/check");

const Post = require("../models/post");
const User = require("../models/user");

exports.getPosts = (req, res, next) => {
  //-------------------------------------Bagination---------------------------------------
  const currentPage = req.query.page || 1;
  const postPerPage = 2;
  let totalItems;
  Post.find()
    .countDocuments()
    .then((numPosts) => {
      totalItems = numPosts;
      return Post.find()
        .skip((currentPage - 1) * postPerPage)
        .limit(postPerPage);
    })
    //-------------------------------------------------------------------------------------
    .then((posts) => {
      res.status(200).json({
        message: "Fetched All Posts Successfully",
        posts: posts,
        totalItems: totalItems,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.createPost = (req, res, next) => {
  const title = req.body.title;
  const content = req.body.content;
  const imageURL = req.file.path.replace("\\", "/");
  let creator;
  //---------------------------------Validations-----------------
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Please Enter Valid Title or Content");
    error.statusCode = 422;
    throw error;
  }
  //----------------------------------Check for Image Exist-------
  if (!imageURL) {
    const error = new Error("No image Provided");
    error.statusCode = 422;
    throw error;
  }
  //-------------------------------------------------------------
  const post = new Post({
    title: title,
    content: content,
    creator: req.userId,
    imageURL: imageURL,
  });
  post
    .save()
    //-----------------------Pushing the post to posts of this user--------------------------------
    .then((post) => {
      return User.findById(req.userId);
    })
    .then((user) => {
      creator = user;
      user.posts.push(post);
      return user.save();
    })
    //----------------------------------------------------------------------------------
    .then((user) => {
      res.status(201).json({
        message: "Post Created Successfully",
        post: post,
        creator: { _id: creator._id, name: creator.name },
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getPost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error("Sorry,This Post Not Found");
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({ post: post });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.updatePost = (req, res, next) => {
  const postId = req.params.postId;
  //-------------------------------Validations----------------------------------
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Please Check for Updated Title or Content");
    error.statusCode = 424;
    throw error;
  }
  //----------------------------------------------------------------------------
  const title = req.body.title;
  const content = req.body.content;
  let imageURL = req.body.image;
  //----------------------------Image Validations------------------------------
  if (req.file) {
    imageURL = req.file.path.replace("\\", "/");
  }
  if (!imageURL) {
    const error = new Error("Missing an Image Here!");
    error.statusCode = 422;
    throw error;
  }
  //----------------------------------------------------------------------------

  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error("Sorry, No Post to be Updated");
        error.statusCode = 404;
        throw error;
      }
      //------------------------------------Check if this is the user logged in or not from Token id in middleware file----------
      if (post.creator.toString() !== req.userId) {
        const error = new Error("You Are not allowed to Edit this Post");
        error.statusCode = 403;
        throw error;
      }
      //----------------If Uploaded a new Image not Like the old one so clear the old one using the heloper function i created-----------------------------------------------------------------
      if (imageURL !== post.imageURL) {
        clearImage(post.imageURL);
      }
      //--------------------------------------------------------------------------------------------------------------------
      post.title = title;
      post.content = content;
      post.imageURL = imageURL;
      return post.save();
    })
    .then((updatedPost) => {
      res
        .status(200)
        .json({ message: "Post Updated Successfully", post: updatedPost });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error("Sorry, No Post to be Deleted");
        error.statusCode = 404;
        throw error;
      }
      //------------------------------------Check if this is the user logged in or not from Token id in middleware file----------
      if (post.creator.toString() !== req.userId) {
        const error = new Error("You Are not allowed to Edit this Post");
        error.statusCode = 403;
        throw error;
      }
      clearImage(post.imageURL);
      return Post.findByIdAndRemove(postId);
    })
    .then((post) => {
      User.findById(req.userId).then((user) => {
        user.posts.pull(postId);
        return user.save();
      });
    })
    .then((result) => {
      res.status(200).json({ message: "Post Deleted Successfully" });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => console.log(err));
};

