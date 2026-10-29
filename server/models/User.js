import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' }
}, { timestamps: true });

userSchema.methods.comparePassword = function (password) { return bcrypt.compare(password, this.passwordHash); };
userSchema.methods.toJSON = function () {
  const obj = this.toObject(); delete obj.passwordHash; delete obj.__v; return obj;
};
export default mongoose.model('User', userSchema);
