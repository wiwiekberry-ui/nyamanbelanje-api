import {
  S3Client,
  ListObjectsV2Command
} from "@aws-sdk/client-s3";

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || "us-east-1",
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
  }
});

export const handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers,
      body: ""
    };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        error: "Method tidak diizinkan"
      })
    };
  }

  try {
    const prefix = event.queryStringParameters?.prefix || "";

    const data = await s3.send(
      new ListObjectsV2Command({
        Bucket: process.env.S3_BUCKET,
        Prefix: prefix,
        MaxKeys: 200
      })
    );

    const files = (data.Contents || []).map((item) => ({
      key: item.Key,
      size: item.Size,
      lastModified: item.LastModified
    }));

    return {
      statusCode: 200,
      headers: {
        ...headers,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ok: true,
        files,
        prefix,
        count: files.length
      })
    };
  } catch (error) {
    console.error("List error:", error);

    return {
      statusCode: 500,
      headers: {
        ...headers,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        error: "Gagal mengambil daftar file: " + error.message
      })
    };
  }
};
