import COS from 'cos-nodejs-sdk-v5'

type CosRuntimeConfig = {
  secretId: string
  secretKey: string
  bucket: string
  region: string
  signExpires: number
}

type SignedUrlCacheItem = {
  url: string
  expiresAt: number
}

function getCosRuntimeConfig(): CosRuntimeConfig | null {
  const secretId = process.env.COS_SECRET_ID
  const secretKey = process.env.COS_SECRET_KEY
  const bucket = process.env.COS_BUCKET
  const region = process.env.COS_REGION
  const signExpires = Number(process.env.COS_SIGN_EXPIRES || 864000)

  if (!secretId || !secretKey || !bucket || !region) {
    return null
  }

  return {
    secretId,
    secretKey,
    bucket,
    region,
    signExpires:
      Number.isFinite(signExpires) && signExpires > 0 ? signExpires : 864000,
  }
}

let cosClient: COS | null = null
const signedUrlCache = new Map<string, SignedUrlCacheItem>()
const MAX_CACHE_ITEMS = 5000

function getCosClient(config: CosRuntimeConfig) {
  if (!cosClient) {
    cosClient = new COS({
      SecretId: config.secretId,
      SecretKey: config.secretKey,
    })
  }
  return cosClient
}

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value)
}

function nowSeconds() {
  return Math.floor(Date.now() / 1000)
}

function getCacheKey(config: CosRuntimeConfig, objectKey: string) {
  return `${config.bucket}|${config.region}|${objectKey}`
}

function getReusableSignedUrl(cacheKey: string) {
  const cached = signedUrlCache.get(cacheKey)
  if (!cached) {
    return null
  }

  if (cached.expiresAt <= nowSeconds()) {
    signedUrlCache.delete(cacheKey)
    return null
  }

  return cached.url
}

function cleanupSignedUrlCache() {
  if (signedUrlCache.size <= MAX_CACHE_ITEMS) {
    return
  }

  const current = nowSeconds()
  for (const [key, item] of signedUrlCache) {
    if (item.expiresAt <= current) {
      signedUrlCache.delete(key)
    }
  }

  if (signedUrlCache.size <= MAX_CACHE_ITEMS) {
    return
  }

  const removeCount = signedUrlCache.size - MAX_CACHE_ITEMS
  let removed = 0
  for (const key of signedUrlCache.keys()) {
    signedUrlCache.delete(key)
    removed += 1
    if (removed >= removeCount) {
      break
    }
  }
}

export function getSignedCosUrl(objectKey: string, fallbackUrl?: string) {
  const config = getCosRuntimeConfig()
  if (!config) {
    return fallbackUrl || objectKey
  }

  if (!objectKey || isHttpUrl(objectKey)) {
    return fallbackUrl || objectKey
  }

  const cacheKey = getCacheKey(config, objectKey)
  const reused = getReusableSignedUrl(cacheKey)
  if (reused) {
    return reused
  }

  const client = getCosClient(config)
  const expiresAt = nowSeconds() + config.signExpires

  cleanupSignedUrlCache()

  const signedUrl = client.getObjectUrl({
    Bucket: config.bucket,
    Region: config.region,
    Key: objectKey,
    Sign: true,
    Expires: config.signExpires,
  })

  signedUrlCache.set(cacheKey, {
    url: signedUrl,
    expiresAt,
  })

  return signedUrl
}
