import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { error: '当前站点已关闭自助注册，请联系管理员创建账号。' },
    { status: 403 },
  )
}
