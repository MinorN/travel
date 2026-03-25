import Link from 'next/link'
import Image from 'next/image'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

import { UploadForm } from '@/components/upload-form'
import { SignOutButton } from '@/components/sign-out-button'
import { authOptions } from '@/lib/auth'
import { getSignedCosUrl } from '@/lib/cos'
import { prisma } from '@/lib/prisma'
import { parseTags } from '@/lib/tags'

const PAGE_SIZE = 30

type AdminPageProps = {
  searchParams: Promise<{
    page?: string
  }>
}

function parsePageParam(value?: string) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return 1
  }

  const integer = Math.floor(parsed)
  return integer > 0 ? integer : 1
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const mediaFrameHeights = ['h-48', 'h-60', 'h-68', 'h-52', 'h-72']
  const query = await searchParams
  const currentPage = parsePageParam(query.page)

  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/admin')
  }

  const totalCount = await prisma.media.count({
    where: { uploaderId: session.user.id },
  })
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)

  const myMedia = await prisma.media.findMany({
    where: { uploaderId: session.user.id },
    orderBy: { createdAt: 'desc' },
    skip: (safePage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  })

  const prevPageHref = safePage > 2 ? `/admin?page=${safePage - 1}` : '/admin'
  const nextPageHref = `/admin?page=${safePage + 1}`

  const displayMediaList = myMedia.map((item) => ({
    ...item,
    accessUrl: getSignedCosUrl(item.publicId, item.url),
    tags: parseTags(item.tags),
  }))

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="glass-panel rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-[#2b8f83]">
              管理台
            </p>
            <div className="mt-2">
              <Link
                href="/timeline"
                className="rounded-full border border-[#2b8f83] px-3 py-1 text-xs font-semibold text-[#2b8f83] transition hover:bg-[#2b8f83] hover:text-white"
              >
                查看时间线
              </Link>
            </div>
            <h1 className="mt-2 text-3xl font-semibold text-[#1d3a43]">
              欢迎回来，{session.user.name || '旅行者'}
            </h1>
          </div>
          <div className="flex gap-3">
            <Link
              href="/"
              className="rounded-full border border-[#2b8f83] px-4 py-2 text-sm font-semibold text-[#2b8f83] hover:bg-[#2b8f83] hover:text-white"
            >
              返回首页
            </Link>
            <SignOutButton className="rounded-full bg-[#2b8f83] px-4 py-2 text-sm font-semibold text-white hover:bg-[#23766d]">
              退出
            </SignOutButton>
          </div>
        </div>

        <UploadForm />
      </section>

      <section className="glass-panel mt-7 rounded-3xl p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-[#1d3a43]">我上传的内容</h2>
        {myMedia.length === 0 ? (
          <p className="mt-2 text-sm text-[#4d7078]">
            你还没有上传内容，先发布一个吧。
          </p>
        ) : (
          <>
            <div className="mt-4 columns-1 gap-5 sm:columns-2 lg:columns-3">
              {displayMediaList.map((item, index) => {
                const mediaFrameClass =
                  mediaFrameHeights[index % mediaFrameHeights.length]

                return (
                  <Link
                    key={item.id}
                    href={`/media/${item.id}`}
                    className="group mb-5 block break-inside-avoid"
                  >
                    <article className="glass-panel overflow-hidden rounded-2xl transition-transform duration-300 ease-out group-hover:scale-[1.02]">
                      {item.type === 'IMAGE' ? (
                        <div className={`relative w-full ${mediaFrameClass}`}>
                          <Image
                            src={item.accessUrl}
                            alt={item.title}
                            fill
                            unoptimized
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <video
                          className={`w-full ${mediaFrameClass} object-cover`}
                          preload="metadata"
                          src={item.accessUrl}
                        />
                      )}
                      <div className="p-4">
                        <h3 className="line-clamp-2-custom text-lg font-semibold text-[#1d3a43]">
                          {item.title}
                        </h3>
                        {item.location ? (
                          <p className="line-clamp-2-custom mt-1 text-sm text-[#4d7078]">
                            {item.location}
                          </p>
                        ) : null}
                        {item.tags.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {item.tags.map((tag) => (
                              <span
                                key={`${item.id}-${tag}`}
                                className="rounded-full border border-[#b6d9d4] bg-white/80 px-2 py-0.5 text-[11px] text-[#355861]"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </article>
                  </Link>
                )
              })}
            </div>

            {totalPages > 1 ? (
              <nav className="mt-3 flex items-center justify-center gap-3 text-sm">
                <Link
                  href={prevPageHref}
                  aria-disabled={safePage <= 1}
                  className="rounded-full border border-[#2b8f83] px-4 py-2 font-semibold text-[#2b8f83] transition hover:bg-[#2b8f83] hover:text-white aria-disabled:pointer-events-none aria-disabled:opacity-45"
                >
                  上一页
                </Link>
                <span className="text-[#4d7078]">
                  第 {safePage} / {totalPages} 页
                </span>
                <Link
                  href={nextPageHref}
                  aria-disabled={safePage >= totalPages}
                  className="rounded-full border border-[#2b8f83] px-4 py-2 font-semibold text-[#2b8f83] transition hover:bg-[#2b8f83] hover:text-white aria-disabled:pointer-events-none aria-disabled:opacity-45"
                >
                  下一页
                </Link>
              </nav>
            ) : null}
          </>
        )}
      </section>
    </main>
  )
}
