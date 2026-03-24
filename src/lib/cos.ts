import COS from 'cos-nodejs-sdk-v5'

type CosRuntimeConfig = {
  secretId: string
  secretKey: string
  bucket: string
  region: string
  signExpires: number
}

function getCosRuntimeConfig(): CosRuntimeConfig | null {
  const secretId = process.env.COS_SECRET_ID
  const secretKey = process.env.COS_SECRET_KEY
  const bucket = process.env.COS_BUCKET
  const region = process.env.COS_REGION
  const signExpires = Number(process.env.COS_SIGN_EXPIRES || 3600)

  if (!secretId || !secretKey || !bucket || !region) {
    return null
  }

  return {
    secretId,
    secretKey,
    bucket,
    region,
    signExpires:
      Number.isFinite(signExpires) && signExpires > 0 ? signExpires : 3600,
  }
}

let cosClient: COS | null = null

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

export function getSignedCosUrl(objectKey: string, fallbackUrl?: string) {
  const config = getCosRuntimeConfig()
  if (!config) {
    return fallbackUrl || objectKey
  }

  if (!objectKey || isHttpUrl(objectKey)) {
    return fallbackUrl || objectKey
  }

  const client = getCosClient(config)

  return client.getObjectUrl({
    Bucket: config.bucket,
    Region: config.region,
    Key: objectKey,
    Sign: true,
    Expires: config.signExpires,
  })
}
