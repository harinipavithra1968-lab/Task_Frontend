const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, "Username must be at least 3 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Enter a valid email"],
    },

    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    profileImage: {
      type: String,
      default: "",
    },

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
  },
  {
    timestamps: true,
  }
);


// Create username automatically before validation
userSchema.pre("validate", async function () {
  if (!this.username && this.email) {
    let username = this.email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    if (username.length < 3) {
      username = "user";
    }

    let finalUsername = username;

    const existingUser = await mongoose.models.User.findOne({
      username: finalUsername,
      _id: { $ne: this._id },
    });

    if (existingUser) {
      finalUsername = `${username}${Date.now()
        .toString()
        .slice(-6)}`;
    }

    this.username = finalUsername;
  }
});


// Hash password only when password exists and changes
userSchema.pre("save", async function () {
  if (this.isModified("password") && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});


// Compare password
userSchema.methods.matchPassword = function (plain) {
  if (!this.password) return false;

  return bcrypt.compare(plain, this.password);
};


module.exports = mongoose.model("User", userSchema);