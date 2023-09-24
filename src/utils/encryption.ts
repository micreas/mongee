import crypto from "crypto";

export const encrypt = (text: string, password: string) => {
  const key = crypto.pbkdf2Sync(
    password,
    Buffer.from(password),
    100,
    32,
    "sha256"
  );
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aria-256-ofb", key, iv);

  let encrypted = cipher.update(text);

  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + encrypted.toString("hex");
};

export const decrypt = (encryptedContent: string, password: string) => {
  const iv = encryptedContent.slice(0, 32);
  const message = encryptedContent.slice(32);

  const key = crypto.pbkdf2Sync(
    password,
    Buffer.from(password),
    100,
    32,
    "sha256"
  );

  const decipher = crypto.createDecipheriv(
    "aria-256-ofb",
    key,
    Buffer.from(iv, "hex")
  );

  let decrypted = decipher.update(Buffer.from(message, "hex"));

  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
};
