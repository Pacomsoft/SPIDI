"use client"

import { HomeView } from "@/modules/adm/application/presentation/views/home.view"
import { createAdmModule } from "@/modules/adm/infrastructure/dependency-injection"

const admModule = createAdmModule()

export default function AdminHomePage() {
  return (
    <HomeView
      getSessionInfoUseCase={admModule.useCases.getSessionInfo}
      sessionPort={admModule.sessionAdapter}
    />
  )
}
