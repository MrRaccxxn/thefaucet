// Authentication types for the faucet application

export interface GitHubUserProfile {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
  created_at: string;
  followers: number;
  public_repos: number;
  bio?: string;
  location?: string;
  company?: string;
  blog?: string;
  twitter_username?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  image?: string;
  emailVerified?: Date;
}

export interface UserProfile {
  id: string;
  userId: string;
  githubId?: string;
  githubUsername?: string;
  accountAge?: number;
  followersCount?: number;
  repositoryCount?: number;
  isVerified: boolean;
  lastValidationAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  userProfile?: UserProfile;
}

export interface GitHubValidationCriteria {
  minAccountAgeDays: number;
  minFollowersCount: number;
  minRepositoryCount: number;
}
