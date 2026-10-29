import mongoose from 'mongoose';
const movieSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true, 
    trim: true, 
    maxlength: 140 
  },
  description: { 
    type: String, 
    required: true, 
    maxlength: 3000 
  },
  posterUrl: { 
    type: String, 
    default: '' 
  }, 
  backdropUrl: { 
    type: String, 
    default: '' 
  },
  genre: [{ 
    type: String, 
    trim: true 
  }], 
  language: [{ 
    type: String, 
    trim: true 
  }],
  durationMinutes: { 
    type: Number, 
    required: true,
    min: 1, 
    max: 500 
    },
  releaseDate: { 
    type: Date, 
    default: Date.now 
  }, 
  rating: { 
    type: Number, 
    min: 0, 
    max: 10, 
    default: 7 
  },
  cast: [{ 
    type: String, 
    trim: true 
  }], 
  certification: { 
    type: String, 
    default: 'UA' 
  },
  status: { 
    type: String, 
    enum: ['NOW_SHOWING', 'COMING_SOON'], 
    default: 'NOW_SHOWING', 
    index: true 
  },
  tmdbId: {
  type: Number,
  index: true,
  sparse: true
  }

}, { timestamps: true });

movieSchema.index(
  { title: 'text', description: 'text', genre: 'text' },
  { language_override: 'textLanguage' }
);
export default mongoose.model('Movie', movieSchema);
