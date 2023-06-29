const expect = require("chai").expect;
const sinon = require("sinon");
const mongoose = require("mongoose");

const User = require("../models/user");
const AuthController = require("../controllers/auth");

describe("AuthController", function () {
  //--------------------------(HOOK)To execute once before all tests starts-------------------------
  before(function (done) {
    mongoose
      .connect(
        "mongodb+srv://Mohamed:205505@cluster0.um4hvor.mongodb.net/test-API-APP?retryWrites=true"
      )
      .then((result) => {
        const user = new User({
          email: "test@gmail.com",
          password: "205505",
          name: "Test",
          posts: [],
          _id: "5c0f66b979af55031b34728a",
        });
        return user.save();
      })
      .then(() => {
        done();
      });
  });
  it("Should Throw error with code 500 if accessing data base failed", function (done) {
    sinon.stub(User, "findOne");
    User.findOne.throws();

    const req = {
      body: {
        email: "mohamd.smenshawy@gmail.com",
        password: "205505",
      },
    };

    AuthController.login(req, {}, () => {}).then((result) => {
      expect(result).to.be.an("error");
      expect(result).to.have.property("statusCode", 500);
      done();
    });
    User.findOne.restore();
  });

  it("Should send response with valid user status for existing user", function (done) {
    const req = { userId: "5c0f66b979af55031b34728a" };
    const res = {
      statusCode: 500,
      userStatus: null,
      status: function (code) {
        this.statusCode = code;
        return this;
      },
      json: function (data) {
        this.userStatus = data.status;
      },
    };
    AuthController.getUserStatus(req, res, () => {}).then((result) => {
      expect(res.statusCode).to.be.equal(200);
      expect(res.userStatus).to.be.equal("I am new !");
      done();
    });
  });
  //------------------------------To execute once after all tests done --------------------------
  after(function (done) {
    User.deleteMany({})
      .then(() => {
        return mongoose.disconnect();
      })
      .then(() => {
        done();
      });
  });
});
