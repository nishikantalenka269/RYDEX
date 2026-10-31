import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("cloud:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("key length:", process.env.CLOUDINARY_API_KEY?.length);
console.log("secret length:", process.env.CLOUDINARY_API_SECRET?.length);

try {
  const ping = await cloudinary.api.ping();
  console.log("PING OK:", ping);

  // 1x1 test image upload
  const res = await cloudinary.uploader.upload(
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    { resource_type: "auto" }
  );
  console.log("UPLOAD OK:", res.secure_url);
} catch (e) {
  console.log("FAILED:", e?.error?.message ?? e?.message ?? e);
  console.log("http_code:", e?.error?.http_code ?? e?.http_code);
}