import {
  DeleteObjectCommand,
  ListObjectsCommand,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from "@aws-sdk/client-s3";
import CONFIG from "../config";

export const client = new S3Client({
  region: CONFIG.S3_REGION,
  credentials: {
    accessKeyId: CONFIG.S3_ACCESS_KEY_ID,
    secretAccessKey: CONFIG.S3_SECRET_ACCESS_KEY,
  },
  endpoint: `https://${CONFIG.S3_AWS_ENDPOINT}`,
});

export const storeFileInS3 = async (
  file: PutObjectCommandInput["Body"],
  key: string
) => {
  try {
    const fileStorageKey = `chicandholland/${key}`;

    const response = await client.send(
      new PutObjectCommand({
        Bucket: CONFIG.S3_BUCKET,
        Key: fileStorageKey,
        Body: file,
        ACL: "public-read",
      })
    );

    return { ...response, fileName: fileStorageKey };
  } catch (e) {
    return null;
  }
};

// get all the files in a folder
export const listFilesInFolder = async (folder: string) => {
  const response = await client.send(
    new ListObjectsCommand({
      Bucket: CONFIG.S3_BUCKET,
      Prefix: folder,
    })
  );

  return response.Contents;
};

// delete a file from s3
export const deleteFileFromS3 = async (key: string) => {
  try {
    const response = await client.send(
      new DeleteObjectCommand({
        Bucket: CONFIG.S3_BUCKET,
        Key: key,
      })
    );

    return response;
  } catch (e) {
    return null;
  }
};

export const getFullUrl = (key: string) => {
  return `https://${CONFIG.S3_BUCKET}.${CONFIG.S3_AWS_ENDPOINT}/${key}`;
};
