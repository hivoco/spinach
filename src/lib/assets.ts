// Images and the intro video are served from the public/ folder of the S3 bucket (a copy of this project's public/).
// Set NEXT_PUBLIC_ASSET_BASE to override, e.g. to an empty string to serve them from this app while working on them.
const ASSET_BASE = process.env.NEXT_PUBLIC_ASSET_BASE ?? "https://careerarchetypes.s3.ap-south-1.amazonaws.com/public";

/** The full URL of a file in public/, e.g. asset("/images/brand/spinach-logo.webp"). */
export const asset = (path: string) => `${ASSET_BASE}${path}`;
