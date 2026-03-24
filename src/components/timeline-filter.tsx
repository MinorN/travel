'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DayPicker } from 'react-day-picker'
import type { DateRange } from 'react-day-picker'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import 'react-day-picker/dist/style.css'

type TimelineFilterProps = {
  availableYears: number[]
  availableTags: string[]
  initialStartDate?: string
  initialEndDate?: string
  initialTags: string[]
}

function parseDateParam(value?: string) {
  if (!value) {
    return undefined
  }

  const parsed = new Date(`${value}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

function formatDateParam(date?: Date) {
  if (!date) {
    return undefined
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function TimelineFilter({
  availableYears,
  availableTags,
  initialStartDate,
  initialEndDate,
  initialTags,
}: TimelineFilterProps) {
  const router = useRouter()
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>({
    from: parseDateParam(initialStartDate),
    to: parseDateParam(initialEndDate),
  })
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags)

  const startMonth = useMemo(() => {
    if (availableYears.length === 0) {
      return new Date(new Date().getFullYear() - 2, 0, 1)
    }
    return new Date(Math.min(...availableYears), 0, 1)
  }, [availableYears])

  const endMonth = useMemo(() => {
    if (availableYears.length === 0) {
      return new Date(new Date().getFullYear() + 1, 11, 1)
    }
    return new Date(Math.max(...availableYears), 11, 1)
  }, [availableYears])

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
    )
  }

  const applyFilters = () => {
    const params = new URLSearchParams()

    const from = formatDateParam(selectedRange?.from)
    const to = formatDateParam(selectedRange?.to)

    if (from) {
      params.set('start', from)
    }

    if (to) {
      params.set('end', to)
    }

    if (selectedTags.length > 0) {
      params.set('tags', selectedTags.join(','))
    }

    const query = params.toString()
    router.push(query ? `/timeline?${query}` : '/timeline')
  }

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,330px)_minmax(0,1fr)]">
      <div className="rounded-2xl border border-[#b6d9d4] bg-white/75 p-4">
        <p className="text-sm font-medium text-[#355861]">
          时间筛选（开始 - 结束）
        </p>
        <DayPicker
          mode="range"
          selected={selectedRange}
          onSelect={setSelectedRange}
          locale={zhCN}
          captionLayout="dropdown"
          fromYear={
            availableYears.length > 0 ? Math.min(...availableYears) : 2000
          }
          toYear={
            availableYears.length > 0
              ? Math.max(...availableYears)
              : new Date().getFullYear() + 1
          }
          formatters={{
            formatCaption: (date) =>
              format(date, 'yyyy年M月', { locale: zhCN }),
          }}
          showOutsideDays
          startMonth={startMonth}
          endMonth={endMonth}
          className="timeline-daypicker mt-3 w-full"
        />
        <p className="mt-2 text-xs text-[#5f7f86]">
          {selectedRange?.from
            ? `开始：${formatDateParam(selectedRange.from)}`
            : '开始：未选择'}
          {' · '}
          {selectedRange?.to
            ? `结束：${formatDateParam(selectedRange.to)}`
            : '结束：未选择'}
        </p>
      </div>

      <div className="rounded-2xl border border-[#b6d9d4] bg-white/75 p-4">
        <p className="text-sm font-medium text-[#355861]">标签筛选（可多选）</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {availableTags.length === 0 ? (
            <p className="text-sm text-[#5f7f86]">暂无可筛选标签</p>
          ) : (
            availableTags.map((tag) => {
              const active = selectedTags.includes(tag)

              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full border px-3 py-1 text-sm transition ${
                    active
                      ? 'border-[#2b8f83] bg-[#2b8f83] text-white'
                      : 'border-[#b6d9d4] bg-white text-[#355861] hover:border-[#2b8f83]'
                  }`}
                >
                  #{tag}
                </button>
              )
            })
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={applyFilters}
            className="rounded-full bg-[#2b8f83] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#23766d]"
          >
            应用筛选
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedRange(undefined)
              setSelectedTags([])
              router.push('/timeline')
            }}
            className="rounded-full border border-[#2b8f83] px-5 py-2.5 text-sm font-semibold text-[#2b8f83] transition hover:bg-[#2b8f83] hover:text-white"
          >
            重置
          </button>
        </div>
      </div>
    </div>
  )
}
