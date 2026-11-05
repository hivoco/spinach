import crypto from "crypto";

/**
 * The MySQL tables keep the original Mongo `_id` values as CHAR(24) primary
 * keys, so ids created from here have to look the same: 4-byte timestamp,
 * 5-byte random, 3-byte counter — 24 hex characters.
 */
const processRandom = crypto.randomBytes(5);
let counter = crypto.randomBytes(3).readUIntBE(0, 3);

export const newObjectId = () => {
  const buf = Buffer.alloc(12);
  buf.writeUInt32BE(Math.floor(Date.now() / 1000), 0);
  processRandom.copy(buf, 4);
  counter = (counter + 1) % 0xffffff;
  buf.writeUIntBE(counter, 9, 3);
  return buf.toString("hex");
};

export const isObjectId = (value) =>
  typeof value === "string" && /^[0-9a-fA-F]{24}$/.test(value);

export default newObjectId;
