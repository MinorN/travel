'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { signIn } from 'next-auth/react'

export default function LoginPage() {
  const router = useRouter()
  const callbackUrl = '/admin'

  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')

    const formData = new FormData(event.currentTarget)
    const email = formData.get('email')?.toString() ?? ''
    const password = formData.get('password')?.toString() ?? ''

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
      callbackUrl,
    })

    if (!result || result.error) {
      setError('邮箱或密码错误')
      setIsSubmitting(false)
      return
    }

    router.push(result.url || '/admin')
    router.refresh()
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 py-12 sm:px-6">
      <section className="glass-panel rounded-3xl p-6 sm:p-8">
        <h1 className="text-3xl font-semibold text-[#1d3a43]">登录</h1>
        <p className="mt-2 text-sm text-[#4d7078]">
          使用邮箱密码进入旅行内容管理台。
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-[#355861]">
            邮箱
            <input
              type="email"
              name="email"
              required
              className="mt-1 w-full rounded-xl border border-[#b6d9d4] bg-white/85 px-3 py-2 outline-none ring-[#67b9ad] focus:ring"
              placeholder="you@example.com"
            />
          </label>

          <label className="block text-sm font-medium text-[#355861]">
            密码
            <input
              type="password"
              name="password"
              required
              minLength={8}
              className="mt-1 w-full rounded-xl border border-[#b6d9d4] bg-white/85 px-3 py-2 outline-none ring-[#67b9ad] focus:ring"
              placeholder="至少 8 位"
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-[#2b8f83] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#23766d] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? '登录中...' : '登录'}
          </button>
        </form>

        <p className="mt-4 text-sm text-[#4d7078]">
          当前不开放自助注册，如需新账号请联系管理员创建。
        </p>
      </section>
    </main>
  )
}
