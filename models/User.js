const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: [true, 'Username is required'], unique: true, trim: true, lowercase: true, minlength: [3, 'Username must be at least 3 characters'] },
    email: { type: String, required: [true, 'Email is required'], unique: true, trim: true, lowercase: true, match: [/^\S+@\S+\.\S+$/, 'Enter a valid email'] },
    password: { type: String, required: [true, 'Password is required'], minlength: [6, 'Password must be at least 6 characters'] },
  },
  { timestamps: true }
);

// Hash the password before saving (only when it changed)
userSchema.pre('save', async function () {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', userSchema);
