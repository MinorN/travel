import Link from 'next/link'
import Image from 'next/image'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { getSignedCosUrl } from '@/lib/cos'
import { prisma } from '@/lib/prisma'
import { SignOutButton } from '@/components/sign-out-button'
import { parseTags } from '@/lib/tags'

const PAGE_SIZE = 24

type HomePageProps = {
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

export default async function Home({ searchParams }: HomePageProps) {
  const mediaFrameHeights = ['h-52', 'h-64', 'h-72', 'h-56', 'h-80']
  const query = await searchParams
  const currentPage = parsePageParam(query.page)

  const session = await getServerSession(authOptions)
  const totalCount = await prisma.media.count()
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)

  const mediaList = await prisma.media.findMany({
    orderBy: { createdAt: 'desc' },
    include: { uploader: { select: { name: true, email: true } } },
    skip: (safePage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  })

  const prevPageHref = safePage > 2 ? `/?page=${safePage - 1}` : '/'
  const nextPageHref = `/?page=${safePage + 1}`

  const displayMediaList = mediaList.map((item) => ({
    ...item,
    accessUrl: getSignedCosUrl(item.publicId, item.url),
    tags: parseTags(item.tags),
  }))

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="glass-panel relative rounded-3xl p-6 sm:p-8">
        {!session ? (
          <Link
            href="/login"
            className="absolute right-5 top-5 text-xs font-medium tracking-wide text-[#2b8f83]/75 transition hover:text-[#2b8f83] sm:right-7 sm:top-6"
          >
            管理入口
          </Link>
        ) : null}

        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-[#2b8f83]">
              Travel Gallery
            </p>
            <div className="mt-3">
              <Link
                href="/timeline"
                className="rounded-full border border-[#2b8f83] px-3 py-1 text-xs font-semibold text-[#2b8f83] transition hover:bg-[#2b8f83] hover:text-white"
              >
                时间线
              </Link>
            </div>
            <h1 className="mt-2 text-4xl font-semibold text-[#1d3a43] sm:text-5xl">
              把旅行中的每一段风景都留下来
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-[#4d7078] sm:text-base">
              上传照片或视频，记录旅途故事。登录后可进入管理页发布内容，首页自动展示最近更新。
            </p>
          </div>
          {session ? (
            <div className="flex flex-wrap gap-3">
              <>
                <Link
                  href="/admin"
                  className="rounded-full bg-[#2b8f83] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#23766d]"
                >
                  进入管理页
                </Link>
                <SignOutButton className="rounded-full border border-[#2b8f83] px-5 py-2.5 text-sm font-semibold text-[#2b8f83] transition hover:bg-[#2b8f83] hover:text-white">
                  退出登录
                </SignOutButton>
              </>
            </div>
          ) : null}
        </div>
      </header>

      <main className="mt-8 pb-10">
        {mediaList.length === 0 ? (
          <section className="glass-panel rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-semibold text-[#1d3a43]">
              还没有旅行内容
            </h2>
            <p className="mt-2 text-[#4d7078]">
              先登录后进入管理页，上传你的第一张照片或第一段视频。
            </p>
          </section>
        ) : (
          <>
            <section className="columns-1 gap-5 sm:columns-2 lg:columns-3">
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
                          src={`${item.accessUrl}#t=0.001`}
                        />
                      )}
                      <div className="p-4">
                        <h3 className="line-clamp-2-custom text-xl font-semibold text-[#1d3a43]">
                          {item.title}
                        </h3>
                        {item.location ? (
                          <p className="line-clamp-2-custom mt-1 text-sm text-[#4d7078]">
                            {item.location}
                          </p>
                        ) : null}
                        <p className="line-clamp-2-custom mt-2 text-xs text-[#5f7f86]">
                          {new Date(item.createdAt).toLocaleDateString('zh-CN')}
                        </p>
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
            </section>

            {totalPages > 1 ? (
              <nav className="mt-6 flex items-center justify-center gap-3 text-sm">
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
      </main>
    </div>
  )
}
