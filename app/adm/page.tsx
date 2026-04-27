"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { initSessionRepository } from "@/lib/auth"
import { createGetHomePageUseCase } from "@/modules/adm/infrastructure/dependency-injection"

const getHomePageUseCase = createGetHomePageUseCase()

export default function AdminRootPage() {
  const router = useRouter()

  useEffect(() => {
    const redirect = async () => {
      await initSessionRepository()
      const result = await getHomePageUseCase.execute()
      router.replace(result.homePage)
    }
    redirect()
  }, [router])

  return null
}
