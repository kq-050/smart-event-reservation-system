import { apiClient } from './client';
import type {
  User,
  UserCreatePayload,
  UserLoginPayload,
  AuthTokenResponse,
} from '../types';

/**
 * Register a new user (attendee or organizer).
 * Endpoint: POST /auth/register
 */
export async function registerUser(payload: UserCreatePayload): Promise<User> {
  const response = await apiClient.post<User>('/auth/register', payload);
  return response.data;
}

/**
 * Login user and obtain JWT access token.
 * Endpoint: POST /auth/login
 */
export async function loginUser(payload: UserLoginPayload): Promise<AuthTokenResponse> {
  const response = await apiClient.post<AuthTokenResponse>('/auth/login', payload);
  return response.data;
}

/**
 * Fetch current authenticated user's profile.
 * Endpoint: GET /auth/me
 */
export async function getMyProfile(): Promise<User> {
  const response = await apiClient.get<User>('/auth/me');
  return response.data;
}
