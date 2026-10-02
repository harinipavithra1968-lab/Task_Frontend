const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Enter a valid email'],
    },

    // Required for normal email/password accounts,
    // but not required for Google accounts.
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters'],
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    profileImage: {
      type: String,
      default: '',
    },

    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
  },
  { timestamps: true }
);

// Hash password only when a password exists and is changed
userSchema.pre('save', async function () {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

userSchema.methods.matchPassword = function (plain) {
  if (!this.password) return false;
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', userSchema);