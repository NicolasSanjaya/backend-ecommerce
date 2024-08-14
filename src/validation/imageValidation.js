import { unlink, access } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import { fileTypeFromBuffer } from "file-type";
import { verifyToken } from "../utils/jwt.js";

const checkFile = async (path) => {
  try {
    const isExist = await readFile(path);
    console.log(isExist);
    if (isExist) await unlink(path);
    return true;
  } catch (error) {
    return false;
  }
};

export const imageValidation = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1] || req.cookies.jwt;
  const file = await readFile(req.file.path);
  const type = await fileTypeFromBuffer(file);
  const user = verifyToken(token);

  const isExist = await checkFile(user.image);

  if (
    type.mime !== "image/jpg" &&
    type.mime !== "image/jpeg" &&
    type.mime !== "image/png"
  ) {
    next();
  }
  next();
};
