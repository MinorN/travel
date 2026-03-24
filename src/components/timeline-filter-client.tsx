'use client'

import dynamic from 'next/dynamic'

type TimelineFilterProps = {
  availableYears: number[]
  availableTags: string[]
  initialStartDate?: string
  initialEndDate?: string
  initialTags: string[]
}

const TimelineFilterNoSSR = dynamic(
  () =>
    import('@/components/timeline-filter').then((mod) => mod.TimelineFilter),
  {
    ssr: false,
    loading: () => (
      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-[#b6d9d4] bg-white/75 p-4">
          <p className="text-sm font-medium text-[#355861]">时间筛选</p>
          <p className="mt-3 text-sm text-[#5f7f86]">筛选组件加载中...</p>
        </div>
        <div className="rounded-2xl border border-[#b6d9d4] bg-white/75 p-4">
          <p className="text-sm font-medium text-[#355861]">
            标签筛选（可多选）
          </p>
          <p className="mt-3 text-sm text-[#5f7f86]">筛选组件加载中...</p>
        </div>
      </div>
    ),
  },
)

export function TimelineFilterClient(props: TimelineFilterProps) {
  return <TimelineFilterNoSSR {...props} />
}
