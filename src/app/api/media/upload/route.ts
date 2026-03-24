import { randomUUID } from 'crypto'
import COS from 'cos-nodejs-sdk-v5'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { normalizeTags, serializeTags } from '@/lib/tags'

const metadataSchema = z.object({
  title: z.string().trim().min(1, '标题不能为空').max(120, '标题过长'),
  location: z.string().trim().max(120, '地点过长').optional(),
  description: z.string().trim().max(600, '描述过长').optional(),
  tags: z.array(z.string().trim()).max(10, '标签最多 10 个').optional(),
})

function getCosConfig() {
  const secretId = process.env.COS_SECRET_ID
  const secretKey = process.env.COS_SECRET_KEY
  const bucket = process.env.COS_BUCKET
  const region = process.env.COS_REGION
  const customDomain = process.env.COS_DOMAIN

  if (!secretId || !secretKey || !bucket || !region) {
    throw new Error('Missing COS env')
  }

  const client = new COS({
    SecretId: secretId,
    SecretKey: secretKey,
  })

  return {
    client,
    bucket,
    region,
    customDomain,
  }
}

function buildCosKey(fileName: string, resourceType: 'image' | 'video') {
  const ext = fileName.includes('.')
    ? fileName.split('.').pop()?.toLowerCase()
    : undefined
  const suffix = ext ? `.${ext}` : ''

  return `travel-gallery/${resourceType}/${Date.now()}-${randomUUID()}${suffix}`
}

function uploadToCos(params: {
  client: COS
  bucket: string
  region: string
  key: string
  fileBuffer: Buffer
  contentType: string
  customDomain?: string
}) {
  return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
    params.client.putObject(
      {
        Bucket: params.bucket,
        Region: params.region,
        Key: params.key,
        Body: params.fileBuffer,
        ContentType: params.contentType,
        CacheControl: 'public,max-age=31536000,immutable',
      },
      (error, data) => {
        if (error || !data) {
          reject(error ?? new Error('Upload failed'))
          return
        }

        const normalizedDomain = params.customDomain
          ?.replace(/^https?:\/\//, '')
          .replace(/\/$/, '')
        const fallbackLocation = data.Location?.startsWith('http')
          ? data.Location
          : `https://${data.Location}`
        const url = normalizedDomain
          ? `https://${normalizedDomain}/${params.key}`
          : fallbackLocation

        resolve({
          url,
          publicId: params.key,
        })
      },
    )
  })
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 })
    }

    const cosConfig = getCosConfig()

    const formData = await request.formData()
    const file = formData.get('file')
    const title = formData.get('title')
    const location = formData.get('location')
    const description = formData.get('description')
    const rawTags = formData
      .getAll('tags')
      .map((tag) => tag.toString())
      .filter(Boolean)

    if (!(file instanceof File)) {
      return NextResponse.json({ error: '请上传文件' }, { status: 400 })
    }

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      return NextResponse.json({ error: '仅支持图片或视频' }, { status: 400 })
    }

    const parsed = metadataSchema.safeParse({
      title: title?.toString() ?? '',
      location: location?.toString() || undefined,
      description: description?.toString() || undefined,
      tags: rawTags,
    })

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || '参数不合法' },
        { status: 400 },
      )
    }

    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json(
        { error: '文件大小不能超过 100MB' },
        { status: 400 },
      )
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const resourceType = file.type.startsWith('video/') ? 'video' : 'image'
    const normalizedTags = normalizeTags(parsed.data.tags || [])
    const key = buildCosKey(file.name, resourceType)
    const uploadResult = await uploadToCos({
      client: cosConfig.client,
      bucket: cosConfig.bucket,
      region: cosConfig.region,
      key,
      fileBuffer,
      contentType: file.type,
      customDomain: cosConfig.customDomain,
    })

    const media = await prisma.media.create({
      data: {
        title: parsed.data.title,
        location: parsed.data.location,
        description: parsed.data.description,
        tags: serializeTags(normalizedTags),
        url: uploadResult.url,
        thumbnailUrl: uploadResult.url,
        publicId: uploadResult.publicId,
        type: resourceType === 'video' ? 'VIDEO' : 'IMAGE',
        uploaderId: session.user.id,
      },
    })

    return NextResponse.json({ id: media.id, url: media.url })
  } catch {
    return NextResponse.json(
      { error: '上传失败，请检查腾讯云 COS 配置' },
      { status: 500 },
    )
  }
}
