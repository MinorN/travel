import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'

import { getSignedCosUrl } from '@/lib/cos'
import { prisma } from '@/lib/prisma'
import { parseTags } from '@/lib/tags'

type MediaDetailPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function MediaDetailPage({
  params,
}: MediaDetailPageProps) {
  const { id } = await params

  const media = await prisma.media.findUnique({
    where: { id },
    include: {
      uploader: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })

  if (!media) {
    notFound()
  }

  const accessUrl = getSignedCosUrl(media.publicId, media.url)
  const tags = parseTags(media.tags)

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-4">
        <Link
          href="/"
          className="text-sm font-medium text-[#2b8f83] transition hover:text-[#23766d]"
        >
          返回首页
        </Link>
      </div>

      <article className="glass-panel overflow-hidden rounded-3xl">
        {media.type === 'IMAGE' ? (
          <div className="relative aspect-4/3 w-full">
            <Image
              src={accessUrl}
              alt={media.title}
              fill
              unoptimized
              sizes="(max-width: 1024px) 100vw, 960px"
              className="object-cover"
            />
          </div>
        ) : (
          <video
            className="aspect-4/3 w-full bg-black object-contain"
            controls
            preload="metadata"
            src={accessUrl}
          />
        )}

        <div className="space-y-3 p-6 sm:p-8">
          <h1 className="text-3xl font-semibold text-[#1d3a43]">
            {media.title}
          </h1>

          {media.location ? (
            <p className="text-sm text-[#4d7078]">拍摄地点：{media.location}</p>
          ) : null}

          {media.description ? (
            <p className="whitespace-pre-wrap text-sm leading-7 text-[#355861]">
              {media.description}
            </p>
          ) : null}

          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[#b6d9d4] bg-white/80 px-2.5 py-1 text-xs text-[#355861]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}

          <p className="text-xs text-[#5f7f86]">
            由 {media.uploader.name || media.uploader.email} 发布 ·{' '}
            {new Date(media.createdAt).toLocaleString('zh-CN')}
          </p>
        </div>
      </article>
    </main>
  )
}
