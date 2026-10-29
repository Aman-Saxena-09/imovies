import mongoose from 'mongoose';
const seatSchema = new mongoose.Schema({
  seatNumber: { 
    type: String, 
    required: true 
  }, 
  row: { 
    type: String, 
    required: true 
  },
  seatType: { 
    type: String, 
    enum: ['STANDARD', 'PREMIUM'], 
    default: 'STANDARD' 
  },
  price: { type: Number, 
    required: true,
     
    min: 0 
  },
  status: { type: String, 
    enum: ['AVAILABLE', 'BOOKED'], 
    default: 'AVAILABLE' 
  },
  bookingId: { 
    type: mongoose.Schema.Types.ObjectId, 
    default: null 
  }
}, { _id: false });

const showtimeSchema = new mongoose.Schema({
  movie: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Movie', 
    required: true, 
    index: true 
  },
  cinema: { 
    type: mongoose.Schema.Types.ObjectId,
     ref: 'Cinema', 
     required: true, 
     index: true 
    },
  screenName: { 
    type: String, 
    required: true, 
    trim: true 
  },
  startTime: { 
    type: Date, 
    required: true, 
    index: true 
  }, 
  endTime: { 
    type: Date, 
    required: true 
  },
  seats: { type: [seatSchema], validate: v => v.length > 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
showtimeSchema.index({ movie: 1, cinema: 1, startTime: 1 });
showtimeSchema.pre('validate', function(next) {
  const nums = this.seats.map(s => s.seatNumber);
  if (new Set(nums).size !== nums.length) this.invalidate('seats', 'Seat numbers must be unique within a showtime.');
  next();
});
export default mongoose.model('Showtime', showtimeSchema);
