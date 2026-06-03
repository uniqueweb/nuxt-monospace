import { createHash } from 'node:crypto'
import {
  readdir, readFile, stat,
} from 'node:fs/promises'
import {
  join, relative,
} from 'node:path'
import {
  S3Client, PutObjectCommand, HeadObjectCommand,
} from '@aws-sdk/client-s3'

export interface S3Config {
  bucket: string
  dir: string
  prefix: string
  region: string
  endpoint: string
  accessKey: string
  secretKey: string
  forcePathStyle?: boolean
}

interface UploadTask {
  bucket: string
  key: string
  filePath: string
  cacheControl: string
}

export async function uploadAssets(config: S3Config): Promise<void> {
  const { bucket, dir, prefix, region, endpoint, accessKey, secretKey, forcePathStyle = false } = config

  try {
    await stat(dir)
  }
  catch {
    throw new Error(`Output directory not found: ${dir}`)
  }

  const client = new S3Client({
    endpoint,
    region,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
    forcePathStyle,
  })

  const allFiles = await collectFiles(dir)
  const tasks = buildTasks(dir, allFiles, bucket, prefix)

  const concurrency = 16
  for (let i = 0; i < tasks.length; i += concurrency) {
    await Promise.all(
      tasks.slice(i, i + concurrency).map(task => uploadFile(client, task)),
    )
  }
}

function buildTasks(dir: string, files: string[], bucket: string, prefix: string): UploadTask[] {
  const tasks: UploadTask[] = []

  for (const filePath of files) {
    const rel = relative(dir, filePath)

    if (rel.startsWith('builds/meta/')) {
      tasks.push({
        bucket,
        key: `${prefix}/${rel}`,
        filePath,
        cacheControl: 'public, max-age=31536000, immutable',
      })
    }
    else if (rel === 'builds/latest.json') {
      tasks.push({
        bucket,
        key: `${prefix}/${rel}`,
        filePath,
        cacheControl: 'no-store',
      })
    }
    else if (!rel.startsWith('builds/')) {
      tasks.push({
        bucket,
        key: `${prefix}/${rel}`,
        filePath,
        cacheControl: 'public, max-age=31536000, immutable',
      })
    }
  }

  return tasks
}

async function collectFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...await collectFiles(full))
    }
    else {
      files.push(full)
    }
  }

  return files
}

async function uploadFile(client: S3Client, task: UploadTask): Promise<void> {
  const { bucket, key, filePath, cacheControl } = task
  const body = await readFile(filePath)

  // Skip upload if remote ETag matches local MD5 (equivalent to rclone --checksum)
  try {
    const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
    const remoteEtag = head.ETag?.replace(/"/g, '')
    const localMd5 = createHash('md5').update(body).digest('hex')
    if (remoteEtag === localMd5) return
  }
  catch { /* object not found or no ETag — upload anyway */ }

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: guessContentType(filePath),
    CacheControl: cacheControl,
    ACL: 'public-read',
  }))
}

function guessContentType(filePath: string): string {
  if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) return 'application/javascript'
  if (filePath.endsWith('.css')) return 'text/css'
  if (filePath.endsWith('.json')) return 'application/json'
  if (filePath.endsWith('.svg')) return 'image/svg+xml'
  if (filePath.endsWith('.png')) return 'image/png'
  if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) return 'image/jpeg'
  if (filePath.endsWith('.webp')) return 'image/webp'
  if (filePath.endsWith('.woff2')) return 'font/woff2'
  if (filePath.endsWith('.woff')) return 'font/woff'
  if (filePath.endsWith('.ico')) return 'image/x-icon'
  return 'application/octet-stream'
}
