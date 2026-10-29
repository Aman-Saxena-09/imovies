import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('IMovies API health', () => {
  it('returns a JSON health response without requiring database access', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.service).toBe('imovies-api');
  });
  it('returns a structured 404 for an unknown endpoint', async () => {
    const response = await request(app).get('/api/not-a-real-route');
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
