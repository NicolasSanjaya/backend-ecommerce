import bcrypt from "bcrypt";

export const comparePassword = (password, hash) => {
  return bcrypt.compareSync(password, hash);
};
