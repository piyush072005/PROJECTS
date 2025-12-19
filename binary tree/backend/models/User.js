/**
 * User Model
 * Stores user authentication data and history
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const historySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['sort', 'search', 'tree', 'graph', 'challenge', 'playground']
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: null
  },
  history: {
    type: [historySchema],
    default: []
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to add history entry
userSchema.methods.addHistoryEntry = function(type, data) {
  const historyEntry = {
    type,
    data,
    timestamp: new Date()
  };
  
  this.history.unshift(historyEntry);
  
  // Keep only last 100 entries
  if (this.history.length > 100) {
    this.history = this.history.slice(0, 100);
  }
  
  return this.save();
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

const User = mongoose.model('User', userSchema);

module.exports = User;

