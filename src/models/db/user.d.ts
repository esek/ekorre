export type DatabaseUser = {
  username: string;
  passwordHash: string;
  passwordSalt: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  email: string;
  phone?: string;
  address?: string;
  zipCode?: string;
  website?: string;
  class: string;
  dateJoined?: Date;
  isFuncUser: boolean;
};
