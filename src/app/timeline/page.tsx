import Link from 'next/link'
import Image from 'next/image'

import { TimelineFilterClient } from '@/components/timeline-filter-client'
import { getSignedCosUrl } from '@/lib/cos'
import { prisma } from '@/lib/prisma'
import { parseTags } from '@/lib/tags'

type TimelinePageProps = {
  searchParams: Promise<{
    start?: string
    end?: string
    tags?: string
  }>
}

function parseDateParam(value?: string) {
  if (!value) {
    return undefined
  }

  const parsed = new Date(`${value}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0)
}

function nextDay(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + 1,
    0,
    0,
    0,
  )
}

function buildDateRange(start?: Date, end?: Date) {
  if (!start && !end) {
    return undefined
  }

  if (start && end) {
    const from = start <= end ? start : end
    const to = start <= end ? end : start
    return {
      gte: startOfDay(from),
      lt: nextDay(to),
    }
  }

  if (start) {
    return {
      gte: startOfDay(start),
    }
  }

  return {
    lt: nextDay(end as Date),
  }
}

function toMonthKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function toMonthLabel(key: string) {
  const [year, month] = key.split('-')
  return `${year}年${Number(month)}月`
}

export default async function TimelinePage({
  searchParams,
}: TimelinePageProps) {
  const query = await searchParams
  const selectedStartDate = parseDateParam(query.start)
  const selectedEndDate = parseDateParam(query.end)
  const selectedTags = (query.tags || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)

  const where = {
    createdAt: buildDateRange(selectedStartDate, selectedEndDate),
  }

  const allMediaMeta = await prisma.media.findMany({
    select: { createdAt: true, tags: true },
    orderBy: { createdAt: 'desc' },
  })

  const availableYears = Array.from(
    new Set(allMediaMeta.map((item) => item.createdAt.getFullYear())),
  ).sort((a, b) => b - a)

  const availableTags = Array.from(
    new Set(allMediaMeta.flatMap((item) => parseTags(item.tags))),
  ).sort((a, b) => a.localeCompare(b, 'zh-CN'))

  const mediaList = await prisma.media.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  const displayList = mediaList.map((item) => ({
    ...item,
    accessUrl: getSignedCosUrl(item.publicId, item.url),
    tags: parseTags(item.tags),
  }))

  const filteredByTag =
    selectedTags.length === 0
      ? displayList
      : displayList.filter((item) =>
          item.tags.some((tag) => selectedTags.includes(tag)),
        )

  const grouped = filteredByTag.reduce(
    (acc, item) => {
      const key = toMonthKey(item.createdAt)
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(item)
      return acc
    },
    {} as Record<string, typeof displayList>,
  )

  const monthKeys = Object.keys(grouped).sort((a, b) => (a > b ? -1 : 1))

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="glass-panel rounded-3xl p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-[#2b8f83]">
              时间线
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-[#1d3a43]">
              按时间浏览旅途记录
            </h1>
          </div>
          <Link
            href="/"
            className="rounded-full border border-[#2b8f83] px-4 py-2 text-sm font-semibold text-[#2b8f83] transition hover:bg-[#2b8f83] hover:text-white"
          >
            返回首页
          </Link>
        </div>

        <TimelineFilterClient
          availableYears={availableYears}
          availableTags={availableTags}
          initialStartDate={query.start}
          initialEndDate={query.end}
          initialTags={selectedTags}
        />
      </section>

      {filteredByTag.length === 0 ? (
        <section className="glass-panel mt-6 rounded-3xl p-8 text-center text-sm text-[#4d7078]">
          没有符合该时间条件的内容。
        </section>
      ) : (
        <section className="mt-6 space-y-8">
          {monthKeys.map((monthKey) => (
            <div key={monthKey} className="glass-panel rounded-3xl p-5 sm:p-6">
              <h2 className="text-xl font-semibold text-[#1d3a43]">
                {toMonthLabel(monthKey)}
              </h2>
              <div className="mt-4 columns-1 gap-5 sm:columns-2 lg:columns-3">
                {grouped[monthKey].map((item) => (
                  <Link
                    key={item.id}
                    href={`/media/${item.id}`}
                    className="group mb-5 block break-inside-avoid"
                  >
                    <article className="glass-panel overflow-hidden rounded-2xl transition-transform duration-300 ease-out group-hover:scale-[1.02]">
                      {item.type === 'IMAGE' ? (
                        <div className="relative h-56 w-full">
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
                          className="h-56 w-full object-cover"
                          preload="metadata"
                          src={item.accessUrl}
                        />
                      )}

                      <div className="p-4">
                        <h3 className="line-clamp-2-custom text-lg font-semibold text-[#1d3a43]">
                          {item.title}
                        </h3>
                        <p className="mt-2 text-xs text-[#5f7f86]">
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
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
    </main>
  )
}
