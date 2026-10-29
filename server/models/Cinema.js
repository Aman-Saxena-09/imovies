import mongoose from 'mongoose';
const cinemaSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true }, city: { type: String, required: true, trim: true, index: true },
  facilities: [{ type: String, trim: true }], screens: [{ type: String, trim: true }], isActive: { type: Boolean, default: true }
}, { timestamps: true });
export default mongoose.model('Cinema', cinemaSchema);
