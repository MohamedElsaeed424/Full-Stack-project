const express = require("express");
const { body } = require("express-validator/check");
const User = require("../models/user");

const isAuth = require("../middleware/is-auth");
const authController = require("../controllers/auth");
const router = express.Router();

router.put(
  "/signup",
  [
    body("email")
      .isEmail()
      .withMessage("Please Enter a Valid Email")
      .normalizeEmail()
      //-------------------------If The User Already exist--------------------------------------------
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject(
              "Email address ALready Exist ,Please Enter another One."
            );
          }
        });
      }),
    //------------------------------------------------------------------
    body("password").isLength({ min: 5 }).isAlphanumeric().trim(),
    body("name").trim().not().isEmpty(),
  ],
  authController.signup
);

router.post("/login", authController.login);

router.get("/status", isAuth, authController.getUserStatus);

router.patch(
  "/status",
  isAuth,
  [body("status").trim().not().isEmpty()],
  authController.updateStatus
);

module.exports = router;
