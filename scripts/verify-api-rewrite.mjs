import assert from "node:assert/strict"
import config from "../next.config.ts"

const previous = process.env.API_INTERNAL_URL
try {
  for (const value of [
    "https://api.example.test",
    "https://api.example.test/",
    " https://api.example.test/// ",
  ]) {
    process.env.API_INTERNAL_URL = value
    assert.equal(
      (await config.rewrites())[0].destination,
      "https://api.example.test/api/v1/:path*"
    )
  }
  for (const value of [
    "https://api.example.test/path",
    "https://user:pass@api.example.test",
    "ftp://api.example.test",
    "https://api.example.test?secret=x",
  ]) {
    process.env.API_INTERNAL_URL = value
    await assert.rejects(() => config.rewrites(), /API_INTERNAL_URL/)
  }
  delete process.env.API_INTERNAL_URL
  assert.equal(
    (await config.rewrites())[0].destination,
    "http://127.0.0.1:3001/api/v1/:path*"
  )
  console.log(
    "PASS: API proxy normalizes trailing slashes and rejects invalid origins."
  )
} finally {
  if (previous === undefined) delete process.env.API_INTERNAL_URL
  else process.env.API_INTERNAL_URL = previous
}
