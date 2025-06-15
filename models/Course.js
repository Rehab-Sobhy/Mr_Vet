const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  image: { type: String },
  price: { type: Number, default: 0 },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  rating: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  category: { type: String },
  courseImage: { type: String },
  videos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }]
});

module.exports = mongoose.model('Course', courseSchema);
