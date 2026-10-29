import mongoose from 'mongoose';
const bookingSchema = new mongoose.Schema({
  bookingReference: { type: String, required: true, unique: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  showtime: { type: mongoose.Schema.Types.ObjectId, ref: 'Showtime', required: true, index: true },
  movieTitle: { type: String, required: true }, cinemaName: { type: String, required: true },
  screenName: { type: String, required: true }, startTime: { type: Date, required: true },
  seatNumbers: [{ type: String, required: true }], totalAmount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['CONFIRMED', 'CANCELLED'], default: 'CONFIRMED', index: true },
  payment: { mode: { type: String, enum: ['DEMO'], default: 'DEMO' }, status: { type: String, enum: ['SIMULATED_SUCCESS', 'REFUNDED_DEMO'], default: 'SIMULATED_SUCCESS' } },
  cancelledAt: { type: Date, default: null }
}, { timestamps: true });
bookingSchema.index({ user: 1, createdAt: -1 });
export default mongoose.model('Booking', bookingSchema);
