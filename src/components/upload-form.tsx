'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

import { BUILTIN_TAGS, normalizeTags } from '@/lib/tags'

type FormState = {
  message: string
  kind: 'error' | 'success' | 'idle'
}

const initialState: FormState = {
  message: '',
  kind: 'idle',
}

export function UploadForm() {
  const [state, setState] = useState<FormState>(initialState)
  const [selectedBuiltinTags, setSelectedBuiltinTags] = useState<string[]>([])
  const [customTags, setCustomTags] = useState<string[]>([])
  const [customTagInput, setCustomTagInput] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const allSelectedTags = normalizeTags([...selectedBuiltinTags, ...customTags])

  const toggleBuiltinTag = (tag: string) => {
    setSelectedBuiltinTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
    )
  }

  const addCustomTag = () => {
    const nextTags = normalizeTags([...customTags, customTagInput])
    setCustomTags(nextTags)
    setCustomTagInput('')
  }

  const removeCustomTag = (tag: string) => {
    setCustomTags((prev) => prev.filter((item) => item !== tag))
  }

  return (
    <form
      className="glass-panel mt-6 space-y-4 rounded-2xl p-5"
      onSubmit={(event) => {
        event.preventDefault()
        const formElement = event.currentTarget
        const formData = new FormData(formElement)

        startTransition(async () => {
          setState(initialState)

          const response = await fetch('/api/media/upload', {
            method: 'POST',
            body: formData,
          })

          const json = (await response.json()) as { error?: string }

          if (!response.ok) {
            setState({
              kind: 'error',
              message: json.error || '上传失败',
            })
            return
          }

          setState({
            kind: 'success',
            message: '上传成功，首页已更新。',
          })
          formElement.reset()
          setSelectedBuiltinTags([])
          setCustomTags([])
          setCustomTagInput('')
          router.refresh()
        })
      }}
    >
      <h2 className="text-2xl font-semibold text-[#1d3a43]">上传旅行内容</h2>

      <label className="block text-sm font-medium text-[#355861]">
        标题
        <input
          name="title"
          required
          maxLength={120}
          className="mt-1 w-full rounded-xl border border-[#b6d9d4] bg-white/85 px-3 py-2 outline-none ring-[#67b9ad] focus:ring"
          placeholder="例：巴厘岛的落日"
        />
      </label>

      <label className="block text-sm font-medium text-[#355861]">
        地点（可选）
        <input
          name="location"
          maxLength={120}
          className="mt-1 w-full rounded-xl border border-[#b6d9d4] bg-white/85 px-3 py-2 outline-none ring-[#67b9ad] focus:ring"
          placeholder="例：印度尼西亚 巴厘岛"
        />
      </label>

      <label className="block text-sm font-medium text-[#355861]">
        描述（可选）
        <textarea
          name="description"
          rows={3}
          maxLength={600}
          className="mt-1 w-full rounded-xl border border-[#b6d9d4] bg-white/85 px-3 py-2 outline-none ring-[#67b9ad] focus:ring"
          placeholder="写下这段旅途的小故事"
        />
      </label>

      <div className="space-y-3">
        <p className="text-sm font-medium text-[#355861]">标签（可多选）</p>
        <div className="flex flex-wrap gap-2">
          {BUILTIN_TAGS.map((tag) => {
            const active = selectedBuiltinTags.includes(tag)

            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleBuiltinTag(tag)}
                className={`rounded-full border px-3 py-1 text-sm transition ${
                  active
                    ? 'border-[#2b8f83] bg-[#2b8f83] text-white'
                    : 'border-[#b6d9d4] bg-white/80 text-[#355861] hover:border-[#2b8f83]'
                }`}
              >
                {tag}
              </button>
            )
          })}
        </div>

        <div className="flex gap-2">
          <input
            value={customTagInput}
            onChange={(event) => setCustomTagInput(event.target.value)}
            maxLength={20}
            className="w-full rounded-xl border border-[#b6d9d4] bg-white/85 px-3 py-2 text-sm outline-none ring-[#67b9ad] focus:ring"
            placeholder="添加自定义标签，按回车或点添加"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                addCustomTag()
              }
            }}
          />
          <button
            type="button"
            onClick={addCustomTag}
            className="rounded-xl bg-[#2b8f83] px-4 py-2 text-sm font-semibold text-white hover:bg-[#23766d]"
          >
            添加
          </button>
        </div>

        {allSelectedTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {allSelectedTags.map((tag) => {
              const isBuiltin = BUILTIN_TAGS.includes(
                tag as (typeof BUILTIN_TAGS)[number],
              )

              return (
                <div
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full border border-[#b6d9d4] bg-white/80 px-3 py-1 text-xs text-[#355861]"
                >
                  <span>{tag}</span>
                  {!isBuiltin ? (
                    <button
                      type="button"
                      onClick={() => removeCustomTag(tag)}
                      className="text-[#2b8f83]"
                    >
                      x
                    </button>
                  ) : null}
                </div>
              )
            })}
          </div>
        ) : null}

        {allSelectedTags.map((tag) => (
          <input key={tag} type="hidden" name="tags" value={tag} />
        ))}
      </div>

      <label className="block text-sm font-medium text-[#355861]">
        图片或视频
        <input
          name="file"
          type="file"
          required
          accept="image/*,video/*"
          className="mt-1 block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-[#2b8f83] file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-[#23766d]"
        />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-[#2b8f83] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#23766d] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? '上传中...' : '发布内容'}
      </button>

      {state.kind !== 'idle' ? (
        <p
          className={
            state.kind === 'error'
              ? 'text-sm text-red-600'
              : 'text-sm text-green-700'
          }
        >
          {state.message}
        </p>
      ) : null}
    </form>
  )
}
