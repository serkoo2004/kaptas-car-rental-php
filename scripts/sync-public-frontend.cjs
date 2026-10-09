const {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
} = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const source = path.resolve(projectRoot, "seko-deneme-front-main", "dist");
const publicRoot = path.resolve(projectRoot, "public");
const target = path.resolve(publicRoot, "seko-front");

if (!target.startsWith(`${publicRoot}${path.sep}`)) {
  throw new Error("Public frontend hedefi proje public klasorunun disinda olamaz.");
}

if (!existsSync(source)) {
  throw new Error("Public frontend build klasoru bulunamadi.");
}

mkdirSync(target, { recursive: true });
copyDirectory(source, target);

console.log("Public frontend build dosyalari senkronize edildi.");

function copyDirectory(from, to) {
  for (const entry of readdirSync(from, { withFileTypes: true })) {
    const sourcePath = path.join(from, entry.name);
    const targetPath = path.join(to, entry.name);

    if (entry.isDirectory()) {
      mkdirSync(targetPath, { recursive: true });
      copyDirectory(sourcePath, targetPath);
      continue;
    }

    if (entry.isFile()) {
      copyFileSync(sourcePath, targetPath);
    }
  }
}
